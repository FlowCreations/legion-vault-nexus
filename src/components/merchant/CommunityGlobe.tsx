import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchCommunityMembers } from "@/lib/fetchCommunityMembers";
import MemberProfileDrawer from "@/components/MemberProfileDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, MapPin } from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Member {
  id: string;
  display_name: string | null;
  location: string | null;
  latitude: number;
  longitude: number;
  watch_time: number | null;
  listen_time: number | null;
  livestream_engagement_score: number | null;
  tier: string | null;
  regionGroup?: string;
}

interface SelectedMember {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

export default function CommunityGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [activeTab, setActiveTab] = useState<"america" | "world">("america");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // rotation/interaction state
  const isInteractingRef = useRef(false);
  const userPausedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCommunityMembers().then((rows) => {
      const normalized = rows.map((m) => ({
        ...m,
        regionGroup: groupByRegion(m)
      }));
      setMembers(normalized);
      console.log(`Loaded ${normalized.length} members with valid coordinates`);
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: { name: "globe" },
      zoom: 1.7,
      center: [-40, 25],
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.setFog({});
      updatePoints();
      setupInteractionLogic();
      startRotation();
    });

    return () => map.remove();
  }, [members, activeTab]);

  function updatePoints() {
    if (!mapRef.current) return;

    const filtered = members.filter((m) => m.regionGroup === activeTab);

    // Calculate engagement score for each member
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filtered.map((m) => {
        const engagement = 
          (m.watch_time || 0) + 
          (m.listen_time || 0) + 
          ((m.livestream_engagement_score || 0) * 10);
        
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
          properties: {
            id: m.id,
            name: m.display_name ?? "Unknown",
            location: m.location ?? "",
            engagement: engagement,
            tier: m.tier || "free"
          }
        };
      })
    };

    if (mapRef.current.getSource("community")) {
      (mapRef.current.getSource("community") as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      mapRef.current.addSource("community", { type: "geojson", data: geojson });

      // Add heatmap layer
      mapRef.current.addLayer({
        id: "community-heatmap",
        type: "heatmap",
        source: "community",
        layout: {
          visibility: showHeatmap ? "visible" : "none"
        },
        paint: {
          // Increase weight based on engagement
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "engagement"],
            0, 0,
            100, 0.5,
            500, 1
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            9, 3
          ],
          // Color ramp: blue -> cyan -> lime -> yellow -> red
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgb(103,169,207)",
            0.4, "rgb(209,229,240)",
            0.6, "rgb(253,219,199)",
            0.8, "rgb(239,138,98)",
            1, "rgb(178,24,43)"
          ],
          // Adjust radius by zoom level
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 2,
            9, 20
          ],
          // Transition from heatmap to circle layer by zoom level
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 1,
            9, 0
          ]
        }
      });

      // Add circle layer on top
      mapRef.current.addLayer({
        id: "community-points",
        type: "circle",
        source: "community",
        minzoom: 7,
        layout: {
          visibility: showHeatmap ? "none" : "visible"
        },
        paint: {
          // Size circle based on engagement
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "engagement"],
            0, 6,
            100, 8,
            500, 12
          ],
          // Color based on engagement
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "engagement"],
            0, "rgba(124,189,255,0.7)",
            100, "rgba(255,205,29,0.85)",
            500, "rgba(239,138,98,0.95)"
          ],
          "circle-stroke-color": "white",
          "circle-stroke-width": 1.5,
          // Add opacity for overlapping points
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 0,
            8, 1
          ]
        }
      });

      // Click handler
      mapRef.current.on("click", "community-points", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const props = feature.properties;

        setSelectedMember({
          id: props?.id || "",
          name: props?.name || "Unknown",
          location: props?.location || "",
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        });
      });

      // Cursor handlers
      mapRef.current.on("mouseenter", "community-points", () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = "pointer";
        }
      });

      mapRef.current.on("mouseleave", "community-points", () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = "";
        }
      });
    }
  }

  // Update layer visibility when heatmap toggle changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getLayer("community-heatmap")) return;

    mapRef.current.setLayoutProperty(
      "community-heatmap",
      "visibility",
      showHeatmap ? "visible" : "none"
    );

    mapRef.current.setLayoutProperty(
      "community-points",
      "visibility",
      showHeatmap ? "none" : "visible"
    );
  }, [showHeatmap]);

  function setupInteractionLogic() {
    const map = mapRef.current;
    if (!map) return;

    const onStart = () => {
      isInteractingRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };

    const onStop = () => {
      if (userPausedRef.current) return;
      idleTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 2500);
    };

    map.on("dragstart", onStart);
    map.on("rotatestart", onStart);
    map.on("zoomstart", onStart);
    map.on("dragend", onStop);
    map.on("rotateend", onStop);
    map.on("zoomend", onStop);
  }

  function startRotation() {
    const map = mapRef.current;
    if (!map) return;

    let last = performance.now();

    function frame(t: number) {
      requestAnimationFrame(frame);
      if (isInteractingRef.current || userPausedRef.current) return;
      const dt = (t - last) / 1000;
      last = t;
      const c = map.getCenter();
      map.setCenter({ lng: c.lng + dt * 3, lat: c.lat });
    }

    requestAnimationFrame(frame);
  }

  const filteredCount = members.filter((m) => m.regionGroup === activeTab).length;

  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button
            onClick={() => setActiveTab("america")}
            variant={activeTab === "america" ? "default" : "outline"}
          >
            IN AMERICA
          </Button>
          <Button
            onClick={() => setActiveTab("world")}
            variant={activeTab === "world" ? "default" : "outline"}
          >
            AROUND THE WORLD
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowHeatmap(!showHeatmap)}
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {showHeatmap ? <Layers className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            {showHeatmap ? "Heatmap" : "Points"}
          </Button>
          <Badge variant="secondary" className="text-sm">
            {filteredCount} {filteredCount === 1 ? "Member" : "Members"}
          </Badge>
        </div>
      </div>

      <div ref={containerRef} className="h-[600px] w-full rounded-xl overflow-hidden border border-border" />

      {showHeatmap && (
        <div className="absolute bottom-6 left-6 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
          <h4 className="text-sm font-semibold mb-2">Engagement Heatmap</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[rgb(103,169,207)]" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[rgb(253,219,199)]" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[rgb(178,24,43)]" />
              <span>High</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on watch time, listen time, and livestream engagement
          </p>
        </div>
      )}

      <MemberProfileDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

function groupByRegion(member: { location: string | null }) {
  const americas = [
    "USA", "United States", "Canada", "Mexico", "Costa Rica", "Guatemala",
    "Brazil", "Argentina", "Colombia", "Chile"
  ];
  const c = (member.location || "").toLowerCase();
  return americas.some((x) => c.includes(x.toLowerCase()))
    ? "america"
    : "world";
}
