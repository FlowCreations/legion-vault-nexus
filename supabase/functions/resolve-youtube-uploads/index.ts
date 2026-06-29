// Resolve a YouTube channel/handle URL to its full upload list using public
// Piped API instances (privacy-respecting YouTube frontends). No API key.
// POST { url } -> { channelId, channelTitle, videos: [{id,title,thumbnail,published,duration}] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Public Piped API mirrors — tried in order until one responds.
const PIPED_HOSTS = [
  "api.piped.private.coffee",
  "pipedapi.kavin.rocks",
  "pipedapi.adminforge.de",
  "pipedapi.r4fo.com",
  "pipedapi.leptons.xyz",
];

type VideoKind = "short" | "live" | "video";
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  duration?: number;
  kind: VideoKind;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string")
      return json({ error: "url required" }, 400);

    // 1. Resolve channelId (UC...) from any YouTube URL form.
    const channelId = await resolveChannelId(url);
    if (!channelId) return json({ error: "channel not found" }, 404);

    // 2. Try each Piped host in turn until one returns channel data.
    let channelTitle = "YouTube";
    const collected = new Map<string, Video>();

    let usedHost: string | null = null;
    for (const host of PIPED_HOSTS) {
      try {
        const rootRes = await fetch(`https://${host}/channel/${channelId}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!rootRes.ok) continue;
        const root = await rootRes.json();
        if (!root?.id) continue;

        usedHost = host;
        channelTitle = root.name ?? channelTitle;

        // Root "Home/Latest" streams
        ingestStreams(root.relatedStreams ?? [], collected, null);

        // Paginate Home/Latest
        let nextpage: string | null = root.nextpage ?? null;
        let pages = 0;
        while (nextpage && pages < 20) {
          const np = await fetchNext(host, channelId, nextpage);
          if (!np) break;
          ingestStreams(np.relatedStreams ?? [], collected, null);
          nextpage = np.nextpage ?? null;
          pages++;
        }

        // Each tab (videos / shorts / streams) — fetch + paginate.
        for (const tab of root.tabs ?? []) {
          if (!tab?.data) continue;
          const tabName = String(tab.name ?? "").toLowerCase();
          let tabRes = await fetchTab(host, tab.data);
          let tp = 0;
          while (tabRes && tp < 25) {
            ingestStreams(tabRes.content ?? [], collected, tabName);
            if (!tabRes.nextpage) break;
            tabRes = await fetchTabNext(host, tab.data, tabRes.nextpage);
            tp++;
          }
        }

        if (collected.size > 0) break;
      } catch {
        /* try next host */
      }
    }

    // 3. Always merge RSS feed as a freshness/safety net (ISO timestamps).
    try {
      const feedRes = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
        { headers: { "User-Agent": UA } }
      );
      if (feedRes.ok) {
        const xml = await feedRes.text();
        const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
        let entry: RegExpExecArray | null;
        while ((entry = entryRe.exec(xml)) !== null) {
          const block = entry[1];
          const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
          if (!id) continue;
          const isoPub =
            block.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
          const title = decodeXml(
            block.match(/<title>([^<]+)<\/title>/)?.[1] ?? ""
          );
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

    if (collected.size === 0) {
      return json({ error: "no videos found", channelId, channelTitle, videos: [] }, 200);
    }

    // Sort newest first when we have ISO dates; otherwise preserve insertion order.
    const videos = Array.from(collected.values()).sort((a, b) => {
      const ad = Date.parse(a.published);
      const bd = Date.parse(b.published);
      if (isNaN(ad) && isNaN(bd)) return 0;
      if (isNaN(ad)) return 1;
      if (isNaN(bd)) return -1;
      return bd - ad;
    });

    return json({ channelId, channelTitle, videos, source: usedHost });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function resolveChannelId(url: string): Promise<string | null> {
  const direct = url.match(/\/channel\/(UC[\w-]+)/);
  if (direct) return direct[1];

  // Try Piped first (works with /@handle, /c/, /user/).
  for (const host of PIPED_HOSTS) {
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
    } catch {
      /* next host */
    }
  }

  // Fallback: scrape the channel page for externalId.
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
      `https://${host}/nextpage/channel/${channelId}?nextpage=${encodeURIComponent(nextpage)}`,
      { signal: AbortSignal.timeout(8000) }
    );
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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTabNext(host: string, data: string, nextpage: string) {
  try {
    const res = await fetch(
      `https://${host}/channels/tabs?data=${encodeURIComponent(data)}&nextpage=${encodeURIComponent(nextpage)}`,
      { signal: AbortSignal.timeout(8000) }
    );
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
  const tabIsLive = !!tabName && (tabName.includes("live") || tabName.includes("stream"));
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
      // Upgrade classification: shorts beats live beats video (tabs are most authoritative).
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

// Piped thumbnails are routed through proxies; swap to direct ytimg URLs.
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
