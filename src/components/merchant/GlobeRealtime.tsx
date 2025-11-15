import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play, X } from 'lucide-react';
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
      // Mapbox public token (safe to expose in client-side code)
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3VraGRldjg4IiwiYSI6ImNtaDB4eXQ5YjAyYmIya3B6bTl5dWt6YWMifQ.iue-jhG0kc_pYOV9vRNvzQ';
      
      console.log('🗺️ Initializing Mapbox with token:', mapboxgl.accessToken ? 'Token present' : 'No token');
      
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
    console.log('🌍 GlobeRealtime: geojson changed', {
      hasGeojson: !!geojson,
      hasMap: !!map.current,
      isStyleLoaded: map.current?.isStyleLoaded(),
      featuresCount: geojson?.features?.length || 0
    });
    
    if (!map.current || !geojson || !map.current.isStyleLoaded()) return;

    console.log('✅ Updating markers with', geojson.features.length, 'members');
    if (geojson.features.length > 0) {
      console.log('📍 First feature:', geojson.features[0]);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Create individual markers for each member with small offsets to prevent exact overlaps
    geojson.features.forEach((feature, index) => {
      let [lng, lat] = feature.geometry.coordinates;
      
      // Add small random offset (±0.0001 degrees) to prevent exact overlaps
      // This keeps members visually grouped but still individually clickable
      const offset = 0.0001;
      lng += (Math.random() - 0.5) * offset;
      lat += (Math.random() - 0.5) * offset;

      // Create marker element
      const el = document.createElement('div');
      const size = 20;
      
      el.className = 'member-marker';
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: rgb(59, 130, 246);
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        cursor: pointer;
        transition: all 0.3s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = '0 0 25px rgba(59, 130, 246, 1)';
        el.style.zIndex = '1000';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.8)';
        el.style.zIndex = 'auto';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔵 MARKER CLICKED - Setting selectedMember:', feature.properties);
        // Stop globe rotation immediately when opening profile
        spinEnabledRef.current = false;
        setIsPaused(true);
        // Stop any ongoing map animations
        if (map.current) {
          map.current.stop();
        }
        setSelectedMember(feature.properties);
        if (onMemberClick) {
          onMemberClick(feature.properties.user_id);
        }
      });

      const marker = new mapboxgl.Marker(el, { anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markersRef.current.set(`${feature.properties.user_id}-${index}`, marker);
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

    // Stop rotation on any interaction - only resume via play button
    map.current.on('mousedown', () => { 
      userInteracting = true;
      spinEnabledRef.current = false;
      setIsPaused(true);
    });
    map.current.on('touchstart', () => { 
      userInteracting = true;
      spinEnabledRef.current = false;
      setIsPaused(true);
    });
    map.current.on('dragstart', () => { 
      userInteracting = true;
      spinEnabledRef.current = false;
      setIsPaused(true);
    });
    map.current.on('mouseup', () => { userInteracting = false; });
    map.current.on('touchend', () => { userInteracting = false; });
    map.current.on('moveend', () => { 
      if (spinEnabledRef.current) {
        spinGlobe(); 
      }
    });

    spinGlobe();
  }, []);

  const toggleSpin = () => {
    setIsPaused(!isPaused);
    spinEnabledRef.current = !spinEnabledRef.current;
  };

  const handleCloseProfile = () => {
    setSelectedMember(null);
    // Resume rotation when closing profile
    spinEnabledRef.current = true;
    setIsPaused(false);
    // Trigger rotation to start again
    if (map.current) {
      const center = map.current.getCenter();
      center.lng -= 360 / 120; // One step
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    }
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
        <>
          {console.log('🟢 RENDERING MODAL - selectedMember exists:', selectedMember)}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" 
            onClick={handleCloseProfile}
          >
            {/* GIANT FLOATING CLOSE BUTTON - Fixed to top right of screen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('❌ CLOSE BUTTON CLICKED');
                handleCloseProfile();
              }}
              className="fixed top-4 right-4 z-[10000] w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 border-4 border-white shadow-2xl transition-all hover:scale-110 animate-pulse"
              title="CLOSE"
            >
              <X className="w-10 h-10 text-white font-bold" strokeWidth={4} />
            </button>

            <div className="relative max-w-2xl w-full mx-4 my-8">
              <div 
                className="relative bg-card border border-white/20 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
              >
                <MemberCard 
                  member={selectedMember}
                  onClose={handleCloseProfile}
                  onViewProfile={() => {
                    navigate(`/community?member=${selectedMember.user_id}`);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobeRealtime;
