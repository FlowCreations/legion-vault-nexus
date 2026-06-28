import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
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

const PLATFORM_SIGNIN: Record<StreamingPlatform, string> = {
  spotify: "https://accounts.spotify.com/login",
  apple_music: "https://music.apple.com",
  tidal: "https://listen.tidal.com/login",
  youtube_music: "https://accounts.google.com/ServiceLogin?service=youtube",
  soundcloud: "https://soundcloud.com/signin",
  bandcamp: "https://bandcamp.com/login",
};

export function StreamingHub() {
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("artist_streaming_links")
        .select("*")
        .order("sort_order", { ascending: true });
      setLinks((data ?? []) as StreamingLink[]);
      setLoading(false);
    })();
  }, []);

  if (loading || links.length === 0) return null;

  const featured = links.filter((l) => l.is_featured);
  const platformsWithLinks = Array.from(
    new Set(links.map((l) => l.platform))
  ).sort(
    (a, b) => PLATFORM_ORDER.indexOf(a) - PLATFORM_ORDER.indexOf(b)
  );

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-12 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Stream Everywhere
          </h2>
          <p className="text-muted-foreground mt-1">
            Listen on your favorite platform. Sign in to follow & save.
          </p>
        </div>
      </div>

      {/* Featured embeds */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((link) => {
            const embed = link.embed_url || toEmbedUrl(link.platform, link.url);
            if (!embed) {
              return (
                <Card
                  key={link.id}
                  className="p-6 bg-card/50 border-border/50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">
                      {PLATFORM_LABELS[link.platform]}
                    </div>
                    <div className="text-foreground font-medium">
                      {link.label || "Listen now"}
                    </div>
                  </div>
                  <Button asChild>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      Open <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </Card>
              );
            }
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

      {/* Connect / open buttons */}
      <div>
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Follow & connect
        </h3>
        <div className="flex flex-wrap gap-3">
          {platformsWithLinks.map((p) => {
            const first = links.find((l) => l.platform === p)!;
            return (
              <div key={p} className="flex items-center gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <a href={first.url} target="_blank" rel="noreferrer">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: PLATFORM_COLORS[p] }}
                    />
                    Open in {PLATFORM_LABELS[p]}
                  </a>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={PLATFORM_SIGNIN[p]} target="_blank" rel="noreferrer">
                    Sign in
                  </a>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StreamingHub;
