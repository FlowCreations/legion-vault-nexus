import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  useEffect(() => {
    if (!mapContainer.current) return;

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

    map.current.on('style.load', () => {
      if (!map.current) return;

      map.current.setFog({
        color: 'hsl(var(--background))',
        'high-color': 'hsl(var(--primary))',
        'horizon-blend': 0.1,
        'space-color': 'hsl(var(--background))',
        'star-intensity': 0.6,
      });

      // Add city markers
      cities.forEach((city) => {
        const el = document.createElement('div');
        el.className = 'city-marker';
        const size = Math.max(10, Math.min(40, city.fans / 100));
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = 'hsl(var(--primary))';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid hsl(var(--primary-foreground))';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 20px hsl(var(--primary) / 0.6)';
        el.style.animation = 'pulse 2s ease-in-out infinite';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="color: hsl(var(--foreground)); padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${city.city}${city.state ? ', ' + city.state : ''}</h3>
            <p style="margin: 0;"><strong>${city.fans.toLocaleString()}</strong> fans</p>
            <p style="margin: 0; color: hsl(var(--muted-foreground));">${city.streams.toLocaleString()} streams</p>
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

    // Add custom CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.current?.remove();
      document.head.removeChild(style);
    };
  }, [cities]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Globe;
