import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Youtube, Play, LogIn } from "lucide-react";

interface YTLink {
  id: string;
  platform: string;
  url: string;
  embed_url: string | null;
  label: string | null;
}

interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
}

/**
 * YouTube hub for the Videos page. Plays every video inline inside the portal
 * — no redirects. A main 16:9 player sits beside a scrollable list of the
 * channel's uploads; clicking a video swaps it into the player.
 */
export function YouTubeHub() {
  const [links, setLinks] = useState<YTLink[]>([]);
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [channelTitle, setChannelTitle] = useState<string>("YouTube");
  const [loading, setLoading] = useState(true);
  const [playerRefreshKey, setPlayerRefreshKey] = useState(0);

  const handleYouTubeSignIn = () => {
    const popup = window.open(
      "https://www.youtube.com/signin",
      "youtube-login",
      "popup=yes,width=520,height=720"
    );
    if (!popup) {
      setPlayerRefreshKey((k) => k + 1);
      return;
    }
    const poll = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poll);
        setPlayerRefreshKey((k) => k + 1);
      }
    }, 700);
  };

  useEffect(() => {
    const refresh = () => setPlayerRefreshKey((k) => k + 1);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("artist_streaming_links")
        .select("*")
        .eq("platform", "youtube_music")
        .order("sort_order", { ascending: true });
      const ytLinks = (data ?? []) as YTLink[];
      setLinks(ytLinks);

      if (ytLinks.length === 0) {
        setLoading(false);
        return;
      }

      // Resolve the first link's channel uploads via our edge function.
      try {
        const { data: res, error } = await supabase.functions.invoke(
          "resolve-youtube-uploads",
          { body: { url: ytLinks[0].url } }
        );
        if (!error && res?.videos?.length) {
          setVideos(res.videos as YTVideo[]);
          setActiveId(res.videos[0].id);
          if (res.channelTitle) setChannelTitle(res.channelTitle);
        }
      } catch {
        /* swallow — fallback UI handles it */
      }
      setLoading(false);
    })();
  }, []);

  if (loading || links.length === 0) return null;

  const primary = links[0];

  return (
    <section className="space-y-6 pt-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Youtube className="w-7 h-7 text-[#FF0000]" />
            Watch on YouTube
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Every {channelTitle} upload — playing inline. Sign in inside the
            player to like, comment and subscribe without leaving the portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 font-semibold bg-[#FF0000] text-white hover:bg-[#FF0000]/90"
            onClick={handleYouTubeSignIn}
          >
            <LogIn className="w-4 h-4" />
            Sign in to YouTube
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs">
            <a href={primary.url} target="_blank" rel="noreferrer">
              Open channel <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>

      {activeId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Inline player */}
          <Card className="lg:col-span-2 overflow-hidden bg-card/50 border-border/50">
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                key={`${activeId}-${playerRefreshKey}`}
                src={`https://www.youtube.com/embed/${activeId}?autoplay=0&rel=0`}
                className="absolute inset-0 w-full h-full"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                title="YouTube player"
              />
            </div>
            <div className="px-4 py-3">
              <h3 className="font-semibold text-foreground line-clamp-2">
                {videos.find((v) => v.id === activeId)?.title ?? ""}
              </h3>
            </div>
          </Card>

          {/* Video list — every upload, clickable, stays in portal */}
          <Card className="overflow-hidden bg-card/50 border-border/50">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {videos.length} videos
              </span>
              <span className="text-xs text-[#FF0000] font-semibold">
                YOUTUBE
              </span>
            </div>
            <ScrollArea className="h-[480px]">
              <ul className="divide-y divide-border/30">
                {videos.map((v) => {
                  const isActive = v.id === activeId;
                  return (
                    <li key={v.id}>
                      <button
                        onClick={() => setActiveId(v.id)}
                        className={`w-full flex gap-3 p-3 text-left transition-colors hover:bg-muted/40 ${
                          isActive ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="relative w-28 aspect-video rounded overflow-hidden shrink-0 bg-black">
                          <img
                            src={v.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Play className="w-5 h-5 text-primary fill-primary" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm line-clamp-2 ${
                              isActive
                                ? "text-foreground font-semibold"
                                : "text-foreground/90"
                            }`}
                          >
                            {v.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(v.published).toLocaleDateString(
                              undefined,
                              { year: "numeric", month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </Card>
        </div>
      ) : (
        <Card className="p-6 bg-card/50 border-border/50 text-sm text-muted-foreground">
          Couldn't load this channel's uploads.{" "}
          <a
            href={primary.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Open on YouTube
          </a>
          .
        </Card>
      )}
    </section>
  );
}

export default YouTubeHub;
