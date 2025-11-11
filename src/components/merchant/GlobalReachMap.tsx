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
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  title?: string;
};

type FC = GeoJSON.FeatureCollection<GeoJSON.Point, Member>;

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
  initialZoom = 1.2,
  className = "",
  title = "Global Reach",
}: Props) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rotatingRef = useRef(true);
  const [members, setMembers] = useState<Member[]>(membersProp);
  const [hasFitOnce, setHasFitOnce] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    async function fetchToken() {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          console.log('✅ Mapbox token received:', data.token.substring(0, 10) + '...');
          if (!data.token.startsWith('pk.')) {
            throw new Error('Invalid Mapbox token format');
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

  // Merge incoming members
  useEffect(() => {
    if (!membersProp.length) return;
    setMembers((prev) => {
      const byId = new Map<string, Member>(prev.map((m) => [m.id, m]));
      for (const m of membersProp) byId.set(m.id, m);
      return Array.from(byId.values());
    });
  }, [membersProp]);

  // Poll members endpoint
  useEffect(() => {
    if (!membersEndpoint) return;
    let stopped = false;
    
    async function load() {
      try {
        console.log('🔄 Fetching members from:', membersEndpoint);
        const { data, error } = await supabase.functions.invoke(membersEndpoint, { method: 'GET' });
        if (error) throw error;
        
        console.log('✅ Received raw data:', data);
        
        let membersData: Member[];
        if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          // Convert GeoJSON features to Member array
          membersData = data.features
            .filter((f: any) => {
              const coords = f.geometry?.coordinates;
              return coords && coords.length === 2 && 
                     Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
            })
            .map((f: any) => ({
              id: f.properties.user_id || f.properties.id || Math.random().toString(),
              name: f.properties.name || f.properties.display_name || 'Member',
              lng: f.geometry.coordinates[0], // GeoJSON is [lng, lat]
              lat: f.geometry.coordinates[1],
              city: f.properties.city || (f.properties.location?.split(',')[0]?.trim()) || '',
              country: f.properties.country || '',
              avatarUrl: f.properties.avatar_url || f.properties.avatarUrl,
            }));
          
          console.log('✅ Converted to members:', membersData.length, 'valid coordinates');
        } else if (Array.isArray(data)) {
          membersData = data;
        } else {
          throw new Error('Unexpected data format');
        }
        
        if (!stopped && Array.isArray(membersData) && membersData.length > 0) {
          console.log('✅ Setting members:', membersData.length);
          setMembers(membersData); // Replace all members with fresh data
        }
      } catch (err) {
        console.error('❌ Error polling members:', err);
      }
    }
    
    load();
    const id = setInterval(load, 30_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [membersEndpoint]);

  const featureCollection: FC = useMemo(() => toFeatureCollection(members), [members]);

  // Initialize map with requestAnimationFrame
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    if (!token) return;

    const container = containerRef.current;

    // 🔧 Ensure container has height before Mapbox loads
    const style = getComputedStyle(container);
    if (parseInt(style.height) < 200) {
      container.style.height = "600px";
      console.log('🔧 Set explicit container height');
    }

    // 🔧 Wait for React paint before Mapbox init
    requestAnimationFrame(() => {
      try {
        console.log('🗺️ Initializing Mapbox...');
        
        mapboxgl.accessToken = token;
        
        const map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/dark-v11",
          projection: "globe",
          center: initialCenter,
          zoom: initialZoom,
          attributionControl: false,
          cooperativeGestures: false,
        });

        mapRef.current = map;
        initializedRef.current = true;

        map.on('error', (e) => {
          console.error('❌ Mapbox error:', e.error);
          setError(`Map error: ${e.error?.message || 'Unknown error'}`);
          setLoading(false);
        });

        loadingTimeoutRef.current = setTimeout(() => {
          console.error('⏱️ Map loading timeout');
          setError('Map loading timeout');
          setLoading(false);
        }, 15000);

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        // Auto-rotation setup
        const secondsPerRevolution = 120;
        const maxSpinZoom = 5;
        const slowSpinZoom = 3;

        function spinGlobe() {
          if (!rotatingRef.current) return;
          
          const zoom = map.getZoom();
          if (zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
              const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
              distancePerSecond *= zoomDif;
            }
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            map.easeTo({ center, duration: 1000, easing: (n) => n });
          }
        }

        // Pause rotation on user interaction
        let userInteracting = false;
        map.on('mousedown', () => { userInteracting = true; rotatingRef.current = false; });
        map.on('dragstart', () => { userInteracting = true; rotatingRef.current = false; });
        map.on('mouseup', () => { 
          userInteracting = false; 
          if (isRotating) {
            rotatingRef.current = true;
            spinGlobe();
          }
        });
        map.on('dragend', () => { 
          userInteracting = false;
          if (isRotating) {
            rotatingRef.current = true;
            spinGlobe();
          }
        });
        map.on('touchend', () => { 
          userInteracting = false;
          if (isRotating) {
            rotatingRef.current = true;
            spinGlobe();
          }
        });
        map.on('moveend', () => { 
          if (!userInteracting && rotatingRef.current) {
            spinGlobe();
          }
        });

        map.on("load", () => {
          console.log('✅ Mapbox loaded successfully');
          
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          
          map.resize(); // Force resize
          setLoading(false);
          setError(null);
          
          map.setFog({
            color: 'rgb(18, 18, 18)',
            'high-color': 'rgb(124, 189, 255)',
            'horizon-blend': 0.2,
            'space-color': 'rgb(11, 11, 11)',
            'star-intensity': 0.8,
          });

          map.addSource("members", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
            cluster: true,
            clusterRadius: 60,
            clusterMaxZoom: 14,
          });

          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "members",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step", ["get", "point_count"],
                "rgba(124, 189, 255, 0.6)", 10,
                "rgba(124, 189, 255, 0.7)", 50,
                "rgba(124, 189, 255, 0.8)", 100,
                "rgba(124, 189, 255, 0.9)"
              ],
              "circle-radius": [
                "step", ["get", "point_count"],
                12, 10, 16, 50, 24, 100, 32
              ],
              "circle-stroke-color": "rgba(255, 255, 255, 0.8)",
              "circle-stroke-width": 2,
            },
          });

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
            paint: { "text-color": "#ffffff" },
          });

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

          map.on("click", "clusters", (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
            const clusterId = features[0].properties?.cluster_id;
            const source = map.getSource("members") as any;
            source?.getClusterExpansionZoom?.(clusterId, (err: any, zoom: number) => {
              if (err) return;
              const [lng, lat] = (features[0].geometry as any).coordinates;
              map.easeTo({ center: [lng, lat], zoom });
            });
          });

          map.on("click", "unclustered-point", (e) => {
            const feature = e.features?.[0] as any;
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

            new mapboxgl.Popup({ closeOnClick: true, className: 'member-popup' })
              .setLngLat([lng, lat])
              .setHTML(html)
              .addTo(map);
          });

          map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
          map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));

          // Start globe rotation
          spinGlobe();
        });

        const handleResize = () => map.resize();
        window.addEventListener("resize", handleResize);

        return () => {
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          window.removeEventListener("resize", handleResize);
          map.remove();
          mapRef.current = null;
        };
      } catch (err) {
        console.error('❌ Failed to initialize Mapbox:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
        setLoading(false);
        initializedRef.current = false;
      }
    });
  }, [token, initialCenter, initialZoom]);

  // Update map data
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    console.log('🔄 Attempting to update map with members:', members.length);
    
    if (!map.isStyleLoaded()) {
      const onLoad = () => {
        const src = map.getSource("members") as mapboxgl.GeoJSONSource;
        if (src) {
          console.log('📍 Updating members on load:', featureCollection.features.length);
          src.setData(featureCollection);
        }
      };
      map.once("load", onLoad);
      return;
    }
    
    const src = map.getSource("members") as mapboxgl.GeoJSONSource;
    if (src) {
      console.log('📍 Updating members data:', featureCollection.features.length, 'features');
      src.setData(featureCollection);
    } else {
      console.warn('⚠️ Members source not found on map');
    }

    if (autoFit && !hasFitOnce && members.length > 0) {
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

  const toggleRotation = () => {
    setIsRotating(prev => !prev);
    rotatingRef.current = !rotatingRef.current;
    if (rotatingRef.current && mapRef.current) {
      // Resume rotation
      const map = mapRef.current;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      const secondsPerRevolution = 120;
      
      if (zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        center.lng -= distancePerSecond;
        map.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }
  };

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        {title && <div className="mb-4 text-2xl font-semibold">{title}</div>}
        <div className="relative w-full h-[600px] rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-destructive font-semibold text-lg">⚠️ Map Error</p>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`w-full ${className}`}>
        {title && <div className="mb-4 text-2xl font-semibold">{title}</div>}
        <div className="relative w-full h-[600px] rounded-lg border border-border bg-muted flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading Mapbox...</p>
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
        
        {/* Pause/Play rotation control - bottom right */}
        <button
          onClick={toggleRotation}
          className="absolute bottom-4 right-4 z-10 px-4 py-2 bg-black/80 border border-blue-500/40 rounded-lg text-white text-sm backdrop-blur-sm hover:bg-black/90 transition-colors font-medium"
        >
          {isRotating ? "⏸ Pause" : "▶ Play"}
        </button>
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E]/90 backdrop-blur-sm z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading global map...</p>
              <p className="text-xs text-muted-foreground/60 mt-2">Please wait...</p>
            </div>
          </div>
        )}
        
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

        {!loading && (
          <div className="absolute bottom-4 left-4 z-10 px-4 py-2.5 bg-black/80 border border-blue-500/40 rounded-lg text-white text-sm backdrop-blur-sm">
            <span className="font-semibold">{members.length}</span> members worldwide
          </div>
        )}
      </div>
    </div>
  );
}
