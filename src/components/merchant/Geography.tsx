import { useState, lazy, Suspense } from "react";
import { MapPin } from "lucide-react";

const FanMap = lazy(() => import('./FanMap').then(module => ({ default: module.FanMap })));

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
  lat: number;
  lng: number;
}

export const Geography = () => {
  const [activeTab, setActiveTab] = useState<"america" | "world">("america");
  const [timeFilter, setTimeFilter] = useState<"7days" | "28days" | "alltime">("7days");

  const cities: CityData[] = [
    { rank: 1, city: "Nashville", state: "TN", streams: 125000, fans: 3420, lat: 36.1627, lng: -86.7816 },
    { rank: 2, city: "Austin", state: "TX", streams: 98000, fans: 2890, lat: 30.2672, lng: -97.7431 },
    { rank: 3, city: "Atlanta", state: "GA", streams: 87000, fans: 2560, lat: 33.7490, lng: -84.3880 },
    { rank: 4, city: "Los Angeles", state: "CA", streams: 76000, fans: 2210, lat: 34.0522, lng: -118.2437 },
    { rank: 5, city: "New York", state: "NY", streams: 65000, fans: 1980, lat: 40.7128, lng: -74.0060 },
    { rank: 6, city: "Chicago", state: "IL", streams: 54000, fans: 1750, lat: 41.8781, lng: -87.6298 },
    { rank: 7, city: "Dallas", state: "TX", streams: 48000, fans: 1620, lat: 32.7767, lng: -96.7970 },
    { rank: 8, city: "Denver", state: "CO", streams: 42000, fans: 1450, lat: 39.7392, lng: -104.9903 },
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
        {/* Interactive Map */}
        <div className="rounded-lg overflow-hidden min-h-[400px] border border-white/10 relative z-0">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-white/5">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-600 animate-pulse" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          }>
            <FanMap cities={cities} />
          </Suspense>
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
