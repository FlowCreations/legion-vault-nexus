import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchCommunityMembers, getTerritoryGroup, type CommunityMemberPoint } from '@/lib/communityData';

type MemberWithTerritory = CommunityMemberPoint & {
  territoryGroup: 'america' | 'world';
};

export const GlobalReachMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState<'america' | 'world'>('america');
  const [isPaused, setIsPaused] = useState(false);
  const [members, setMembers] = useState<MemberWithTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction state refs
  const isInteractingRef = useRef(false);
  const userPausedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Load community members on mount
  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      const communityMembers = await fetchCommunityMembers();
      
      // Filter to only valid members with coordinates
      const validMembers = communityMembers.filter(
        (m) => typeof m.lat === 'number' && typeof m.lng === 'number'
      );

      // Add territory group to each member
      const membersWithTerritory: MemberWithTerritory[] = validMembers.map((m) => ({
        ...m,
        territoryGroup: getTerritoryGroup(m.country),
      }));

      setMembers(membersWithTerritory);
      setLoading(false);
    }

    loadMembers();
  }, []);

  // Filter members by active tab
  const filteredMembers = useMemo(() => {
    return members.filter((m) => m.territoryGroup === activeTab);
  }, [members, activeTab]);

  // Convert to GeoJSON with correct [lng, lat] order
  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: filteredMembers.map((m) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [m.lng!, m.lat!], // CRITICAL: [lng, lat] order
        },
        properties: {
          id: m.id,
          name: m.displayName,
          city: m.city || '',
          region: m.region || '',
          country: m.country || '',
        },
      })),
    };
  }, [filteredMembers]);

  // Auto-rotation loop using requestAnimationFrame
  useEffect(() => {
    const speedDegPerSec = 3;

    function animate() {
      if (!map.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      const dtSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Only rotate if NOT paused by user AND NOT currently interacting
      if (!userPausedRef.current && !isInteractingRef.current) {
        const center = map.current.getCenter();
        map.current.setCenter({
          lng: center.lng - speedDegPerSec * dtSeconds,
          lat: center.lat,
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Pause/Play toggle handler
  const toggleSpin = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    userPausedRef.current = newPausedState;
    
    if (newPausedState) {
      // Paused - stop rotation
      isInteractingRef.current = true;
    } else {
      // Playing - resume rotation
      isInteractingRef.current = false;
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1Ijoic3VraGRldjg4IiwiYSI6ImNtZ3k3YWpneTBxN2syanExbmFidzh5cHkifQ.we5KW2oVJmPn0TxSUCvqng';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: { name: 'globe' },
      center: activeTab === 'america' ? [-95, 30] : [20, 30],
      zoom: 2.2,
      pitch: 0,
      bearing: 0,
      // Enable all interactions
      dragPan: true,
      scrollZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoomRotate: true,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Setup fog/atmosphere
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(18, 18, 18)',
        'high-color': 'rgb(124, 189, 255)',
        'horizon-blend': 0.2,
        'space-color': 'rgb(11, 11, 11)',
        'star-intensity': 0.8,
      });
    });

    // Interaction handlers
    function onInteractStart() {
      isInteractingRef.current = true;
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    }

    function onInteractEnd() {
      if (userPausedRef.current) return; // User explicitly paused, never auto-resume
      
      idleTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 4000);
    }

    map.current.on('dragstart', onInteractStart);
    map.current.on('zoomstart', onInteractStart);
    map.current.on('rotatestart', onInteractStart);

    map.current.on('dragend', onInteractEnd);
    map.current.on('zoomend', onInteractEnd);
    map.current.on('rotateend', onInteractEnd);

    // Add source and layers when map loads
    map.current.on('load', () => {
      if (!map.current) return;

      // Add community members source
      map.current.addSource('clients', {
        type: 'geojson',
        data: geojson,
      });

      // Add circle layer for member markers
      map.current.addLayer({
        id: 'client-points',
        type: 'circle',
        source: 'clients',
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(124, 189, 255, 0.6)',
          'circle-stroke-color': 'rgba(255, 255, 255, 0.9)',
          'circle-stroke-width': 1.5,
        },
      });

      // Click handler for markers
      map.current.on('click', 'client-points', (e) => {
        if (!e.features?.[0] || !map.current) return;

        const props = e.features[0].properties;
        const coordinates = (e.features[0].geometry as any).coordinates.slice();

        // Build location string, skipping empty parts
        const locationParts = [props.city, props.region, props.country].filter(Boolean);
        const locationString = locationParts.join(', ');

        new mapboxgl.Popup({
          closeButton: false,
          className: 'client-popup',
        })
          .setLngLat(coordinates as [number, number])
          .setHTML(`
            <div style="
              background: #1E1E1E; 
              color: white; 
              padding: 12px 16px; 
              border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.2);
              font-family: system-ui, -apple-system, sans-serif;
            ">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${props.name}</div>
              ${locationString ? `<div style="font-size: 12px; color: rgba(255,255,255,0.7);">${locationString}</div>` : ''}
            </div>
          `)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'client-points', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'client-points', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    // Cleanup
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update source data when members or tab changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('clients');
    if (source && source.type === 'geojson') {
      source.setData(geojson);
    }

    // Re-center map based on active tab
    const newCenter: [number, number] = activeTab === 'america' ? [-95, 30] : [20, 30];
    map.current.easeTo({
      center: newCenter,
      zoom: 2.2,
      duration: 1500,
    });
  }, [activeTab, geojson]);

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('america')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'america'
              ? 'bg-white text-black'
              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
          }`}
        >
          IN AMERICA
        </button>
        <button
          onClick={() => setActiveTab('world')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'world'
              ? 'bg-white text-black'
              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
          }`}
        >
          AROUND THE WORLD
        </button>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10 bg-[#1E1E1E]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E] z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading community members...</p>
            </div>
          </div>
        )}

        <div ref={mapContainer} className="absolute inset-0" />

        {/* Starfield background overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#0B1120]/30 to-[#0B1120]/60" />
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={toggleSpin}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center bg-black/60 border border-white/20 rounded-lg hover:bg-black/80 hover:border-blue-500 transition-all text-white text-sm"
          title={isPaused ? 'Play Globe' : 'Pause Globe'}
        >
          {isPaused ? '▶' : '❚❚'}
        </button>

        {/* Member count badge */}
        {!loading && (
          <div className="absolute bottom-4 left-4 z-10 px-3 py-2 bg-black/60 border border-white/20 rounded-lg text-white text-sm">
            <span className="font-semibold">{filteredMembers.length}</span> members
          </div>
        )}
      </div>
    </div>
  );
};


