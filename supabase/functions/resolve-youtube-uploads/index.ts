// Resolve a YouTube channel/handle URL to its full video list by scraping the
// channel's /videos tab (long-form) AND /streams tab, merging with the RSS
// feed for freshness. No API key required. Shorts are excluded.
// POST { url } -> { channelId, channelTitle, videos: [{id,title,thumbnail,published}] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string")
      return json({ error: "url required" }, 400);

    // 1. Resolve channelId
    let channelId: string | null = null;
    const channelMatch = url.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) channelId = channelMatch[1];

    if (!channelId) {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en" },
      });
      const html = await res.text();
      const m =
        html.match(/"externalId":"(UC[\w-]+)"/) ||
        html.match(/"channelId":"(UC[\w-]+)"/);
      if (m) channelId = m[1];
    }
    if (!channelId) return json({ error: "channel not found" }, 404);

    // 2. Scrape the /videos tab — long-form uploads, excludes shorts.
    const videosUrl = `https://www.youtube.com/channel/${channelId}/videos`;
    const videosRes = await fetch(videosUrl, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en" },
    });
    const videosHtml = await videosRes.text();

    const channelTitle =
      videosHtml.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
      videosHtml.match(/"title":"([^"]+)","navigationEndpoint"/)?.[1] ??
      "YouTube";

    const collected = new Map<
      string,
      { id: string; title: string; thumbnail: string; published: string }
    >();

    // Extract every videoRenderer block from the page's initial data.
    const rendererRe = /"videoRenderer":\{([^]*?)"trackingParams"/g;
    let r: RegExpExecArray | null;
    while ((r = rendererRe.exec(videosHtml)) !== null) {
      const block = r[1];
      const id = block.match(/"videoId":"([\w-]{11})"/)?.[1];
      if (!id || collected.has(id)) continue;
      const title =
        block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)?.[1] ??
        block.match(/"simpleText":"((?:[^"\\]|\\.)*)"/)?.[1] ??
        "";
      const published =
        block.match(/"publishedTimeText":\{"simpleText":"([^"]+)"/)?.[1] ?? "";
      collected.set(id, {
        id,
        title: unescapeJson(title),
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        published,
      });
    }

    // 3. Also scrape /streams (live/past streams aren't in /videos for some channels).
    try {
      const streamsRes = await fetch(
        `https://www.youtube.com/channel/${channelId}/streams`,
        { headers: { "User-Agent": UA, "Accept-Language": "en-US,en" } }
      );
      const streamsHtml = await streamsRes.text();
      const sRe = /"videoRenderer":\{([^]*?)"trackingParams"/g;
      let s: RegExpExecArray | null;
      while ((s = sRe.exec(streamsHtml)) !== null) {
        const block = s[1];
        const id = block.match(/"videoId":"([\w-]{11})"/)?.[1];
        if (!id || collected.has(id)) continue;
        const title =
          block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)?.[1] ??
          "";
        const published =
          block.match(/"publishedTimeText":\{"simpleText":"([^"]+)"/)?.[1] ?? "";
        collected.set(id, {
          id,
          title: unescapeJson(title),
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published,
        });
      }
    } catch {
      /* ignore */
    }

    // 4. Merge RSS feed (provides ISO timestamps for the most recent 15).
    try {
      const feedRes = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      );
      const xml = await feedRes.text();
      const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
      let entry: RegExpExecArray | null;
      while ((entry = entryRe.exec(xml)) !== null) {
        const block = entry[1];
        const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        if (!id) continue;
        const isoPub =
          block.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
        const existing = collected.get(id);
        if (existing) {
          if (isoPub) existing.published = isoPub;
        } else {
          const title = decodeXml(
            block.match(/<title>([^<]+)<\/title>/)?.[1] ?? ""
          );
          collected.set(id, {
            id,
            title,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            published: isoPub,
          });
        }
      }
    } catch {
      /* ignore */
    }

    const videos = Array.from(collected.values());

    return json({ channelId, channelTitle, videos });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function unescapeJson(s: string) {
  try {
    return JSON.parse(`"${s.replace(/"/g, '\\"').replace(/\\\\"/g, '\\"')}"`);
  } catch {
    return s
      .replace(/\\u0026/g, "&")
      .replace(/\\"/g, '"')
      .replace(/\\\//g, "/");
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
