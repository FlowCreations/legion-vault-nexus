import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchCommunityMembers } from "@/lib/fetchCommunityMembers";
import MemberProfileDrawer from "@/components/MemberProfileDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Member {
  id: string;
  display_name: string | null;
  location: string | null;
  latitude: number;
  longitude: number;
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

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filtered.map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
        properties: {
          id: m.id,
          name: m.display_name ?? "Unknown",
          location: m.location ?? ""
        }
      }))
    };

    if (mapRef.current.getSource("community")) {
      (mapRef.current.getSource("community") as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      mapRef.current.addSource("community", { type: "geojson", data: geojson });

      mapRef.current.addLayer({
        id: "community-points",
        type: "circle",
        source: "community",
        paint: {
          "circle-radius": 8,
          "circle-color": "rgba(124,189,255,0.85)",
          "circle-stroke-color": "white",
          "circle-stroke-width": 1.5
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
        <Badge variant="secondary" className="text-sm">
          {filteredCount} {filteredCount === 1 ? "Member" : "Members"}
        </Badge>
      </div>

      <div ref={containerRef} className="h-[600px] w-full rounded-xl overflow-hidden border border-border" />

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
