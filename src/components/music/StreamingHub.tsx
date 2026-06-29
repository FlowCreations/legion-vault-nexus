import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LogIn, RefreshCw, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  PLATFORM_ORDER,
  StreamingPlatform,
  toEmbedUrl,
} from "@/lib/streamingPlatforms";

interface StreamingLink {
  id: string;
  platform: StreamingPlatform;
  url: string;
  embed_url: string | null;
  label: string | null;
  is_featured: boolean;
}

export function StreamingHub() {
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<StreamingPlatform | null>(null);
  const [spotifyRefreshKey, setSpotifyRefreshKey] = useState(0);
  // artistLinkId -> resolved album IDs (full discography)
  const [spotifyDiscography, setSpotifyDiscography] = useState<Record<string, string[]>>({});
  // albumId -> { title, thumbnail, kind: 'album'|'ep'|'single' }
  type AlbumMeta = { title: string; thumbnail: string; kind: "album" | "ep" | "single" };
  const [albumMeta, setAlbumMeta] = useState<Record<string, AlbumMeta>>({});
  const albumMetaRef = useRef<Record<string, AlbumMeta>>({});
  const [selectedAlbum, setSelectedAlbum] = useState<Record<string, string | null>>({});
  const [albumFilter, setAlbumFilter] = useState<"all" | "album" | "ep" | "single">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("artist_streaming_links")
        .select("*")
        .neq("platform", "youtube_music") // YouTube lives on the Videos page
        .order("sort_order", { ascending: true });
      setLinks((data ?? []) as StreamingLink[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const refreshSpotifyEmbeds = () => setSpotifyRefreshKey((key) => key + 1);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshSpotifyEmbeds();
    };

    window.addEventListener("focus", refreshSpotifyEmbeds);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshSpotifyEmbeds);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleSpotifySignIn = () => {
    const popup = window.open(
      "https://accounts.spotify.com/login",
      "spotify-login",
      "popup=yes,width=520,height=720,noopener,noreferrer"
    );

    if (!popup) {
      setSpotifyRefreshKey((key) => key + 1);
      return;
    }

    const poll = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poll);
        setSpotifyRefreshKey((key) => key + 1);
      }
    }, 700);
  };

  const platformsWithLinks = useMemo(
    () =>
      Array.from(new Set(links.map((l) => l.platform))).sort(
        (a, b) => PLATFORM_ORDER.indexOf(a) - PLATFORM_ORDER.indexOf(b)
      ),
    [links]
  );

  // All links for the active platform.
  const activeLinks = activePlatform
    ? links.filter((l) => l.platform === activePlatform)
    : [];

  const featured = links.filter((l) => l.is_featured);

  // Default the active inline platform to the first available one
  useEffect(() => {
    if (!activePlatform && platformsWithLinks.length > 0) {
      setActivePlatform(platformsWithLinks[0]);
    }
  }, [platformsWithLinks, activePlatform]);

  // For any Spotify artist link, resolve the artist's full discography so the
  // full track listing is rendered (Spotify artist embeds only show "Popular").
  useEffect(() => {
    const spotifyArtistLinks = links.filter(
      (l) => l.platform === "spotify" && /\/artist\//.test(l.url)
    );
    spotifyArtistLinks.forEach(async (link) => {
      if (spotifyDiscography[link.id]) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "resolve-spotify-discography",
          { body: { artistUrl: link.url } }
        );
        if (!error && data?.albums?.length) {
          setSpotifyDiscography((prev) => ({ ...prev, [link.id]: data.albums }));
        }
      } catch {
        /* fall back to artist embed */
      }
    });
  }, [links, spotifyDiscography]);

  if (loading || links.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Stream Everywhere
          </h2>
          <p className="text-muted-foreground mt-1">
            Sign in to your account and listen — without leaving the portal.
          </p>
        </div>
      </div>

      {/* Featured embeds */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((link) => {
            const embed = link.embed_url || toEmbedUrl(link.platform, link.url);
            if (!embed) return null;
            return (
              <Card
                key={link.id}
                className="overflow-hidden bg-card/50 border-border/50"
              >
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <span
                    className="text-xs uppercase tracking-wide font-semibold"
                    style={{ color: PLATFORM_COLORS[link.platform] }}
                  >
                    {PLATFORM_LABELS[link.platform]}
                  </span>
                  {link.label && (
                    <span className="text-xs text-muted-foreground">{link.label}</span>
                  )}
                </div>
                <iframe
                  src={embed}
                  width="100%"
                  height={link.platform === "spotify" ? 352 : 380}
                  frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block w-full"
                  title={`${PLATFORM_LABELS[link.platform]} player`}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Inline platform switcher — player stays in the portal */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Listen in your favorite app
        </h3>
        <div className="flex flex-wrap gap-2">
          {platformsWithLinks.map((p) => {
            const isActive = p === activePlatform;
            return (
              <Button
                key={p}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setActivePlatform(isActive ? null : p)}
                aria-pressed={isActive}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: PLATFORM_COLORS[p] }}
                />
                {PLATFORM_LABELS[p]}
                {isActive ? (
                  <ChevronUp className="w-3.5 h-3.5 opacity-70" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                )}
              </Button>
            );
          })}
        </div>

        {activePlatform && activeLinks.length > 0 && (
          <div className="mt-4 space-y-4">
            {/* Per-platform sign-in CTA so fans can log in once and have every
                embed below recognize their account (follow, save, like). */}
            {activePlatform === "spotify" && (
              <Button size="sm" className="gap-2 font-semibold" onClick={handleSpotifySignIn}>
                <LogIn className="w-4 h-4" />
                Sign in to Spotify
              </Button>
            )}

            {activeLinks.map((link) => {
              const isSpotify = link.platform === "spotify";
              const isSpotifyArtist = isSpotify && /\/artist\//.test(link.url);
              const artistEmbed =
                link.embed_url || toEmbedUrl(link.platform, link.url);
              const albums = isSpotifyArtist
                ? spotifyDiscography[link.id] ?? []
                : [];

              const height = isSpotify
                ? isSpotifyArtist
                  ? 380
                  : 680
                : 460;

              return (
                <div key={link.id} className="space-y-4">
                  <Card className="overflow-hidden bg-card/50 border-border/50">
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                      <span
                        className="text-xs uppercase tracking-wide font-semibold truncate"
                        style={{ color: PLATFORM_COLORS[link.platform] }}
                      >
                        {PLATFORM_LABELS[link.platform]}
                        {link.label
                          ? ` · ${link.label}`
                          : isSpotifyArtist
                          ? " · Artist · Top tracks"
                          : " · Sign in inside the player to follow & save"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => setSpotifyRefreshKey((key) => key + 1)}
                      >
                        Refresh <RefreshCw className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    {artistEmbed ? (
                      <iframe
                        key={`${link.id}-${spotifyRefreshKey}`}
                        src={artistEmbed}
                        width="100%"
                        height={height}
                        frameBorder={0}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="block w-full"
                        title={`${PLATFORM_LABELS[link.platform]} player`}
                      />
                    ) : (
                      <div className="p-6 text-sm text-muted-foreground">
                        {PLATFORM_LABELS[link.platform]} doesn't support inline
                        playback for this link. Use the fallback button above.
                      </div>
                    )}
                  </Card>

                  {/* Full discography — every album as its own embed so the
                      complete track list is visible inside the portal. */}
                  {isSpotifyArtist && albums.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground pt-2">
                        Full discography · {albums.length} releases
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {albums.map((albumId) => (
                          <Card
                            key={albumId}
                            className="overflow-hidden bg-card/50 border-border/50"
                          >
                            <iframe
                              key={`${albumId}-${spotifyRefreshKey}`}
                              src={`https://open.spotify.com/embed/album/${albumId}`}
                              width="100%"
                              height={420}
                              frameBorder={0}
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              className="block w-full"
                              title={`Spotify album ${albumId}`}
                            />
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default StreamingHub;
