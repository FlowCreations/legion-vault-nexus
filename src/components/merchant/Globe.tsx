// Globe component with interactive city markers
import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";
import { GlobeUserPopup } from './GlobeUserPopup';

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

interface GlobeProps {
  cities: CityData[];
  onCityClick?: (userIds?: string[]) => void;
}

const Globe: React.FC<GlobeProps> = ({ cities, onCityClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const spinEnabledRef = useRef(true);
  const [selectedCity, setSelectedCity] = useState<{ users: any[], cityName: string } | null>(null);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);

  // Fetch all user profiles on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url, location')
        .not('location', 'is', null);
      
      console.log('Fetched user profiles:', data);
      console.log('Profile fetch error:', error);
      
      if (data) {
        setUserProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    // Load Mapbox CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {

    mapboxgl.accessToken = 'pk.eyJ1Ijoic3VraGRldjg4IiwiYSI6ImNtZ3k3YWpneTBxN2syanExbmFidzh5cHkifQ.we5KW2oVJmPn0TxSUCvqng';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: { name: 'globe' },
      zoom: 1.5,
      center: [0, 20],
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.setFog({
        color: 'rgb(18, 18, 18)',
        'high-color': 'rgb(59, 130, 246)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(11, 11, 11)',
        'star-intensity': 0.6,
      });

      // Add city markers
      cities.forEach((city) => {
        const el = document.createElement('div');
        const size = Math.max(14, Math.min(30, city.fans / 140));
        
        // Create outer pulse ring
        const pulseRing = document.createElement('div');
        pulseRing.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 2}px;
          height: ${size * 2}px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          animation: pulse-ring 2s infinite;
        `;
        
        // Create main marker dot
        const dot = document.createElement('div');
        dot.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          background: rgb(59, 130, 246);
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: box-shadow 0.3s;
        `;
        
        // Create rank number
        const rank = document.createElement('div');
        rank.textContent = city.rank.toString();
        rank.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: ${size * 0.5}px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          pointer-events: none;
        `;
        
        el.style.cssText = `
          width: ${size * 2}px;
          height: ${size * 2}px;
          position: relative;
        `;
        
        dot.addEventListener('mouseenter', () => {
          dot.style.boxShadow = '0 0 30px rgba(59, 130, 246, 1), inset 0 0 15px rgba(255, 255, 255, 0.5)';
          dot.style.cursor = 'pointer';
        });
        
        dot.addEventListener('mouseleave', () => {
          dot.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)';
        });
        
        dot.addEventListener('click', async () => {
          // Stop globe spinning
          setIsPaused(true);
          spinEnabledRef.current = false;
          
          console.log('City clicked:', city.city);
          console.log('All user profiles:', userProfiles);
          
          // Get users for this location - check both exact match and partial match
          const cityUsers = userProfiles.filter(u => {
            const userLocation = u.location?.toLowerCase().trim();
            const cityName = city.city.toLowerCase().trim();
            return userLocation === cityName || userLocation?.includes(cityName) || cityName?.includes(userLocation);
          });
          
          console.log('Matched users for', city.city, ':', cityUsers);
          
          if (cityUsers.length > 0) {
            setSelectedCity({
              users: cityUsers,
              cityName: `${city.city}${city.state ? ', ' + city.state : ''}`
            });
          } else {
            console.warn('No users found for city:', city.city);
          }
        });
        
        el.appendChild(pulseRing);
        el.appendChild(dot);
        el.appendChild(rank);

        // Get users for this location to show in popup - match more flexibly
        const locationUsers = userProfiles.filter(u => {
          const userLocation = u.location?.toLowerCase().trim();
          const cityName = city.city.toLowerCase().trim();
          return userLocation === cityName || userLocation?.includes(cityName) || cityName?.includes(userLocation);
        });
        const userNames = locationUsers.slice(0, 3).map(u => u.display_name).join(', ');
        const moreUsers = locationUsers.length > 3 ? ` +${locationUsers.length - 3} more` : '';
        
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
        }).setHTML(
          `<div style="background: rgb(18, 18, 18); color: white; padding: 16px; border-radius: 12px; border: 1px solid rgb(59, 130, 246); min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 24px; height: 24px; background: rgb(59, 130, 246); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${city.rank}</div>
              <h3 style="font-weight: bold; font-size: 18px; margin: 0;">${city.city}${city.state ? ', ' + city.state : ''}</h3>
            </div>
            <div style="display: grid; gap: 6px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.3);">
                <span style="color: rgb(156, 163, 175); font-size: 13px;">Total Members</span>
                <span style="font-weight: bold; font-size: 16px; color: rgb(59, 130, 246);">${city.fans.toLocaleString()}</span>
              </div>
              ${locationUsers.length > 0 ? `
                <div style="padding: 6px 0;">
                  <span style="color: rgb(156, 163, 175); font-size: 11px; text-transform: uppercase;">Community Members</span>
                  <div style="color: white; font-size: 13px; margin-top: 4px;">${userNames}${moreUsers}</div>
                  <div style="margin-top: 8px; text-align: center;">
                    <span style="color: rgb(59, 130, 246); font-size: 12px; cursor: pointer;">Click to view all →</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>`
        );

        new mapboxgl.Marker(el, { anchor: 'center' })
          .setLngLat([city.lng, city.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
        }
      `;
      document.head.appendChild(style);
    });

      // Rotation animation
      const secondsPerRevolution = 120;
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      let userInteracting = false;

      function spinGlobe() {
        if (!map.current || !spinEnabledRef.current) return;
        
        const zoom = map.current.getZoom();
        if (!userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('dragstart', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });
    
    map.current.on('touchend', () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on('moveend', () => {
      spinGlobe();
    });

    spinGlobe();

    return () => {
      map.current?.remove();
    };
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
    }
  }, [cities]);

  const toggleSpin = () => {
    setIsPaused(!isPaused);
    spinEnabledRef.current = !spinEnabledRef.current;
  };

  if (error) {
    return (
      <div className="w-full h-[600px] rounded-lg border border-border bg-destructive/10 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-destructive font-semibold mb-2">Map Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10 bg-black">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        
        {/* Pause/Play Button */}
        <button
          onClick={toggleSpin}
          className="absolute top-4 left-4 z-10 p-3 bg-black/80 hover:bg-black border border-white/20 rounded-lg transition-all hover:border-blue-500"
          title={isPaused ? "Resume rotation" : "Pause rotation"}
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-white" />
          ) : (
            <Pause className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* User Popup */}
      {selectedCity && (
        <GlobeUserPopup
          users={selectedCity.users}
          cityName={selectedCity.cityName}
          onClose={() => {
            setSelectedCity(null);
            setIsPaused(false);
            spinEnabledRef.current = true;
          }}
        />
      )}
    </>
  );
};

export default Globe;
