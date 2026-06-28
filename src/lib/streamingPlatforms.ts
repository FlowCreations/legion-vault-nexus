export type StreamingPlatform =
  | "spotify"
  | "apple_music"
  | "tidal"
  | "youtube_music"
  | "soundcloud"
  | "bandcamp";

export const PLATFORM_LABELS: Record<StreamingPlatform, string> = {
  spotify: "Spotify",
  apple_music: "Apple Music",
  tidal: "Tidal",
  youtube_music: "YouTube Music",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
};

export const PLATFORM_COLORS: Record<StreamingPlatform, string> = {
  spotify: "#1DB954",
  apple_music: "#FA243C",
  tidal: "#000000",
  youtube_music: "#FF0000",
  soundcloud: "#FF5500",
  bandcamp: "#1DA0C3",
};

export const PLATFORM_ORDER: StreamingPlatform[] = [
  "spotify",
  "apple_music",
  "tidal",
  "youtube_music",
  "soundcloud",
  "bandcamp",
];

/**
 * Convert any artist/album/track URL into a public embed URL.
 * Returns null when the platform does not support iframe embeds.
 */
export function toEmbedUrl(
  platform: StreamingPlatform,
  url: string
): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    switch (platform) {
      case "spotify": {
        // https://open.spotify.com/artist/<id>  ->  https://open.spotify.com/embed/artist/<id>
        if (u.hostname.includes("spotify.com")) {
          const path = u.pathname.replace(/^\/(embed\/)?/, "/embed/");
          return `https://open.spotify.com${path}`;
        }
        return null;
      }
      case "apple_music": {
        // music.apple.com/...  ->  embed.music.apple.com/...
        if (u.hostname.includes("music.apple.com")) {
          return `https://embed.music.apple.com${u.pathname}${u.search}`;
        }
        return null;
      }
      case "tidal": {
        // https://tidal.com/browse/artist/<id>  ->  https://embed.tidal.com/artists/<id>
        const m = u.pathname.match(/(artist|album|track|playlist)s?\/(\d+)/);
        if (m) {
          const kind = m[1] === "artist" ? "artists" : `${m[1]}s`;
          return `https://embed.tidal.com/${kind}/${m[2]}`;
        }
        return null;
      }
      case "youtube_music": {
        // youtube/music.youtube playlist/video -> youtube embed
        const v = u.searchParams.get("v");
        const list = u.searchParams.get("list");
        if (v) return `https://www.youtube.com/embed/${v}${list ? `?list=${list}` : ""}`;
        if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
        return null;
      }
      case "soundcloud": {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          url
        )}&color=%23d4af37&auto_play=false&hide_related=true&show_user=true`;
      }
      case "bandcamp": {
        // Bandcamp embeds require the album ID which is not in URL.
        // Fall back to a link card.
        return null;
      }
    }
  } catch {
    return null;
  }
  return null;
}
