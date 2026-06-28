import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
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

  const platformsWithLinks = useMemo(
    () =>
      Array.from(new Set(links.map((l) => l.platform))).sort(
        (a, b) => PLATFORM_ORDER.indexOf(a) - PLATFORM_ORDER.indexOf(b)
      ),
    [links]
  );

  // All links for the active platform (Spotify artist embed only shows top tracks,
  // so artists can add album/playlist links here to surface the full catalog).
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

        {activeLink && (
          <Card className="mt-4 overflow-hidden bg-card/50 border-border/50">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: PLATFORM_COLORS[activeLink.platform] }}
              >
                {PLATFORM_LABELS[activeLink.platform]} · Sign in inside the player to follow & save
              </span>
              {/* Tiny escape hatch for platforms that block embedding */}
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <a href={activeLink.url} target="_blank" rel="noreferrer">
                  Fallback <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
            {activeEmbed ? (
              <iframe
                src={activeEmbed}
                width="100%"
                height={activeLink.platform === "spotify" ? 420 : 460}
                frameBorder={0}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block w-full"
                title={`${PLATFORM_LABELS[activeLink.platform]} player`}
              />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                {PLATFORM_LABELS[activeLink.platform]} doesn't support inline playback for this
                link. Use the fallback button above to open it.
              </div>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}

export default StreamingHub;
