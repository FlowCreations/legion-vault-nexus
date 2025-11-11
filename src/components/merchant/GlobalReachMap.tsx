import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchCommunityMembers, getTerritoryGroup, isHeartbeatEnabled, type CommunityMemberPoint } from '@/lib/communityData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { MemberCard } from './MemberCard';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

type MemberWithTerritory = CommunityMemberPoint & {
  territoryGroup: 'america' | 'world';
};

export const GlobalReachMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [members, setMembers] = useState<CommunityMemberPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const navigate = useNavigate();
  const { enabled: heartbeatEnabled, loading: flagLoading } = useFeatureFlag('enable_heartbeat_integration');
  
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

      console.log('✅ Loaded members for globe:', validMembers.length);
      console.log('📍 First 5 members:', validMembers.slice(0, 5));
      setMembers(validMembers);
      setLoading(false);
    }

    loadMembers();
  }, []);

  // Show all members globally
  const filteredMembers = useMemo(() => {
    return members;
  }, [members]);

  // Convert to GeoJSON with correct [lng, lat] order
  const geojson = useMemo(() => {
    const features = filteredMembers.map((m) => ({
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
    }));
    
    console.log('Creating GeoJSON with features:', features.length);
    
    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [filteredMembers]);

  // Fetch full member details by name and location
  const fetchMemberDetails = async (name: string, city: string, region: string, country: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('display_name', name)
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error('Error fetching member details:', error);
      return null;
    }
    
    return {
      ...data,
      name: data.display_name,
      joined_at: data.created_at,
      tier: data.membership_tier || data.tier,
      era: data.era_current,
      era_label: data.era_label,
      ptp: data.ptp_current,
      ptp_status: data.ptp_status,
    };
  };

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
    
    // Immediately stop/start rotation
    if (newPausedState) {
      // Paused - stop rotation immediately
      isInteractingRef.current = true;
    } else {
      // Playing - resume rotation immediately
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
      center: [0, 20],
      zoom: 1.5,
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

      // Add community members source (start with empty data)
      map.current.addSource('clients', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add circle layer for member markers
      map.current.addLayer({
        id: 'client-points',
        type: 'circle',
        source: 'clients',
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(124, 189, 255, 0.8)',
          'circle-stroke-color': 'rgba(255, 255, 255, 1)',
          'circle-stroke-width': 2,
        },
      });

      // Click handler for markers
      map.current.on('click', 'client-points', async (e) => {
        if (!e.features?.[0] || !map.current) return;

        const props = e.features[0].properties;
        
        // Fetch full member details using name and location
        const memberDetails = await fetchMemberDetails(
          props.name,
          props.city,
          props.region,
          props.country
        );
        if (memberDetails) {
          setSelectedMember(memberDetails);
          setShowMemberDialog(true);
        }
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

  // Update source data when members change
  useEffect(() => {
    if (!map.current) {
      console.log('Map not initialized yet');
      return;
    }

    // Wait for style to be loaded before updating source
    const updateSource = () => {
      if (!map.current || !map.current.isStyleLoaded()) {
        console.log('Map style not loaded yet');
        return;
      }

      const source = map.current.getSource('clients');
      if (source && source.type === 'geojson') {
        console.log('Updating map with members:', geojson.features.length);
        console.log('Sample feature:', geojson.features[0]);
        source.setData(geojson);
      } else {
        console.log('Source not found or not geojson type');
      }
    };

    if (map.current.isStyleLoaded()) {
      updateSource();
    } else {
      map.current.once('load', updateSource);
    }
  }, [geojson]);

  const handleViewProfile = () => {
    if (selectedMember) {
      setShowMemberDialog(false);
      navigate('/merchant', {
        state: {
          activeTab: 'community',
          selectedUserId: selectedMember.user_id,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
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
        
        {/* Hide Mapbox branding */}
        <style>{`
          .mapboxgl-ctrl-logo,
          .mapboxgl-ctrl-attrib {
            display: none !important;
          }
        `}</style>

        {/* Starfield background overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#0B1120]/30 to-[#0B1120]/60" />
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={toggleSpin}
          className="absolute top-4 left-4 z-10 px-4 py-2 flex items-center gap-2 bg-black/60 border border-white/20 rounded-lg hover:bg-black/80 hover:border-blue-500 transition-all text-white text-sm font-medium"
          title={isPaused ? 'Resume Rotation' : 'Pause Rotation'}
        >
          {isPaused ? (
            <>
              <span className="text-lg">▶</span>
              <span>Play</span>
            </>
          ) : (
            <>
              <span className="text-lg">❚❚</span>
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Member count badge - positioned to cover bottom left */}
        {!loading && (
          <div className="absolute bottom-3 left-3 z-10 px-4 py-2.5 bg-black/80 border border-blue-500/40 rounded-lg text-white text-sm backdrop-blur-sm">
            <span className="font-semibold">{filteredMembers.length}</span> members
          </div>
        )}
      </div>

      {/* Member Profile Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-2xl">
          {selectedMember && (
            <MemberCard
              member={selectedMember}
              onClose={() => setShowMemberDialog(false)}
              onViewProfile={handleViewProfile}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
