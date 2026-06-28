import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube } from "lucide-react";
import { toEmbedUrl } from "@/lib/streamingPlatforms";

interface YTLink {
  id: string;
  platform: string;
  url: string;
  embed_url: string | null;
  label: string | null;
}

/**
 * YouTube hub for the Videos page. Fans sign in directly inside the YouTube
 * iframe (same as on youtube.com) — no redirect away from the portal.
 */
export function YouTubeHub() {
  const [links, setLinks] = useState<YTLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("artist_streaming_links")
        .select("*")
        .eq("platform", "youtube_music")
        .order("sort_order", { ascending: true });
      setLinks((data ?? []) as YTLink[]);
      setLoading(false);
    })();
  }, []);

  if (loading || links.length === 0) return null;

  return (
    <section className="space-y-6 pt-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Youtube className="w-7 h-7 text-[#FF0000]" />
            Watch on YouTube
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in inside the player to like, comment and subscribe — without leaving the portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {links.map((link) => {
          const embed =
            link.embed_url || toEmbedUrl("youtube_music", link.url) || toYouTubeEmbed(link.url);
          return (
            <Card key={link.id} className="overflow-hidden bg-card/50 border-border/50">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide font-semibold text-[#FF0000]">
                  YouTube {link.label ? `· ${link.label}` : ""}
                </span>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <a href={link.url} target="_blank" rel="noreferrer">
                    Fallback <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
              {embed ? (
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    src={embed}
                    className="absolute inset-0 w-full h-full"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    title="YouTube player"
                  />
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  This link can't be embedded. Use the fallback button to open it on YouTube.
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Accepts youtube.com/channel/<id>, /@handle, /watch?v=, /playlist?list=, youtu.be/<id>. */
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const v = u.searchParams.get("v");
    const list = u.searchParams.get("list");
    if (v) return `https://www.youtube.com/embed/${v}${list ? `?list=${list}` : ""}`;
    if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
    // Channel / handle pages aren't directly embeddable — use uploads playlist via channel id (UC -> UU)
    const channelMatch = u.pathname.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) {
      const uploads = "UU" + channelMatch[1].slice(2);
      return `https://www.youtube.com/embed/videoseries?list=${uploads}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default YouTubeHub;
