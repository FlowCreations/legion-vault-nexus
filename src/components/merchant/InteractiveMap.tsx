import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  cities: CityData[];
}

export const InteractiveMap = ({ cities }: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95.7129, 37.0902],
      zoom: 3.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each city
    map.current.on('load', () => {
      cities.forEach((city) => {
        // Create a custom marker element
        const el = document.createElement('div');
        const size = Math.max(20, Math.min(50, Math.sqrt(city.fans) / 3));
        el.className = 'custom-marker';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3b82f6';
        el.style.border = '3px solid #1e40af';
        el.style.cursor = 'pointer';
        el.style.opacity = '0.8';
        el.style.transition = 'all 0.3s';
        
        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1';
          el.style.transform = 'scale(1.2)';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.8';
          el.style.transform = 'scale(1)';
        });

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="text-black p-2">
            <h3 class="font-bold text-lg">${city.city}, ${city.state}</h3>
            <p class="text-sm mt-1">${city.fans.toLocaleString()} fans</p>
            <p class="text-sm">${city.streams.toLocaleString()} streams</p>
          </div>
        `);

        // Add marker
        new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });
  };

  const handleSetToken = () => {
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken);
      setIsTokenSet(true);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <div className="rounded-lg border border-white/10 p-8 bg-white/5 min-h-[400px] flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold mb-4">Interactive Map Setup</h3>
        <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
          To display an interactive map, please enter your Mapbox public token. 
          Get one for free at{' '}
          <a 
            href="https://mapbox.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            mapbox.com
          </a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSetToken} disabled={!mapboxToken.trim()}>
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden min-h-[400px] border border-white/10 relative">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
