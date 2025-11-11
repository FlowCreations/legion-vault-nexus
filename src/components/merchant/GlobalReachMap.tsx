"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export type Member = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  avatarUrl?: string;
};

type Props = {
  members?: Member[];
  membersEndpoint?: string;
  autoFit?: boolean;
  padding?: number;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  className?: string;
  title?: string;
};

type FC = GeoJSON.FeatureCollection<GeoJSON.Point, Member>;

/**
 * Convert members array to GeoJSON FeatureCollection
 * Filters out invalid coordinates to prevent map errors
 */
function toFeatureCollection(members: Member[]): FC {
  return {
    type: "FeatureCollection",
    features: members
      .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng))
      .map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: m,
      })),
  };
}

/**
 * Calculate bounds from member locations for auto-fit
 */
function boundsFromMembers(members: Member[]) {
  const valid = members.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  if (!valid.length) return null;
  const b = new mapboxgl.LngLatBounds([valid[0].lng, valid[0].lat], [valid[0].lng, valid[0].lat]);
  for (const m of valid) b.extend([m.lng, m.lat]);
  return b;
}

export default function GlobalReachMap({
  members: membersProp = [],
  membersEndpoint,
  autoFit = true,
  padding = 60,
  initialCenter = [0, 20],
  initialZoom = 1.5,
  className = "",
  title = "Global Reach",
}: Props) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [members, setMembers] = useState<Member[]>(membersProp);
  const [hasFitOnce, setHasFitOnce] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token from edge function on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          console.log('✅ Mapbox token received:', data.token.substring(0, 10) + '...');
          
          // Validate token format
          if (!data.token.startsWith('pk.')) {
            throw new Error('Invalid Mapbox token format. Token should start with "pk."');
          }
          
          setToken(data.token);
          setError(null);
        } else {
          throw new Error('No token received from server');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Mapbox token';
        console.error('❌ Mapbox token error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    }
    fetchToken();
  }, []);

  // Merge incoming prop members whenever they change
  useEffect(() => {
    if (!membersProp.length) return;
    setMembers((prev) => {
      const byId = new Map<string, Member>(prev.map((m) => [m.id, m]));
      for (const m of membersProp) byId.set(m.id, m);
      return Array.from(byId.values());
    });
  }, [membersProp]);

  // Poll endpoint for members every 30s using Supabase client
  useEffect(() => {
    if (!membersEndpoint) return;
    let stopped = false;
    
    async function load() {
      try {
        console.log('🔄 Fetching members from edge function:', membersEndpoint);
        
        // Use Supabase client to invoke edge function
        const { data, error } = await supabase.functions.invoke(membersEndpoint, {
          method: 'GET'
        });
        
        if (error) {
          console.error('❌ Error fetching members:', error);
          throw error;
        }
        
        console.log('✅ Received data:', data);
        
        // Handle both direct Member[] array and GeoJSON FeatureCollection
        let membersData: Member[];
        
        if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          // Convert GeoJSON to Member array
          membersData = data.features.map((f: any) => ({
            id: f.properties.user_id || f.properties.id,
            name: f.properties.name || f.properties.display_name || 'Member',
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            city: f.properties.city || extractCity(f.properties.location),
            country: f.properties.country || '',
            avatarUrl: f.properties.avatar_url || f.properties.avatarUrl,
          }));
        } else if (Array.isArray(data)) {
          membersData = data;
        } else {
          throw new Error('Unexpected data format');
        }
        
        if (!stopped && Array.isArray(membersData)) {
          console.log('✅ Loaded members:', membersData.length);
          setMembers((prev) => {
            const byId = new Map<string, Member>(prev.map((m) => [m.id, m]));
            for (const m of membersData) byId.set(m.id, m);
            return Array.from(byId.values());
          });
        }
      } catch (err) {
        console.error('❌ Error polling members:', err);
      }
    }
    
    load(); // Initial load
    const id = setInterval(load, 30_000); // Poll every 30s
    
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [membersEndpoint]);

  // Helper to extract city from location string "City, Country" format
  function extractCity(location?: string): string {
    if (!location) return '';
    return location.split(',')[0]?.trim() || '';
  }

  const featureCollection: FC = useMemo(() => toFeatureCollection(members), [members]);

  // Initialize map once (never recreate on render)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    if (!token) return;

    console.log('🗺️ Initializing Mapbox with token...');
    
    try {
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        projection: { name: 'globe' },
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
        cooperativeGestures: false,
      });

      mapRef.current = map;
      initializedRef.current = true;

      // Add error event listeners
      map.on('error', (e) => {
        console.error('❌ Mapbox error event:', e);
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
      });

      // Set timeout to catch loading failures
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.error('⏱️ Map loading timeout - taking too long');
          setError('Map is taking too long to load. Please check your connection and try again.');
          setLoading(false);
        }
      }, 15000); // 15 second timeout

    // Add navigation controls
    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.on("load", () => {
      console.log('✅ Map loaded successfully, adding source and layers');
      
      // Clear timeout since map loaded successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setLoading(false);
      setError(null);
      
      // Setup fog/atmosphere
      map.setFog({
        color: 'rgb(18, 18, 18)',
        'high-color': 'rgb(124, 189, 255)',
        'horizon-blend': 0.2,
        'space-color': 'rgb(11, 11, 11)',
        'star-intensity': 0.8,
      });

      // Source with clustering enabled - this is where the magic happens
      map.addSource("members", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 60,
        clusterMaxZoom: 14,
      });

      // Layer 1: Cluster circles - step-based sizing by member count
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "members",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "rgba(124, 189, 255, 0.6)", // <10 members
            10,
            "rgba(124, 189, 255, 0.7)", // 10-50 members
            50,
            "rgba(124, 189, 255, 0.8)", // 50-100 members
            100,
            "rgba(124, 189, 255, 0.9)", // 100+ members
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            12,  // <10 members
            10,
            16,  // 10-50 members
            50,
            24,  // 50-100 members
            100,
            32,  // 100+ members
          ],
          "circle-stroke-color": "rgba(255, 255, 255, 0.8)",
          "circle-stroke-width": 2,
        },
      });

      // Layer 2: Cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "members",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Layer 3: Unclustered points (individual members)
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "members",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "rgba(124, 189, 255, 0.8)",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Click cluster -> zoom into it using getClusterExpansionZoom
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("members") as mapboxgl.GeoJSONSource & {
          getClusterExpansionZoom?: (id: number, cb: (err: any, zoom: number) => void) => void;
        };
        
        source?.getClusterExpansionZoom?.(clusterId, (err, zoom) => {
          if (err) return;
          const [lng, lat] = (features[0].geometry as any).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      // Click unclustered -> show popup with member info
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0] as unknown as GeoJSON.Feature<GeoJSON.Point, Member> | undefined;
        if (!feature) return;
        const { properties, geometry } = feature;
        const [lng, lat] = geometry.coordinates;

        const html = `
          <div style="display:flex;align-items:center;gap:12px;padding:4px;">
            ${properties?.avatarUrl ? `<img src="${properties.avatarUrl}" alt="" style="width:40px;height:40px;border-radius:9999px;object-fit:cover;border:2px solid rgba(124,189,255,0.5)" />` : ""}
            <div style="line-height:1.4">
              <div style="font-weight:600;font-size:14px;color:#fff;">${properties?.name ?? "Member"}</div>
              <div style="opacity:0.8;font-size:12px;color:#ccc;">${[properties?.city, properties?.country].filter(Boolean).join(", ") || "Location unknown"}</div>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ 
          closeOnClick: true,
          className: 'member-popup',
        })
          .setLngLat([lng, lat])
          .setHTML(html)
          .addTo(map);
      });

      // Cursor changes for better UX
      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));

      // Ensure correct sizing after load
      setTimeout(() => map.resize(), 50);
    });

      // Cleanup on unmount - critical for preventing memory leaks
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error('❌ Failed to initialize Mapbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setLoading(false);
      initializedRef.current = false; // Allow retry
    }
  }, [token, initialCenter, initialZoom]);

  // Push data into the source whenever members change (live updates via setData)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    if (!map.isStyleLoaded()) {
      const onLoad = () => {
        const src = map.getSource("members") as mapboxgl.GeoJSONSource;
        if (src) {
          console.log('📍 Updating members data:', featureCollection.features.length);
          src.setData(featureCollection);
        }
      };
      map.once("load", onLoad);
      return;
    }
    
    const src = map.getSource("members") as mapboxgl.GeoJSONSource;
    if (src) {
      console.log('📍 Updating members data:', featureCollection.features.length);
      src.setData(featureCollection);
    }

    // Auto-fit bounds on first non-empty dataset
    if (autoFit && !hasFitOnce && members.length) {
      const b = boundsFromMembers(members);
      if (b) {
        console.log('🎯 Fitting bounds to', members.length, 'members');
        map.fitBounds(b, { padding, maxZoom: 6, duration: 700 });
        setHasFitOnce(true);
      }
    }
  }, [featureCollection, members, autoFit, padding, hasFitOnce]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    initializedRef.current = false;
    window.location.reload();
  };

  // Error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        {title && <div className="mb-4 text-2xl font-semibold">{title}</div>}
        <div className="relative w-full min-h-[600px] rounded-lg overflow-hidden border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-destructive font-semibold text-lg">⚠️ Map Error</p>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading token state
  if (!token) {
    return (
      <div className={`w-full ${className}`}>
        {title && <div className="mb-4 text-2xl font-semibold">{title}</div>}
        <div className="relative w-full min-h-[600px] rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading Mapbox configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {title && <div className="mb-4 text-2xl font-semibold">{title}</div>}
      
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10 bg-[#1E1E1E]">
        <div ref={containerRef} className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }} />
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E]/90 backdrop-blur-sm z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading global map...</p>
              <p className="text-xs text-muted-foreground/60 mt-2">This may take a few seconds...</p>
            </div>
          </div>
        )}
        
        {/* Hide Mapbox branding */}
        <style>{`
          .mapboxgl-ctrl-logo,
          .mapboxgl-ctrl-attrib {
            display: none !important;
          }
          .member-popup .mapboxgl-popup-content {
            background: rgba(18, 18, 18, 0.95);
            border: 1px solid rgba(124, 189, 255, 0.3);
            border-radius: 8px;
            padding: 8px;
          }
          .member-popup .mapboxgl-popup-tip {
            border-top-color: rgba(18, 18, 18, 0.95);
          }
        `}</style>

        {/* Member count badge */}
        {!loading && (
          <div className="absolute bottom-4 left-4 z-10 px-4 py-2.5 bg-black/80 border border-blue-500/40 rounded-lg text-white text-sm backdrop-blur-sm">
            <span className="font-semibold">{members.length}</span> members
          </div>
        )}
      </div>
    </div>
  );
}
