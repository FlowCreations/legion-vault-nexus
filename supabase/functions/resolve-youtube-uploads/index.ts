// Resolve a YouTube channel/handle URL to its full upload list using public
// Piped API instances (privacy-respecting YouTube frontends). No API key.
// POST { url, force? } -> { channelId, channelTitle, videos, source, cached }
//
// Caching strategy (fast loads, low rate-limit pressure):
//   1. In-memory cache per edge instance — 60s hot path.
//   2. Postgres `youtube_channel_cache` — 6h fresh window, 24h stale-while-revalidate.
//      Stale hits return cached data immediately and refresh in the background
//      via EdgeRuntime.waitUntil so the client never waits on Piped.
//   3. Piped pagination is parallelized across tabs and uses host-failover when
//      a mirror rate-limits or times out.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const PIPED_HOSTS = [
  "api.piped.private.coffee",
  "pipedapi.kavin.rocks",
  "pipedapi.adminforge.de",
  "pipedapi.r4fo.com",
  "pipedapi.leptons.xyz",
];

const FRESH_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — served stale while refreshing
const MEMORY_TTL_MS = 60 * 1000; // 60s
const TAB_PAGE_LIMIT = 25;
const HOME_PAGE_LIMIT = 20;

type VideoKind = "short" | "live" | "video";
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  duration?: number;
  kind: VideoKind;
};
type CachedPayload = {
  channelId: string;
  channelTitle: string;
  videos: Video[];
  source: string | null;
};

// Per-instance in-memory cache.
const memCache = new Map<string, { at: number; data: CachedPayload }>();
// Coalesce concurrent refreshes for the same channel.
const inFlight = new Map<string, Promise<CachedPayload | null>>();
// Track hosts that recently rate-limited so we skip them temporarily.
const hostCooldown = new Map<string, number>();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;
function background(p: Promise<unknown>) {
  try {
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(p);
    } else {
      p.catch(() => {});
    }
  } catch {
    p.catch(() => {});
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url, force } = await req.json();
    if (!url || typeof url !== "string")
      return json({ error: "url required" }, 400);

    const channelId = await resolveChannelId(url);
    if (!channelId) return json({ error: "channel not found" }, 404);

    // 1. Memory cache (skip when force).
    if (!force) {
      const mem = memCache.get(channelId);
      if (mem && Date.now() - mem.at < MEMORY_TTL_MS) {
        return json({ ...mem.data, cached: "memory" });
      }
    }

    // 2. DB cache: fresh => return; stale => return + refresh in background.
    if (!force) {
      const row = await readDbCache(channelId);
      if (row) {
        const age = Date.now() - new Date(row.refreshed_at).getTime();
        if (age < FRESH_TTL_MS) {
          memCache.set(channelId, { at: Date.now(), data: row.payload });
          return json({ ...row.payload, cached: "db" });
        }
        if (age < STALE_TTL_MS) {
          memCache.set(channelId, { at: Date.now(), data: row.payload });
          background(refreshAndStore(channelId));
          return json({ ...row.payload, cached: "stale" });
        }
      }
    }

    // 3. No usable cache — fetch now (coalesced).
    const data = await refreshAndStore(channelId);
    if (!data) {
      return json(
        { error: "no videos found", channelId, channelTitle: "YouTube", videos: [] },
        200
      );
    }
    return json({ ...data, cached: "miss" });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function refreshAndStore(channelId: string): Promise<CachedPayload | null> {
  const existing = inFlight.get(channelId);
  if (existing) return existing;
  const p = (async () => {
    const data = await fetchChannelFromPiped(channelId);
    if (data && data.videos.length > 0) {
      memCache.set(channelId, { at: Date.now(), data });
      await writeDbCache(channelId, data);
    }
    return data;
  })().finally(() => inFlight.delete(channelId));
  inFlight.set(channelId, p);
  return p;
}

async function readDbCache(channelId: string) {
  try {
    const { data } = await admin
      .from("youtube_channel_cache")
      .select("channel_title, payload, refreshed_at")
      .eq("channel_id", channelId)
      .maybeSingle();
    return data as
      | { channel_title: string; payload: CachedPayload; refreshed_at: string }
      | null;
  } catch {
    return null;
  }
}

