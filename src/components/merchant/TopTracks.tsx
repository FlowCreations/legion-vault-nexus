import { useState, useEffect } from "react";
import { Music2 } from "lucide-react";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import walkingOnTheEdge from "@/assets/walking-on-the-edge.jpg";
import carolinaSingle from "@/assets/carolina-single.jpg";

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

interface TopTrack {
  rank: number;
  title: string;
  streams: number;
  change?: number;
  percentOfTotal?: number;
  image?: string;
}

interface TopTracksProps {
  period: "7days" | "28days" | "alltime";
}

export const TopTracks = ({ period }: TopTracksProps) => {
  const [activeTab, setActiveTab] = useState<"7days" | "28days" | "alltime">(period);
  const [tracks, setTracks] = useState<TopTrack[]>([]);

  useEffect(() => {
    const loadTracksData = async () => {
      try {
        // For now, use hardcoded data - will be replaced with Viberate API
        const hardcodedTracks: TopTrack[] = [
          { rank: 1, title: "In The Air Tonight", streams: 234567, percentOfTotal: 18.5 },
          { rank: 2, title: "Fire Starter", streams: 198543, percentOfTotal: 15.7 },
          { rank: 3, title: "Strange", streams: 176234, percentOfTotal: 13.9 },
          { rank: 4, title: "Power", streams: 154321, percentOfTotal: 12.2 },
          { rank: 5, title: "Carolina", streams: 142109, percentOfTotal: 11.2 },
          { rank: 6, title: "Walking On The Edge", streams: 128456, percentOfTotal: 10.1 },
          { rank: 7, title: "Remember My Name", streams: 115678, percentOfTotal: 9.1 },
          { rank: 8, title: "Leave the Light On", streams: 98234, percentOfTotal: 7.8 },
        ];

        // Add images to tracks
        const tracksWithImages = hardcodedTracks.map(track => ({
          ...track,
          image: trackImageMap[track.title] || powerAlbum
        }));

        setTracks(tracksWithImages);
      } catch (error) {
        console.error('Error loading tracks data:', error);
      }
    };

    loadTracksData();
  }, [activeTab]);

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
      </div>
    </div>
  );
};
