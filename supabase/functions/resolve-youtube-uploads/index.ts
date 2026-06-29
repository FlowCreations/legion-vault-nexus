// Resolve a YouTube channel/handle URL to its full upload list.
// POST { url, force? } -> { channelId, channelTitle, videos, source, cached }
//
// Strategy:
//   1. Memory cache (60s) and Postgres cache (6h fresh / 24h stale-while-revalidate).
//   2. Primary fetch: scrape YouTube directly per tab (videos / shorts / streams)
//      using the public InnerTube continuation API. This gives us exact per-tab
//      classification (Piped collapses everything into the shorts tab for some
//      channels) and full pagination without an API key.
//   3. Fallback: Piped public mirrors if YouTube scraping yields nothing.
//   4. RSS merge for freshness on top of either source.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const YT_HEADERS: HeadersInit = {
  "User-Agent": UA,
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "SOCS=CAI; CONSENT=YES+1",
};

const PIPED_HOSTS = [
  "api.piped.private.coffee",
  "pipedapi.kavin.rocks",
  "pipedapi.adminforge.de",
  "pipedapi.r4fo.com",
  "pipedapi.leptons.xyz",
];

const FRESH_TTL_MS = 6 * 60 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const MEMORY_TTL_MS = 60 * 1000;
const CONTINUATION_LIMIT = 30; // pages per tab — ~30 * 30 items = 900

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