async function writeDbCache(channelId: string, payload: CachedPayload) {
  try {
    await admin.from("youtube_channel_cache").upsert(
      {
        channel_id: channelId,
        channel_title: payload.channelTitle,
        payload,
        video_count: payload.videos.length,
        source: payload.source,
        refreshed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + FRESH_TTL_MS).toISOString(),
      },
      { onConflict: "channel_id" }
    );
  } catch {
    /* best effort */
  }
}

async function fetchChannelFromPiped(
  channelId: string
): Promise<CachedPayload | null> {
  let channelTitle = "YouTube";
  const collected = new Map<string, Video>();
  let usedHost: string | null = null;

  for (const host of activeHosts()) {
    try {
      const rootRes = await fetch(`https://${host}/channel/${channelId}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (rootRes.status === 429) {
        cooldown(host, 5 * 60 * 1000);
        continue;
      }
      if (!rootRes.ok) continue;
      const root = await rootRes.json();
      if (!root?.id) continue;

      usedHost = host;
      channelTitle = root.name ?? channelTitle;

      ingestStreams(root.relatedStreams ?? [], collected, null);

      // Paginate Home + each tab in parallel.
      const tasks: Promise<unknown>[] = [];

      tasks.push(
        paginate(
          root.nextpage ?? null,
          HOME_PAGE_LIMIT,
          (np) => fetchNext(host, channelId, np),
          (page) => ingestStreams(page?.relatedStreams ?? [], collected, null)
        )
      );

      for (const tab of root.tabs ?? []) {
        if (!tab?.data) continue;
        const tabName = String(tab.name ?? "").toLowerCase();
        tasks.push(
          (async () => {
            const first = await fetchTab(host, tab.data);
            if (!first) return;
            ingestStreams(first.content ?? [], collected, tabName);
            await paginate(
              first.nextpage ?? null,
              TAB_PAGE_LIMIT,
              (np) => fetchTabNext(host, tab.data, np),
              (page) => ingestStreams(page?.content ?? [], collected, tabName)
            );
          })()
        );
      }

      await Promise.all(tasks);
      if (collected.size > 0) break;
    } catch {
      /* try next host */
    }
  }

  // RSS freshness merge (cheap, always run).
  try {
    const feedRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) }
    );
    if (feedRes.ok) {
      const xml = await feedRes.text();
      const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
      let entry: RegExpExecArray | null;
      while ((entry = entryRe.exec(xml)) !== null) {
        const block = entry[1];
        const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        if (!id) continue;
        const isoPub = block.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
        const title = decodeXml(block.match(/<title>([^<]+)<\/title>/)?.[1] ?? "");
        const existing = collected.get(id);
        if (existing) {
          if (isoPub) existing.published = isoPub;
        } else {
          collected.set(id, {
            id,
            title,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            published: isoPub,
            kind: "video",
          });
        }
      }
    }
  } catch {
    /* ignore */
  }

  if (collected.size === 0) return null;

  const videos = Array.from(collected.values()).sort((a, b) => {
    const ad = Date.parse(a.published);
    const bd = Date.parse(b.published);
    if (isNaN(ad) && isNaN(bd)) return 0;
    if (isNaN(ad)) return 1;
    if (isNaN(bd)) return -1;
    return bd - ad;
  });

  return { channelId, channelTitle, videos, source: usedHost };
}

// Walk pagination sequentially (each page depends on the previous nextpage token)
// but in parallel across the tabs that own each walk.
async function paginate(
  startToken: string | null,
  limit: number,
  fetchPage: (token: string) => Promise<any>,
  onPage: (page: any) => void
) {
  let token: string | null = startToken;
  let i = 0;
  while (token && i < limit) {
    const page = await fetchPage(token);
    if (!page) break;
    onPage(page);
    token = page.nextpage ?? null;
    i++;
  }
}

function activeHosts(): string[] {
  const now = Date.now();
  return PIPED_HOSTS.filter((h) => (hostCooldown.get(h) ?? 0) <= now);
}
function cooldown(host: string, ms: number) {
  hostCooldown.set(host, Date.now() + ms);
}

async function resolveChannelId(url: string): Promise<string | null> {
  const direct = url.match(/\/channel\/(UC[\w-]+)/);
  if (direct) return direct[1];

  for (const host of activeHosts()) {
    try {
      const m = url.match(/youtube\.com\/(@[^/?#]+|c\/[^/?#]+|user\/[^/?#]+)/);
      if (!m) break;
      const res = await fetch(
        `https://${host}/channel/${encodeURIComponent(m[1])}`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (res.status === 429) {
        cooldown(host, 5 * 60 * 1000);
        continue;
      }
      if (res.ok) {
        const d = await res.json();
        if (d?.id?.startsWith("UC")) return d.id;
      }
    } catch {
      /* next host */
    }
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en" },
    });
    const html = await res.text();
    const m =
      html.match(/"externalId":"(UC[\w-]+)"/) ||
      html.match(/"channelId":"(UC[\w-]+)"/);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  return null;
}

