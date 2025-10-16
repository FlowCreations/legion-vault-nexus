import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityData {
  rank: number;
  city: string;
  state?: string;
  streams: number;
  fans: number;
  lat: number;
  lng: number;
}

interface FanMapProps {
  cities: CityData[];
}

export const FanMap = ({ cities }: FanMapProps) => {
  return (
    <MapContainer 
      center={[37.0902, -95.7129] as LatLngExpression} 
      zoom={4} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {cities.map((city) => (
        <CircleMarker
          key={city.rank}
          center={[city.lat, city.lng] as LatLngExpression}
          pathOptions={{
            fillColor: "#3b82f6",
            color: "#1e40af",
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.5,
          }}
          radius={Math.sqrt(city.fans) / 5}
        >
          <Popup>
            <div className="text-sm text-black">
              <strong>{city.city}, {city.state}</strong><br/>
              {city.fans.toLocaleString()} fans<br/>
              {city.streams.toLocaleString()} streams
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};
