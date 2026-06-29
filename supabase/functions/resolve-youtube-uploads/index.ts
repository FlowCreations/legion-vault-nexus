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
    // Pass a CONSENT cookie + hl=en to bypass EU consent gate.
    const fetchTab = (path: string) =>
      fetch(`https://www.youtube.com${path}?hl=en&gl=US`, {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI",
        },
      });
    const videosRes = await fetchTab(`/channel/${channelId}/videos`);
    const videosHtml = await videosRes.text();

    const channelTitle =
      videosHtml.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
      videosHtml.match(/"title":"([^"]+)","navigationEndpoint"/)?.[1] ??
      "YouTube";

    const collected = new Map<
      string,
      { id: string; title: string; thumbnail: string; published: string }
    >();

    // Generic extractor: finds any {"videoId":"...", ...,"title":{"runs":[{"text":"..."}]}}
    // followed by a lengthText (= long-form video, excludes Shorts which have no duration).
    const extractFromHtml = (html: string) => {
      const re =
        /"videoId":"([\w-]{11})"[^]*?"title":\{(?:"runs":\[\{"text":"((?:[^"\\]|\\.)*)"|"simpleText":"((?:[^"\\]|\\.)*)")[^]*?(?:"lengthText":\{[^}]*"simpleText":"([^"]+)"|"publishedTimeText":\{"simpleText":"([^"]+)")/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        const id = m[1];
        if (collected.has(id)) continue;
        const title = unescapeJson(m[2] ?? m[3] ?? "");
        const published = m[5] ?? "";
        // Skip if it's clearly a short (no lengthText AND title contains #shorts)
        if (!m[4] && /#shorts/i.test(title)) continue;
        if (!title) continue;
        collected.set(id, {
          id,
          title,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published,
        });
      }
    };

    extractFromHtml(videosHtml);

    // 3. Also scrape /streams and /shorts (Shorts use shortsLockupViewModel).
    try {
      const streamsRes = await fetchTab(`/channel/${channelId}/streams`);
      extractFromHtml(await streamsRes.text());
    } catch {
      /* ignore */
    }
    try {
      const shortsRes = await fetchTab(`/channel/${channelId}/shorts`);
      const shortsHtml = await shortsRes.text();
      // Shorts lockup structure: {"videoId":"X"} alongside "headline":{"simpleText":"title"}
      const sRe =
        /"shortsLockupViewModel":\{[^]*?"videoId":"([\w-]{11})"[^]*?"text":"((?:[^"\\]|\\.)*)"/g;
      let s: RegExpExecArray | null;
      while ((s = sRe.exec(shortsHtml)) !== null) {
        const id = s[1];
        if (collected.has(id)) continue;
        collected.set(id, {
          id,
          title: unescapeJson(s[2]),
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published: "",
        });
      }
      // Fallback: also try reelItemRenderer (older structure)
      const rRe =
        /"reelItemRenderer":\{[^]*?"videoId":"([\w-]{11})"[^]*?"headline":\{"simpleText":"((?:[^"\\]|\\.)*)"/g;
      while ((s = rRe.exec(shortsHtml)) !== null) {
        const id = s[1];
        if (collected.has(id)) continue;
        collected.set(id, {
          id,
          title: unescapeJson(s[2]),
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published: "",
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
