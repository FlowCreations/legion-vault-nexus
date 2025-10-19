import { useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Globe = lazy(() => import('./Globe'));
const GlobeRealtime = lazy(() => import('./GlobeRealtime').then(module => ({ default: module.GlobeRealtime })));

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"demo" | "realtime">("realtime");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const citiesDemo: CityData[] = [
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
      <h2 className="text-3xl font-bold">Member Locations</h2>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("realtime")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "realtime"
              ? "bg-blue-500 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          LIVE MEMBER MAP
        </button>
        <button
          onClick={() => setActiveTab("demo")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "demo"
              ? "bg-blue-500 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          DEMO DATA
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
          {activeTab === "realtime" ? (
            <GlobeRealtime
              focusMemberId={selectedMemberId}
              onMemberClick={(memberId) => {
                navigate(`/community?member=${memberId}`);
              }}
            />
          ) : (
            <Globe cities={citiesDemo} onCityClick={() => {}} />
          )}
        </Suspense>

        {activeTab === "demo" && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Top Cities</h3>
            {citiesDemo.map((city) => (
              <div
                key={city.rank}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-gray-400">{city.rank}</span>
                  <div>
                    <span className="font-medium">{city.city}</span>
                    {city.state && <span className="text-gray-400 text-sm ml-2">{city.state}</span>}
                  </div>
                </div>
                <span className="font-semibold text-lg">{city.fans.toLocaleString()} fans</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