async function fetchNext(host: string, channelId: string, nextpage: string) {
  try {
    const res = await fetch(
      `https://${host}/nextpage/channel/${channelId}?nextpage=${encodeURIComponent(
        nextpage
      )}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.status === 429) cooldown(host, 5 * 60 * 1000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTab(host: string, data: string) {
  try {
    const res = await fetch(
      `https://${host}/channels/tabs?data=${encodeURIComponent(data)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.status === 429) cooldown(host, 5 * 60 * 1000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTabNext(host: string, data: string, nextpage: string) {
  try {
    const res = await fetch(
      `https://${host}/channels/tabs?data=${encodeURIComponent(
        data
      )}&nextpage=${encodeURIComponent(nextpage)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.status === 429) cooldown(host, 5 * 60 * 1000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ingestStreams(
  streams: any[],
  out: Map<string, Video>,
  tabName: string | null
) {
  const tabIsShorts = !!tabName && tabName.includes("short");
  const tabIsLive =
    !!tabName && (tabName.includes("live") || tabName.includes("stream"));
  for (const s of streams ?? []) {
    if (!s) continue;
    const urlStr = String(s.url ?? "");
    const idMatch =
      urlStr.match(/[?&]v=([\w-]{11})/) ||
      urlStr.match(/\/(?:shorts|embed)\/([\w-]{11})/);
    const id = idMatch?.[1];
    if (!id) continue;

    const duration = typeof s.duration === "number" ? s.duration : undefined;
    const urlIsShort = /\/shorts\//.test(urlStr);
    const typeStr = String(s.type ?? "").toLowerCase();
    const isShort =
      !!s.isShort ||
      tabIsShorts ||
      urlIsShort ||
      (typeof duration === "number" && duration > 0 && duration <= 60);
    const isLive =
      tabIsLive ||
      typeStr === "stream" ||
      typeStr === "livestream" ||
      !!s.isLive ||
      !!s.isLiveStream;
    const kind: VideoKind = isShort ? "short" : isLive ? "live" : "video";

    const existing = out.get(id);
    if (existing) {
      if (kind === "short") existing.kind = "short";
      else if (kind === "live" && existing.kind === "video") existing.kind = "live";
      if (existing.duration == null && duration != null)
        existing.duration = duration;
      continue;
    }

    const uploaded =
      typeof s.uploaded === "number" && s.uploaded > 0
        ? new Date(s.uploaded).toISOString()
        : s.uploadedDate ?? "";
    out.set(id, {
      id,
      title: s.title ?? "",
      thumbnail:
        proxiedToDirect(s.thumbnail) ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: uploaded,
      duration,
      kind,
    });
  }
}

function proxiedToDirect(thumb?: string): string | null {
  if (!thumb) return null;
  const m = thumb.match(/\/vi(?:_webp)?\/([\w-]{11})\//);
  if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  return thumb.startsWith("http") ? thumb : null;
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
