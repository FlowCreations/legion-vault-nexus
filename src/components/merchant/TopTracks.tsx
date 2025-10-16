import { useState } from "react";
import { Music2, Users, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface TopTrack {
  rank: number;
  title: string;
  streams: number;
  change?: number;
  percentOfTotal?: number;
}

interface TopTracksProps {
  period: "7days" | "28days" | "alltime";
}

export const TopTracks = ({ period }: TopTracksProps) => {
  const [activeTab, setActiveTab] = useState<"7days" | "28days" | "alltime">(period);

  const tracks: TopTrack[] = [
    { rank: 1, title: "In The Air Tonight", streams: 234567, change: 12, percentOfTotal: 18.5 },
    { rank: 2, title: "Fire Starter", streams: 198543, change: 8, percentOfTotal: 15.7 },
    { rank: 3, title: "Strange", streams: 176234, change: 5, percentOfTotal: 13.9 },
    { rank: 4, title: "Power", streams: 154321, change: -2, percentOfTotal: 12.2 },
    { rank: 5, title: "Carolina", streams: 142109, change: 3, percentOfTotal: 11.2 },
    { rank: 6, title: "Walking On The Edge", streams: 128456, change: 6, percentOfTotal: 10.1 },
    { rank: 7, title: "Remember My Name", streams: 115678, change: 1, percentOfTotal: 9.1 },
    { rank: 8, title: "Leave the Light On", streams: 98234, change: -1, percentOfTotal: 7.8 },
  ];

  const getChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getChangeColor = (change?: number) => {
    if (!change || change === 0) return "text-gray-500";
    return change > 0 ? "text-green-500" : "text-red-500";
  };

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
              <div className="w-14 h-14 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Music2 className="h-6 w-6 text-primary" />
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
