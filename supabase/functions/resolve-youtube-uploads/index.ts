// Resolve a YouTube channel/handle URL to its uploads (video list) via the
// public RSS feed. No API key required.
// POST { url } -> { channelId, channelTitle, videos: [{id,title,thumbnail,published}] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string")
      return json({ error: "url required" }, 400);

    let channelId: string | null = null;

    const channelMatch = url.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) channelId = channelMatch[1];

    if (!channelId) {
      // Scrape any /@handle, /c/, /user/ URL for externalId
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en" },
      });
      const html = await res.text();
      const m =
        html.match(/"externalId":"(UC[\w-]+)"/) ||
        html.match(/"channelId":"(UC[\w-]+)"/);
      if (m) channelId = m[1];
    }

    if (!channelId) return json({ error: "channel not found" }, 404);

    const feedRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    );
    const xml = await feedRes.text();

    const channelTitle =
      xml.match(/<title>([^<]+)<\/title>/)?.[1] ?? "YouTube";

    const videos: Array<{
      id: string;
      title: string;
      thumbnail: string;
      published: string;
    }> = [];
    const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
    let entry: RegExpExecArray | null;
    while ((entry = entryRe.exec(xml)) !== null) {
      const block = entry[1];
      const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const title = decodeXml(block.match(/<title>([^<]+)<\/title>/)?.[1] ?? "");
      const thumbnail = block.match(/<media:thumbnail url="([^"]+)"/)?.[1] ?? "";
      const published = block.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
      if (id) videos.push({ id, title, thumbnail, published });
    }

    return json({ channelId, channelTitle, videos });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

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
