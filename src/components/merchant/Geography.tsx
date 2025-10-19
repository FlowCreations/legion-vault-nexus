import { useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Globe = lazy(() => import('./Globe'));

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
  lat: number;
  lng: number;
  userIds?: string[];
}

export const Geography = () => {
  const [activeTab, setActiveTab] = useState<"america" | "world">("america");

  const citiesAmerica: CityData[] = [
    { rank: 1, city: "Nashville", state: "TN", streams: 125000, fans: 3420, lat: 36.1627, lng: -86.7816 },
    { rank: 2, city: "Austin", state: "TX", streams: 98000, fans: 2890, lat: 30.2672, lng: -97.7431 },
    { rank: 3, city: "Atlanta", state: "GA", streams: 87000, fans: 2560, lat: 33.7490, lng: -84.3880 },
    { rank: 4, city: "Los Angeles", state: "CA", streams: 76000, fans: 2210, lat: 34.0522, lng: -118.2437 },
    { rank: 5, city: "New York", state: "NY", streams: 65000, fans: 1980, lat: 40.7128, lng: -74.0060 },
    { rank: 6, city: "Chicago", state: "IL", streams: 54000, fans: 1750, lat: 41.8781, lng: -87.6298 },
    { rank: 7, city: "Dallas", state: "TX", streams: 48000, fans: 1620, lat: 32.7767, lng: -96.7970 },
    { rank: 8, city: "Denver", state: "CO", streams: 42000, fans: 1450, lat: 39.7392, lng: -104.9903 },
  ];

  const citiesWorld: CityData[] = [
    { rank: 1, city: "London", streams: 145000, fans: 4120, lat: 51.5074, lng: -0.1278 },
    { rank: 2, city: "Tokyo", streams: 132000, fans: 3890, lat: 35.6762, lng: 139.6503 },
    { rank: 3, city: "Sydney", streams: 98000, fans: 2890, lat: -33.8688, lng: 151.2093 },
    { rank: 4, city: "Toronto", streams: 87000, fans: 2560, lat: 43.6532, lng: -79.3832 },
    { rank: 5, city: "Berlin", streams: 76000, fans: 2340, lat: 52.5200, lng: 13.4050 },
    { rank: 6, city: "Paris", streams: 65000, fans: 2110, lat: 48.8566, lng: 2.3522 },
    { rank: 7, city: "São Paulo", streams: 54000, fans: 1890, lat: -23.5505, lng: -46.6333 },
    { rank: 8, city: "Seoul", streams: 48000, fans: 1670, lat: 37.5665, lng: 126.9780 },
  ];

  const cities = activeTab === "america" ? citiesAmerica : citiesWorld;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Global Reach</h2>

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

      <div className="space-y-4">
        <Suspense fallback={
          <div className="rounded-lg border border-white/10 bg-white/5 min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-gray-400">Loading globe...</p>
            </div>
          </div>
        }>
          <Globe cities={cities} onCityClick={() => {}} />
        </Suspense>
      </div>
    </div>
  );
};