const memCache = new Map<string, { at: number; data: CachedPayload }>();
const inFlight = new Map<string, Promise<CachedPayload | null>>();
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
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(p);
    else p.catch(() => {});
  } catch {
    p.catch(() => {});
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url, force } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "url required" }, 400);

    const channelId = await resolveChannelId(url);
    if (!channelId) return json({ error: "channel not found" }, 404);

    if (!force) {
      const mem = memCache.get(channelId);
      if (mem && Date.now() - mem.at < MEMORY_TTL_MS)
        return json({ ...mem.data, cached: "memory" });

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

    const data = await refreshAndStore(channelId);
    if (!data)
      return json(
        { error: "no videos found", channelId, channelTitle: "YouTube", videos: [] },
        200
      );
    return json({ ...data, cached: "miss" });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function refreshAndStore(channelId: string): Promise<CachedPayload | null> {
  const existing = inFlight.get(channelId);
  if (existing) return existing;
  const p = (async () => {
    let data = await scrapeYouTubeChannel(channelId);
    if (!data || data.videos.length === 0) {
      const piped = await fetchChannelFromPiped(channelId);
      if (piped && piped.videos.length > 0) data = piped;
    }
    if (data) await mergeRss(channelId, data);
    if (data && data.videos.length > 0) {
      data.videos.sort(sortByPublished);
      memCache.set(channelId, { at: Date.now(), data });
      await writeDbCache(channelId, data);
    }
    return data;
  })().finally(() => inFlight.delete(channelId));
  inFlight.set(channelId, p);
  return p;
}

// ---------- YouTube direct scrape (primary) ----------

async function scrapeYouTubeChannel(channelId: string): Promise<CachedPayload | null> {
  const out = new Map<string, Video>();
  let channelTitle = "YouTube";
  const tabs: Array<{ path: string; kind: VideoKind }> = [
    { path: "videos", kind: "video" },
    { path: "shorts", kind: "short" },
    { path: "streams", kind: "live" },
  ];

  await Promise.all(
    tabs.map(async ({ path, kind }) => {
      try {
        const res = await scrapeTab(channelId, path, kind);
        console.log(`tab ${path} yielded ${res.videos.length} items`);
        if (res.channelTitle) channelTitle = res.channelTitle;
        for (const v of res.videos) {
          const existing = out.get(v.id);
          if (!existing) out.set(v.id, v);
          else {
            // Tab-derived kind is authoritative: video < live < short ordering matters
            // less than "tab said so". We trust the most specific tab.
            if (kind === "short") existing.kind = "short";
            else if (kind === "live" && existing.kind === "video") existing.kind = "live";
            if (existing.duration == null && v.duration != null) existing.duration = v.duration;
            if (!existing.published && v.published) existing.published = v.published;
          }
        }
      } catch (e) {
        console.error(`yt scrape ${path} failed:`, (e as Error).message);
      }
    })
  );

  if (out.size === 0) return null;
  return {
    channelId,
    channelTitle,
    videos: Array.from(out.values()),
    source: "youtube",
  };
}

async function scrapeTab(
  channelId: string,
  tab: string,
  kind: VideoKind
): Promise<{ channelTitle: string; videos: Video[] }> {
  const url = `https://www.youtube.com/channel/${channelId}/${tab}`;
  const html = await (
    await fetch(url, { headers: YT_HEADERS, signal: AbortSignal.timeout(12000) })
  ).text();

  const initial = extractJson(html, 'var ytInitialData = ', ';</script>');
  if (!initial) return { channelTitle: "", videos: [] };

  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? "2.20240101.00.00";
  const clientName = html.match(/"INNERTUBE_CLIENT_NAME":"([^"]+)"/)?.[1] ?? "WEB";
  const visitorData = html.match(/"VISITOR_DATA":"([^"]+)"/)?.[1];

  const channelTitle: string =
    initial?.metadata?.channelMetadataRenderer?.title ??
    initial?.header?.c4TabbedHeaderRenderer?.title ??
    initial?.header?.pageHeaderRenderer?.pageTitle ?? "";

  const videos: Video[] = [];
  harvest(initial, kind, videos);
  let token = findNextContinuation(initial);

  let page = 0;
  while (token && apiKey && page < CONTINUATION_LIMIT) {
    const body = {
      context: {
        client: {
          clientName,
          clientVersion,
          hl: "en",
          gl: "US",
          visitorData,
        },
      },
      continuation: token,
    };
    let next: any = null;
    try {
      const r = await fetch(
        `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`,
        {
          method: "POST",
          headers: { ...YT_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!r.ok) break;
      next = await r.json();
    } catch {
      break;
    }
    const before = videos.length;
    harvest(next, kind, videos);
    token = findNextContinuation(next);
    if (videos.length === before) break;
    page++;
  }

  // Dedupe within tab.
  const seen = new Set<string>();
  const deduped = videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  return { channelTitle, videos: deduped };
}

function harvest(node: any, fallbackKind: VideoKind, out: Video[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const x of node) harvest(x, fallbackKind, out);
    return;
  }

  // videoRenderer / gridVideoRenderer
  const vr = node.videoRenderer || node.gridVideoRenderer || node.playlistVideoRenderer;
  if (vr && vr.videoId) {
    const id: string = vr.videoId;
    const title = textOf(vr.title);
    const thumb =
      vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const lenSec = vr.lengthSeconds ? parseInt(vr.lengthSeconds, 10) : parseDuration(textOf(vr.lengthText));
    const publishedText = textOf(vr.publishedTimeText);
    const isLiveBadge =
      (vr.badges ?? []).some((b: any) => {
        const s = b?.metadataBadgeRenderer?.style ?? "";
        return s.includes("LIVE");
      }) ||
      (vr.thumbnailOverlays ?? []).some((o: any) => {
        const s = o?.thumbnailOverlayTimeStatusRenderer?.style ?? "";
        return s === "LIVE" || s === "UPCOMING";
      });
    let kind: VideoKind = fallbackKind;
    if (isLiveBadge) kind = "live";
    if (kind === "video" && lenSec && lenSec > 0 && lenSec <= 60) {
      // long-form tab but <=60s → still video (don't auto-demote)
    }
    if (id && title) {
      out.push({
        id,
        title,
        thumbnail: thumb,
        published: publishedText ?? "",
        duration: isFinite(lenSec as number) ? (lenSec as number) : undefined,
        kind,
      });
    }
  }

  // shortsLockupViewModel
  if (node.shortsLockupViewModel) {
    const r = node.shortsLockupViewModel;
    const id: string | undefined =
      r.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ??
      r.entityId?.match(/shorts-shelf-item-([\w-]{11})/)?.[1];
    const title: string | undefined =
      r.overlayMetadata?.primaryText?.content ??
      r.accessibilityText;
    const thumb: string | undefined = r.thumbnail?.sources?.slice(-1)?.[0]?.url;
    if (id && title) {
      out.push({
        id,
        title,
        thumbnail: thumb ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        published: "",
        kind: "short",
      });
    }
  }

  // reelItemRenderer (older shorts shape)
  if (node.reelItemRenderer?.videoId) {
    const r = node.reelItemRenderer;
    const id = r.videoId;
    const title = textOf(r.headline);
    const thumb =
      r.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    if (title) {
      out.push({ id, title, thumbnail: thumb, published: "", kind: "short" });
    }
  }

  // lockupViewModel (modern channel page format for both long-form and shorts)
  if (node.lockupViewModel) {
    const r = node.lockupViewModel;
    const id: string | undefined = r.contentId;
    const title: string | undefined =
      r.metadata?.lockupMetadataViewModel?.title?.content ??
      (typeof r.metadata?.lockupMetadataViewModel?.title === "string"
        ? r.metadata.lockupMetadataViewModel.title
        : undefined);
    const sources = r.contentImage?.thumbnailViewModel?.image?.sources ?? [];
    const thumb =
      sources?.slice(-1)?.[0]?.url ??
      (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined);
    const ct: string = String(r.contentType ?? "");
    let kind: VideoKind = fallbackKind;
    if (ct.includes("SHORT")) kind = "short";
    else if (ct.includes("LIVE") || ct.includes("STREAM")) kind = "live";
    else if (ct.includes("VIDEO")) kind = "video";

    // Pull duration from the bottom-overlay badge text ("3:23")
    let duration: number | undefined;
    const overlays = r.contentImage?.thumbnailViewModel?.overlays ?? [];
    for (const o of overlays) {
      const badges = o?.thumbnailBottomOverlayViewModel?.badges ?? [];
      for (const b of badges) {
        const t = b?.thumbnailBadgeViewModel?.text;
        if (t && /^\d{1,2}(:\d{2}){1,2}$/.test(t)) {
          duration = parseDuration(t);
          break;
        }
        // LIVE badge
        const accLabel =
          b?.thumbnailBadgeViewModel?.rendererContext?.accessibilityContext?.label ?? "";
        if (typeof accLabel === "string" && accLabel.toUpperCase().includes("LIVE")) {
          kind = "live";
        }
      }
      if (duration != null) break;
    }

    if (id && title) {
      out.push({
        id,
        title,
        thumbnail: thumb ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        published: "",
        duration,
        kind,
      });
    }
  }



  for (const k in node) {
    if (
      k === "videoRenderer" ||
      k === "gridVideoRenderer" ||
      k === "playlistVideoRenderer" ||
      k === "shortsLockupViewModel" ||
      k === "reelItemRenderer" ||
      k === "lockupViewModel"
    )
      continue;
    harvest(node[k], fallbackKind, out);
  }
}


