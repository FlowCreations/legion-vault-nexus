import { useState } from "react";
import { MapPin } from "lucide-react";

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
}

export const Geography = () => {
  const [activeTab, setActiveTab] = useState<"america" | "world">("america");
  const [timeFilter, setTimeFilter] = useState<"7days" | "28days" | "alltime">("7days");

  const cities: CityData[] = [
    { rank: 1, city: "Los Angeles", state: "CA", streams: 487, fans: 234 },
    { rank: 2, city: "New York", state: "NY", streams: 423, fans: 198 },
    { rank: 3, city: "Austin", state: "TX", streams: 312, fans: 156 },
    { rank: 4, city: "Nashville", state: "TN", streams: 289, fans: 142 },
    { rank: 5, city: "Chicago", state: "IL", streams: 256, fans: 128 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Geography</h2>
      </div>

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

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("america")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "america"
              ? "bg-white text-black"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          IN AMERICA
        </button>
        <button
          onClick={() => setActiveTab("world")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "world"
              ? "bg-white text-black"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          AROUND THE WORLD
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Map placeholder */}
        <div className="bg-white/5 rounded-lg p-8 flex items-center justify-center min-h-[400px] border border-white/10">
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500">Interactive map visualization</p>
            <p className="text-sm text-gray-600 mt-2">Fan distribution across regions</p>
          </div>
        </div>

        {/* Cities list */}
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">
            <div className="col-span-6">CITY</div>
            <div className="col-span-6 text-right">FANS</div>
          </div>

          {cities.map((city) => (
            <div
              key={city.rank}
              className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="col-span-1">
                <span className="text-xl font-bold text-gray-400">{city.rank}</span>
              </div>
              <div className="col-span-5">
                <span className="font-medium">{city.city}</span>
                {city.state && <span className="text-gray-400 text-sm ml-2">{city.state}</span>}
              </div>
              <div className="col-span-6 text-right font-semibold text-lg">
                {city.fans.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Source: Platform Analytics - As of {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};
