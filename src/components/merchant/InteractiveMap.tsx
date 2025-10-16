import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(1, Math.min(3, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.3));
  const handleZoomOut = () => setZoom(prev => Math.max(1, prev - 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert lat/lng to SVG coordinates
  const latLngToXY = (lat: number, lng: number) => {
    // Simple mercator-like projection for US map
    const x = ((lng + 125) / 60) * 800;
    const y = ((50 - lat) / 25) * 400;
    return { x, y };
  };

  return (
    <div className="rounded-lg overflow-hidden min-h-[400px] border border-white/10 relative bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0"
          onClick={handleReset}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
        >
          {/* US Map Outline */}
          <path
            d="M100,200 L120,190 L140,195 L160,185 L180,190 L200,180 L220,185 L240,175 L260,180 L280,170 L300,175 L320,165 L340,170 L360,160 L380,165 L400,155 L420,160 L440,150 L460,155 L480,145 L500,150 L520,155 L540,150 L560,155 L580,160 L600,165 L620,170 L640,175 L660,180 L680,185 L700,190 L700,210 L680,215 L660,220 L640,225 L620,230 L600,235 L580,240 L560,245 L540,250 L520,255 L500,260 L480,265 L460,270 L440,275 L420,280 L400,285 L380,290 L360,295 L340,300 L320,305 L300,310 L280,315 L260,320 L240,315 L220,310 L200,305 L180,300 L160,295 L140,290 L120,285 L100,280 Z"
            fill="rgba(59, 130, 246, 0.1)"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />

          {/* City Markers */}
          {cities.map((city) => {
            const { x, y } = latLngToXY(city.lat, city.lng);
            const size = Math.max(8, Math.min(25, Math.sqrt(city.fans) / 8));

            return (
              <g key={city.rank}>
                {/* Marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="#3b82f6"
                  stroke="#1e40af"
                  strokeWidth="2"
                  className="hover:fill-blue-400 transition-all cursor-pointer"
                  opacity="0.8"
                >
                  <title>
                    {city.city}, {city.state}
                    {'\n'}
                    {city.fans.toLocaleString()} fans
                    {'\n'}
                    {city.streams.toLocaleString()} streams
                  </title>
                </circle>
                
                {/* Pulse animation */}
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    from={size}
                    to={size + 15}
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* City label */}
                <text
                  x={x}
                  y={y - size - 5}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  className="pointer-events-none"
                  opacity="0.9"
                >
                  {city.city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-black/50 px-3 py-2 rounded">
        Drag to pan • Scroll to zoom • Hover markers for details
      </div>
    </div>
  );
};
