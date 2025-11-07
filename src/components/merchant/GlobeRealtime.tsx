import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useMembersGeojson } from '@/hooks/useMembersGeojson';
import { MemberCard } from './MemberCard';
import { useNavigate } from 'react-router-dom';

interface GlobeRealtimeProps {
  focusMemberId?: string | null;
  onMemberClick?: (memberId: string) => void;
}

export const GlobeRealtime: React.FC<GlobeRealtimeProps> = ({ focusMemberId, onMemberClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const spinEnabledRef = useRef(true);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const { geojson, loading, error } = useMembersGeojson();
  const navigate = useNavigate();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
        new mapboxgl.NavigationControl({ visualizePitch: true }),
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

        // Enable globe rotation
        startGlobeRotation();
      });

      return () => {
        map.current?.remove();
        map.current = null;
      };
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, []);

  // Update markers when geojson changes
  useEffect(() => {
    if (!map.current || !geojson || !map.current.isStyleLoaded()) return;

    console.log('Updating markers with', geojson.features.length, 'members');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Group members by location for clustering
    const locationGroups = new Map<string, any[]>();
    geojson.features.forEach(feature => {
      const key = `${feature.geometry.coordinates[0]},${feature.geometry.coordinates[1]}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(feature);
    });

    // Create markers
    locationGroups.forEach((features, key) => {
      const [lng, lat] = features[0].geometry.coordinates;
      const count = features.length;

      // Create marker element
      const el = document.createElement('div');
      const size = Math.max(20, Math.min(40, count * 8));
      
      el.className = 'member-marker';
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgb(59, 130, 246);
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.4}px;
        transition: all 0.3s;
      `;
      
      if (count > 1) {
        el.textContent = count.toString();
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 0 30px rgba(59, 130, 246, 1)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setIsPaused(true);
        spinEnabledRef.current = false;
        
        if (features.length === 1) {
          setSelectedMember(features[0].properties);
          if (onMemberClick) {
            onMemberClick(features[0].properties.user_id);
          }
        } else {
          // Show all members at this location
          setSelectedMember({
            ...features[0].properties,
            _multiple: features.map(f => f.properties)
          });
        }
      });

      const marker = new mapboxgl.Marker(el, { anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markersRef.current.set(key, marker);
    });
  }, [geojson, onMemberClick]);

  // Focus on specific member
  useEffect(() => {
    if (!map.current || !focusMemberId || !geojson) return;

    const feature = geojson.features.find(f => f.properties.user_id === focusMemberId);
    if (!feature) return;

    const [lng, lat] = feature.geometry.coordinates;
    map.current.flyTo({
      center: [lng, lat],
      zoom: 8,
      duration: 2000
    });

    setSelectedMember(feature.properties);
    setIsPaused(true);
    spinEnabledRef.current = false;
  }, [focusMemberId, geojson]);

  const startGlobeRotation = useCallback(() => {
    if (!map.current) return;

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

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();
  }, []);

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
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white">Loading member locations...</div>
          </div>
        )}

        <button
          onClick={toggleSpin}
          className="absolute top-4 left-4 z-10 p-3 bg-black/80 hover:bg-black border border-white/20 rounded-lg transition-all hover:border-blue-500"
          title={isPaused ? "Resume rotation" : "Pause rotation"}
        >
          {isPaused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
        </button>

        <div className="absolute bottom-4 left-4 z-10 bg-black/80 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">
          {geojson ? `${geojson.features.length} members` : 'Loading...'}
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => {
          setSelectedMember(null);
          setIsPaused(false);
          spinEnabledRef.current = true;
        }}>
          <div className="bg-card border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <MemberCard 
              member={selectedMember}
              onClose={() => {
                setSelectedMember(null);
                setIsPaused(false);
                spinEnabledRef.current = true;
              }}
              onViewProfile={() => {
                navigate(`/community?member=${selectedMember.user_id}`);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GlobeRealtime;
