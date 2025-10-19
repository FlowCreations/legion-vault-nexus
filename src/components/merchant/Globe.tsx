import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
  lat: number;
  lng: number;
}

interface GlobeProps {
  cities: CityData[];
}

const Globe: React.FC<GlobeProps> = ({ cities }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const size = Math.max(12, Math.min(35, city.fans / 120));
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = 'rgb(59, 130, 246)';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        el.style.transition = 'transform 0.2s';
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
        }).setHTML(
          `<div style="background: rgb(18, 18, 18); color: white; padding: 12px; border-radius: 8px; border: 1px solid rgb(59, 130, 246);">
            <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 16px;">${city.city}${city.state ? ', ' + city.state : ''}</h3>
            <p style="margin: 0; font-size: 14px;"><strong>${city.fans.toLocaleString()}</strong> fans</p>
            <p style="margin: 0; color: rgb(156, 163, 175); font-size: 12px;">${city.streams.toLocaleString()} streams</p>
          </div>`
        );

        new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Rotation animation
    const secondsPerRevolution = 120;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
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
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-white/10 bg-black">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default Globe;
