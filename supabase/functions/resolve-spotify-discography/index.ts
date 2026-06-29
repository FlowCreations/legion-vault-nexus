// Resolve a Spotify artist URL to its full list of album IDs by scraping the
// public artist page. No API key required — uses only publicly visible markup.
// Returns: { albums: string[] }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { artistUrl } = await req.json();
    if (!artistUrl || typeof artistUrl !== "string") {
      return json({ error: "artistUrl required" }, 400);
    }

    const match = artistUrl.match(/artist\/([A-Za-z0-9]+)/);
    if (!match) return json({ error: "not a Spotify artist URL" }, 400);
    const artistId = match[1];

    const pageRes = await fetch(
      `https://open.spotify.com/artist/${artistId}`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en" } }
    );
    const html = await pageRes.text();

    const ids = new Set<string>();
    const re = /\/album\/([A-Za-z0-9]{22})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) ids.add(m[1]);

    return json({ artistId, albums: Array.from(ids) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