function findNextContinuation(node: any): string | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const x of node) {
      const t = findNextContinuation(x);
      if (t) return t;
    }
    return null;
  }
  const tok = node.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
  if (tok) return tok;
  for (const k in node) {
    const t = findNextContinuation(node[k]);
    if (t) return t;
  }
  return null;
}

function textOf(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v.simpleText) return v.simpleText;
  if (Array.isArray(v.runs)) return v.runs.map((r: any) => r?.text ?? "").join("");
  return "";
}

function parseDuration(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const parts = text.split(":").map((n) => parseInt(n, 10));
  if (parts.some((n) => isNaN(n))) return undefined;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function extractJson(html: string, start: string, end: string): any | null {
  const i = html.indexOf(start);
  if (i < 0) return null;
  const from = i + start.length;
  // ytInitialData ends with `;</script>` — but the value itself can contain that
  // substring, so find the matching brace count.
  const j = findJsonEnd(html, from);
  if (j < 0) return null;
  try {
    return JSON.parse(html.slice(from, j));
  } catch {
    return null;
  }
}

function findJsonEnd(s: string, from: number): number {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function sortByPublished(a: Video, b: Video): number {
  const ad = Date.parse(a.published);
  const bd = Date.parse(b.published);
  if (isNaN(ad) && isNaN(bd)) return 0;
  if (isNaN(ad)) return 1;
  if (isNaN(bd)) return -1;
  return bd - ad;
}

// ---------- RSS merge (freshness) ----------

async function mergeRss(channelId: string, payload: CachedPayload) {
  try {
    const r = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return;
    const xml = await r.text();
    const byId = new Map(payload.videos.map((v) => [v.id, v]));
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      if (!id) continue;
      const isoPub = block.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      const title = decodeXml(block.match(/<title>([^<]+)<\/title>/)?.[1] ?? "");
      const existing = byId.get(id);
      if (existing) {
        if (isoPub) existing.published = isoPub;
      } else {
        const v: Video = {
          id,
          title,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published: isoPub,
          kind: "video",
        };
        byId.set(id, v);
        payload.videos.push(v);
      }
    }
  } catch {
    /* ignore */
  }
}

// ---------- Piped fallback ----------

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
      ingestPiped(root.relatedStreams ?? [], collected, null);

      const tasks: Promise<unknown>[] = [];
      for (const tab of root.tabs ?? []) {
        if (!tab?.data) continue;
        const tabName = String(tab.name ?? "").toLowerCase();
        tasks.push(
          (async () => {
            const first = await fetchTab(host, tab.data);
            if (!first) return;
            ingestPiped(first.content ?? [], collected, tabName);
            let token = first.nextpage ?? null;
            let i = 0;
            while (token && i < 25) {
              const page = await fetchTabNext(host, tab.data, token);
              if (!page) break;
              ingestPiped(page.content ?? [], collected, tabName);
              token = page.nextpage ?? null;
              i++;
            }
          })()
        );
      }
      await Promise.all(tasks);
      if (collected.size > 0) break;
    } catch {
      /* next host */
    }
  }
  if (collected.size === 0) return null;
  return {
    channelId,
    channelTitle,
    videos: Array.from(collected.values()),
    source: usedHost,
  };
}

