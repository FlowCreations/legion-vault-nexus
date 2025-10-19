import { useState, lazy, Suspense, useEffect } from "react";
import { MapPin, Globe as GlobeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"america" | "world">("america");
  const [timeFilter, setTimeFilter] = useState<"7days" | "28days" | "alltime">("7days");
  const [realUserData, setRealUserData] = useState<CityData[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalCountries: 0, totalCities: 0, totalUsers: 0 });

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

  useEffect(() => {
    // Fetch user profiles with location data
    const fetchUserLocations = async () => {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .not('location', 'is', null);

      if (profiles) {
        // Group users by location
        const locationMap = new Map<string, { users: any[], coords: { lat: number, lng: number } | null }>();
        
        profiles.forEach(profile => {
          const location = profile.location || 'Unknown';
          if (!locationMap.has(location)) {
            locationMap.set(location, { users: [], coords: null });
          }
          locationMap.get(location)!.users.push(profile);
        });

        // Geocode locations (simplified - you'd use a real geocoding API)
        const geocodedData: CityData[] = [];
        let rank = 1;
        
        for (const [city, data] of locationMap.entries()) {
          // Simple geocoding approximations - in production use Google Maps API
          const coords = getApproximateCoords(city);
          if (coords) {
            geocodedData.push({
              rank: rank++,
              city,
              streams: data.users.length * 1000, // Estimated
              fans: data.users.length,
              lat: coords.lat,
              lng: coords.lng,
              userIds: data.users.map(u => u.user_id)
            });
          }
        }

        geocodedData.sort((a, b) => b.fans - a.fans);
        geocodedData.forEach((city, idx) => city.rank = idx + 1);
        
        setRealUserData(geocodedData);
        
        // Calculate global stats
        const uniqueCountries = new Set(geocodedData.map(c => getCountryFromCity(c.city)));
        setGlobalStats({
          totalCountries: uniqueCountries.size,
          totalCities: geocodedData.length,
          totalUsers: profiles.length
        });
      }
    };

    fetchUserLocations();

    // Set up real-time subscription for new users
    const channel = supabase
      .channel('user-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchUserLocations(); // Refresh when new user signs up
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Simple geocoding helper - in production use real API
  const getApproximateCoords = (city: string): { lat: number, lng: number } | null => {
    const knownCities: Record<string, { lat: number, lng: number }> = {
      'Nashville': { lat: 36.1627, lng: -86.7816 },
      'Montreal': { lat: 45.5017, lng: -73.5673 },
      'Austin': { lat: 30.2672, lng: -97.7431 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'New York': { lat: 40.7128, lng: -74.0060 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
    };
    return knownCities[city] || null;
  };

  const getCountryFromCity = (city: string): string => {
    // Simple mapping - in production use proper API
    const countryMap: Record<string, string> = {
      'Nashville': 'USA',
      'Montreal': 'Canada',
      'Austin': 'USA',
      'Los Angeles': 'USA',
      'New York': 'USA',
      'London': 'UK',
      'Tokyo': 'Japan',
      'Sydney': 'Australia',
    };
    return countryMap[city] || 'Unknown';
  };

  const cities = realUserData.length > 0 ? realUserData : (activeTab === "america" ? citiesAmerica : citiesWorld);

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
        {/* 3D Globe */}
        <div className="space-y-4">
          <Suspense fallback={
            <div className="rounded-lg border border-white/10 bg-white/5 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-600 animate-pulse" />
                <p className="text-gray-500">Loading 3D globe...</p>
              </div>
            </div>
          }>
            <Globe 
              cities={cities} 
              key={activeTab}
              onCityClick={(userIds) => {
                // Navigate to community hub with selected users
                navigate('/community-hub', { state: { selectedUserIds: userIds } });
              }}
            />
          </Suspense>
          
          {/* Global Impact Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <GlobeIcon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">{globalStats.totalCountries}</div>
              <div className="text-xs text-gray-400 uppercase">Countries</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold">{globalStats.totalCities}</div>
              <div className="text-xs text-gray-400 uppercase">Cities</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-2xl font-bold">{globalStats.totalUsers}</div>
              <div className="text-xs text-gray-400 uppercase">Members</div>
            </div>
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
