import { useState, useMemo, memo } from "react";
import { Music2 } from "lucide-react";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import walkingOnTheEdge from "@/assets/walking-on-the-edge.jpg";
import carolinaSingle from "@/assets/carolina-single.jpg";
import { type TopTrackData } from "@/utils/analyticsDataParser";
import { useTopTracks } from "@/hooks/useAnalyticsData";
import { TopTracksSkeleton } from "./AnalyticsSkeleton";

// Map track names to album images
const trackImageMap: Record<string, string> = {
  "In The Air Tonight": powerAlbum,
  "Fire Starter": powerAlbum,
  "Strange": outlawAlbum,
  "Power": powerAlbum,
  "Carolina": carolinaSingle,
  "Walking On The Edge": walkingOnTheEdge,
  "Remember My Name": outlawAlbum,
  "Leave the Light On": outlawAlbum,
};

interface TopTrack extends TopTrackData {
  image?: string;
}

interface TopTracksProps {
  period: "7days" | "28days" | "alltime";
}

export const TopTracks = ({ period }: TopTracksProps) => {
  const [activeTab, setActiveTab] = useState<"7days" | "28days" | "alltime">(period);
  const { data, isLoading, error } = useTopTracks(activeTab);

  const tracks = useMemo(() => {
    if (!data) return [];
    
    // Add images to tracks
    return data.map(track => ({
      ...track,
      image: trackImageMap[track.title] || powerAlbum
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Top Tracks</h2>
      </div>

      <div className="flex gap-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab("7days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            activeTab === "7days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          7 DAYS
        </button>
        <button
          onClick={() => setActiveTab("28days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            activeTab === "28days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          28 DAYS
        </button>
        <button
          onClick={() => setActiveTab("alltime")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            activeTab === "alltime" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          ALL TIME
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <TopTracksSkeleton />
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Failed to load track data
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">
              <div className="col-span-6">TRACK</div>
              <div className="col-span-3 text-center">STREAMS</div>
              <div className="col-span-3 text-right">% OF TOTAL</div>
            </div>

            {tracks.map((track) => (
          <div
            key={track.rank}
            className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="col-span-6 flex items-center gap-4">
              <span className="text-2xl font-bold text-gray-400 w-8">{track.rank}</span>
              <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
                {track.image ? (
                  <img 
                    src={track.image} 
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              <span className="font-medium">{track.title}</span>
            </div>
            <div className="col-span-3 text-center font-semibold text-lg">
              {track.streams.toLocaleString()}
            </div>
            <div className="col-span-3 text-right font-semibold text-lg">
              {track.percentOfTotal}%
            </div>
          </div>
        ))}
          </>
        )}
      </div>
    </div>
  );
};

export default memo(TopTracks);