function ingestPiped(streams: any[], out: Map<string, Video>, tabName: string | null) {
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
    const isShort = !!s.isShort || tabIsShorts || /\/shorts\//.test(urlStr);
    const isLive =
      tabIsLive ||
      !!s.isLive ||
      !!s.isLiveStream ||
      String(s.type ?? "").toLowerCase().includes("stream");
    const kind: VideoKind = isShort ? "short" : isLive ? "live" : "video";
    const existing = out.get(id);
    if (existing) {
      if (kind === "short") existing.kind = "short";
      else if (kind === "live" && existing.kind === "video") existing.kind = "live";
      if (existing.duration == null && duration != null) existing.duration = duration;
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

function activeHosts(): string[] {
  const now = Date.now();
  return PIPED_HOSTS.filter((h) => (hostCooldown.get(h) ?? 0) <= now);
}
function cooldown(host: string, ms: number) {
  hostCooldown.set(host, Date.now() + ms);
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

// ---------- channel id resolution ----------

async function resolveChannelId(url: string): Promise<string | null> {
  const direct = url.match(/\/channel\/(UC[\w-]+)/);
  if (direct) return direct[1];
  try {
    const res = await fetch(url, { headers: YT_HEADERS });
    const html = await res.text();
    const m =
      html.match(/"externalId":"(UC[\w-]+)"/) ||
      html.match(/"channelId":"(UC[\w-]+)"/);
    if (m) return m[1];
  } catch { /* */ }
  for (const host of activeHosts()) {
    try {
      const m = url.match(/youtube\.com\/(@[^/?#]+|c\/[^/?#]+|user\/[^/?#]+)/);
      if (!m) break;
      const res = await fetch(
        `https://${host}/channel/${encodeURIComponent(m[1])}`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (res.ok) {
        const d = await res.json();
        if (d?.id?.startsWith("UC")) return d.id;
      }
    } catch { /* */ }
  }
  return null;
}

// ---------- cache I/O ----------

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
    const { error } = await admin.from("youtube_channel_cache").upsert(
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
    if (error) console.error("cache write failed:", error.message);
    else console.log("cache wrote", channelId, payload.videos.length);
  } catch (e) {
    console.error("cache write threw:", (e as Error).message);
  }
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
