import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Youtube, LogIn, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface YTLink {
  id: string;
  platform: string;
  url: string;
  embed_url: string | null;
  label: string | null;
}

type VideoKind = "short" | "live" | "video";
interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  kind?: VideoKind;
  duration?: number;
}

type CategoryKey = "all" | "video" | "short" | "live";

const formatDuration = (sec?: number) => {
  if (!sec || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * YouTube hub — renders the channel's uploads as a 4-column thumbnail grid
 * (matching the "You May Also Like" layout). Clicking a card opens an
 * inline modal player so playback stays inside the portal.
 */
export function YouTubeHub() {
  const [links, setLinks] = useState<YTLink[]>([]);
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [channelTitle, setChannelTitle] = useState<string>("YouTube");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [category, setCategory] = useState<CategoryKey>("all");
  const [playerRefreshKey, setPlayerRefreshKey] = useState(0);

  const youtubeSignInUrl =
    "https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2F";

  const handleYouTubeSignIn = () => {
    const a = document.createElement("a");
    a.href = youtubeSignInUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => setPlayerRefreshKey((k) => k + 1), 1200);
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

      try {
        const { data: res, error } = await supabase.functions.invoke(
          "resolve-youtube-uploads",
          { body: { url: ytLinks[0].url } }
        );
        if (!error && res?.videos?.length) {
          setVideos(res.videos as YTVideo[]);
          if (res.channelTitle) setChannelTitle(res.channelTitle);
        }
      } catch {
        /* swallow */
      }
      setLoading(false);
    })();
  }, []);

  if (loading || links.length === 0) return null;

  const counts = {
    all: videos.length,
    video: videos.filter((v) => (v.kind ?? "video") === "video").length,
    short: videos.filter((v) => v.kind === "short").length,
    live: videos.filter((v) => v.kind === "live").length,
  };
  const filtered =
    category === "all"
      ? videos
      : videos.filter((v) => (v.kind ?? "video") === category);
  const visibleVideos = showAll ? filtered : filtered.slice(0, 8);
  const activeVideo = videos.find((v) => v.id === activeId) ?? null;

  const tabs: { key: CategoryKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "video", label: "Videos" },
    { key: "short", label: "Shorts" },
    { key: "live", label: "Live" },
  ];

  return (
    <section className="space-y-6 pt-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Youtube className="w-7 h-7 text-[#FF0000]" />
            Watch on YouTube
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Every {channelTitle} upload — playing inline inside the portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll ? "Show Less" : "View All"}
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 font-semibold bg-[#FF0000] text-white hover:bg-[#FF0000]/90"
            onClick={handleYouTubeSignIn}
          >
            <LogIn className="w-4 h-4" />
            Sign in to YouTube
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const c = counts[t.key];
          const active = category === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setCategory(t.key);
                setShowAll(false);
              }}
              disabled={c === 0 && t.key !== "all"}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/50 text-foreground border-border/60 hover:bg-card hover:border-border",
                c === 0 && t.key !== "all" && "opacity-40 cursor-not-allowed"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-2 text-xs",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-sm text-muted-foreground">
          No {category === "all" ? "videos" : category === "short" ? "Shorts" : category === "live" ? "live streams" : "videos"} found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleVideos.map((v) => {
            const dur = formatDuration(v.duration);
            return (
              <button
                key={v.id}
                onClick={() => setActiveId(v.id)}
                className="group space-y-2 text-left"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {dur && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-medium leading-none">
                      {dur}
                    </div>
                  )}
                  {v.kind === "short" && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FF0000]/90 text-white text-[10px] font-bold uppercase tracking-wide leading-none">
                      Short
                    </div>
                  )}
                  {v.kind === "live" && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold uppercase tracking-wide leading-none">
                      Live
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#FF0000]/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {v.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {channelTitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Inline player modal — keeps playback inside the portal */}
      <Dialog open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black border-border/50">
          <DialogTitle className="sr-only">
            {activeVideo?.title ?? "YouTube video"}
          </DialogTitle>
          {activeVideo && (
            <>
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  key={`${activeVideo.id}-${playerRefreshKey}`}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                  className="absolute inset-0 w-full h-full"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  title={activeVideo.title}
                />
              </div>
              <div className="px-5 py-4 bg-card">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {activeVideo.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {channelTitle} ·{" "}
                  {new Date(activeVideo.published).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default YouTubeHub;
