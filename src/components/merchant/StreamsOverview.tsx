import { useState } from "react";
import { TrendingUp } from "lucide-react";

export const StreamsOverview = () => {
  const [timeFilter, setTimeFilter] = useState<"7days" | "28days" | "alltime">("28days");

  const streamData = {
    current: 15847,
    trend: 12.5,
    allTime: 94301,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold">Streams</h2>

      <div className="flex gap-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setTimeFilter("7days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "7days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          7 DAYS
        </button>
        <button
          onClick={() => setTimeFilter("28days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "28days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          28 DAYS
        </button>
        <button
          onClick={() => setTimeFilter("alltime")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "alltime" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          ALL TIME
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-8xl font-bold">{streamData.current.toLocaleString()}</div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <span>Trending up</span>
            <span className="text-green-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {streamData.trend}%
            </span>
            <span>for the 28 days ending {new Date().toLocaleDateString()} as compared to the previous 28 days.</span>
          </div>
          
          <div className="text-gray-400">
            Your all-time total is <span className="text-white font-semibold">{streamData.allTime.toLocaleString()}</span>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="bg-white/5 rounded-lg p-8 min-h-[300px] border border-white/10 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">📈</div>
            <p>Stream trend visualization</p>
            <p className="text-sm mt-2">Line chart showing daily streams over time</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Website</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span className="text-gray-400">Mobile App</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Social</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Source: Platform Analytics - As of {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
