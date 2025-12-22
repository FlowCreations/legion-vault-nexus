import { useState, useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { Plus, Minus, Home, ChevronDown, ChevronUp } from "lucide-react";

export interface VenueSection {
  id: string;
  section_name: string;
  section_type: string;
  capacity: number;
  available: number;
  price_modifier: number;
}

interface VenueMapProps {
  sections: VenueSection[];
  selectedSectionId: string | null;
  onSelectSection: (section: VenueSection) => void;
}

// Arena section configuration
const ARENA_SECTIONS = {
  // VIP Floor sections (closest to stage)
  vip: [
    { id: 'vip-7', label: 'VIP 7', x: 140, y: 120 },
    { id: 'vip-8', label: 'VIP 8', x: 200, y: 120 },
    { id: 'vip-24', label: 'VIP 24', x: 260, y: 120 },
  ],
  // Lower bowl (100-level)
  lower: [
    { id: 'sec-101', label: '101', angle: 180, radius: 140 },
    { id: 'sec-102', label: '102', angle: 165, radius: 140 },
    { id: 'sec-103', label: '103', angle: 150, radius: 140 },
    { id: 'sec-104', label: '104', angle: 135, radius: 140 },
    { id: 'sec-105', label: '105', angle: 120, radius: 140 },
    { id: 'sec-106', label: '106', angle: 105, radius: 140 },
    { id: 'sec-107', label: '107', angle: 90, radius: 140 },
    { id: 'sec-108', label: '108', angle: 75, radius: 140 },
    { id: 'sec-109', label: '109', angle: 60, radius: 140 },
    { id: 'sec-110', label: '110', angle: 45, radius: 140 },
    { id: 'sec-111', label: '111', angle: 30, radius: 140 },
    { id: 'sec-112', label: '112', angle: 15, radius: 140 },
    { id: 'sec-113', label: '113', angle: 0, radius: 140 },
  ],
  // Upper bowl (200-level)
  upper: [
    { id: 'sec-201', label: '201', angle: 180, radius: 185 },
    { id: 'sec-202', label: '202', angle: 168, radius: 185 },
    { id: 'sec-203', label: '203', angle: 156, radius: 185 },
    { id: 'sec-204', label: '204', angle: 144, radius: 185 },
    { id: 'sec-205', label: '205', angle: 132, radius: 185 },
    { id: 'sec-206', label: '206', angle: 120, radius: 185 },
    { id: 'sec-207', label: '207', angle: 108, radius: 185 },
    { id: 'sec-208', label: '208', angle: 96, radius: 185 },
    { id: 'sec-209', label: '209', angle: 84, radius: 185 },
    { id: 'sec-210', label: '210', angle: 72, radius: 185 },
    { id: 'sec-211', label: '211', angle: 60, radius: 185 },
    { id: 'sec-212', label: '212', angle: 48, radius: 185 },
    { id: 'sec-213', label: '213', angle: 36, radius: 185 },
    { id: 'sec-214', label: '214', angle: 24, radius: 185 },
    { id: 'sec-215', label: '215', angle: 12, radius: 185 },
    { id: 'sec-216', label: '216', angle: 0, radius: 185 },
  ],
};

const VenueMap = memo(function VenueMap({ sections, selectedSectionId, onSelectSection }: VenueMapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [legendOpen, setLegendOpen] = useState(true);

  const centerX = 200;
  const centerY = 200;

  // Get section data by ID
  const getSectionData = (sectionId: string): VenueSection | null => {
    // Map arena section IDs to actual section data
    const section = sections.find(s => s.id === sectionId);
    if (section) return section;

    // Fallback mapping for demo sections
    if (sectionId.startsWith('vip-')) {
      return sections.find(s => s.section_type === 'pit' || s.id === 'floor') || null;
    }
    if (sectionId.startsWith('sec-1')) {
      const num = parseInt(sectionId.split('-')[1]);
      if (num <= 103) return sections.find(s => s.id === 'front') || null;
      if (num <= 108) return sections.find(s => s.id === 'center') || null;
      return sections.find(s => s.id === 'rear') || null;
    }
    if (sectionId.startsWith('sec-2')) {
      return sections.find(s => s.id === 'balcony') || null;
    }
    return null;
  };

  const getSectionColor = (sectionId: string) => {
    const section = getSectionData(sectionId);
    if (!section) return { fill: 'hsl(var(--muted))', stroke: 'hsl(var(--border))' };
    
    const ratio = section.available / section.capacity;
    const isHovered = hoveredSection === sectionId;
    const isSelected = selectedSectionId === sectionId || selectedSectionId === section.id;
    
    if (section.available === 0) {
      return { fill: 'hsl(var(--muted))', stroke: 'hsl(var(--border))' };
    }
    
    if (isSelected) {
      return { fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary))' };
    }
    
    if (isHovered) {
      return { fill: 'hsl(var(--primary) / 0.7)', stroke: 'hsl(var(--primary))' };
    }
    
    // Ticketmaster-style blue gradient based on price
    const priceModifier = section.price_modifier;
    if (priceModifier >= 1.4) {
      return { fill: '#1e40af', stroke: '#1e3a8a' }; // Premium - dark blue
    }
    if (priceModifier >= 1.2) {
      return { fill: '#2563eb', stroke: '#1d4ed8' }; // High - medium blue
    }
    if (priceModifier >= 1.0) {
      return { fill: '#3b82f6', stroke: '#2563eb' }; // Standard - blue
    }
    if (priceModifier >= 0.8) {
      return { fill: '#60a5fa', stroke: '#3b82f6' }; // Value - light blue
    }
    return { fill: '#93c5fd', stroke: '#60a5fa' }; // Economy - lightest blue
  };

  const handleSectionClick = (sectionId: string) => {
    const section = getSectionData(sectionId);
    if (section && section.available > 0) {
      onSelectSection(section);
    }
  };

  const handleSectionHover = (sectionId: string | null) => {
    if (sectionId) {
      const section = getSectionData(sectionId);
      if (section && section.available > 0) {
        setHoveredSection(sectionId);
      }
    } else {
      setHoveredSection(null);
    }
  };

  // Pre-compute all arc paths once - these never change
  const precomputedPaths = useMemo(() => {
    const createArcSection = (
      startAngle: number,
      endAngle: number,
      innerRadius: number,
      outerRadius: number
    ) => {
      const rad = (angle: number) => (angle * Math.PI) / 180;
      const startOuter = {
        x: centerX + outerRadius * Math.cos(rad(startAngle)),
        y: centerY - outerRadius * Math.sin(rad(startAngle)) + 20,
      };
      const endOuter = {
        x: centerX + outerRadius * Math.cos(rad(endAngle)),
        y: centerY - outerRadius * Math.sin(rad(endAngle)) + 20,
      };
      const startInner = {
        x: centerX + innerRadius * Math.cos(rad(startAngle)),
        y: centerY - innerRadius * Math.sin(rad(startAngle)) + 20,
      };
      const endInner = {
        x: centerX + innerRadius * Math.cos(rad(endAngle)),
        y: centerY - innerRadius * Math.sin(rad(endAngle)) + 20,
      };
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${startOuter.x} ${startOuter.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${startInner.x} ${startInner.y} Z`;
    };

    const paths: Record<string, { path: string; labelX: number; labelY: number }> = {};
    
    // Lower sections
    ARENA_SECTIONS.lower.forEach(config => {
      const startAngle = config.angle - 7;
      const endAngle = config.angle + 7;
      const innerRadius = 95;
      const outerRadius = 130;
      const midRadius = (innerRadius + outerRadius) / 2;
      const rad = (config.angle * Math.PI) / 180;
      paths[config.id] = {
        path: createArcSection(startAngle, endAngle, innerRadius, outerRadius),
        labelX: centerX + midRadius * Math.cos(rad),
        labelY: centerY - midRadius * Math.sin(rad) + 20,
      };
    });
    
    // Upper sections
    ARENA_SECTIONS.upper.forEach(config => {
      const startAngle = config.angle - 5.5;
      const endAngle = config.angle + 5.5;
      const innerRadius = 145;
      const outerRadius = 180;
      const midRadius = (innerRadius + outerRadius) / 2;
      const rad = (config.angle * Math.PI) / 180;
      paths[config.id] = {
        path: createArcSection(startAngle, endAngle, innerRadius, outerRadius),
        labelX: centerX + midRadius * Math.cos(rad),
        labelY: centerY - midRadius * Math.sin(rad) + 20,
      };
    });
    
    return paths;
  }, [centerX, centerY]);

  const renderLowerSection = (config: { id: string; label: string; angle: number; radius: number }, index: number) => {
    const sectionData = getSectionData(config.id);
    const colors = getSectionColor(config.id);
    const isSoldOut = !sectionData || sectionData.available === 0;
    const isHovered = hoveredSection === config.id;
    const isSelected = selectedSectionId === config.id || (sectionData && selectedSectionId === sectionData.id);
    
    // Use precomputed path
    const computed = precomputedPaths[config.id];
    if (!computed) return null;
    
    return (
      <g
        key={config.id}
        className={cn(
          "transition-all duration-150 cursor-pointer",
          isSoldOut && "opacity-40 cursor-not-allowed"
        )}
        onMouseEnter={() => handleSectionHover(config.id)}
        onMouseLeave={() => handleSectionHover(null)}
        onClick={() => handleSectionClick(config.id)}
      >
        <path
          d={computed.path}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-150"
        />
        <text
          x={computed.labelX}
          y={computed.labelY}
          className="fill-white text-[8px] font-bold pointer-events-none"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {config.label}
        </text>
      </g>
    );
  };

  const renderUpperSection = (config: { id: string; label: string; angle: number; radius: number }, index: number) => {
    const sectionData = getSectionData(config.id);
    const colors = getSectionColor(config.id);
    const isSoldOut = !sectionData || sectionData.available === 0;
    const isSelected = selectedSectionId === config.id || (sectionData && selectedSectionId === sectionData.id);
    
    // Use precomputed path
    const computed = precomputedPaths[config.id];
    if (!computed) return null;
    
    return (
      <g
        key={config.id}
        className={cn(
          "transition-all duration-150 cursor-pointer",
          isSoldOut && "opacity-40 cursor-not-allowed"
        )}
        onMouseEnter={() => handleSectionHover(config.id)}
        onMouseLeave={() => handleSectionHover(null)}
        onClick={() => handleSectionClick(config.id)}
      >
        <path
          d={computed.path}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-150"
        />
        <text
          x={computed.labelX}
          y={computed.labelY}
          className="fill-white text-[7px] font-bold pointer-events-none"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {config.label}
        </text>
      </g>
    );
  };

  const renderVIPSection = (config: { id: string; label: string; x: number; y: number }) => {
    const sectionData = getSectionData(config.id);
    const colors = getSectionColor(config.id);
    const isSoldOut = !sectionData || sectionData.available === 0;
    const isSelected = selectedSectionId === config.id || (sectionData && selectedSectionId === sectionData.id);
    
    return (
      <g
        key={config.id}
        className={cn(
          "transition-all duration-150 cursor-pointer",
          isSoldOut && "opacity-40 cursor-not-allowed"
        )}
        onMouseEnter={() => handleSectionHover(config.id)}
        onMouseLeave={() => handleSectionHover(null)}
        onClick={() => handleSectionClick(config.id)}
      >
        <rect
          x={config.x - 25}
          y={config.y - 12}
          width={50}
          height={24}
          rx={4}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-150"
        />
        <text
          x={config.x}
          y={config.y}
          className="fill-white text-[8px] font-bold pointer-events-none"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {config.label}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-card rounded-xl border border-border overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          className="w-8 h-8 bg-background/90 backdrop-blur-sm border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="w-8 h-8 bg-background/90 backdrop-blur-sm border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="w-8 h-8 bg-background/90 backdrop-blur-sm border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Arena Map */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width="400" height="400" className="fill-background" />
        
        {/* Arena outer ring */}
        <ellipse
          cx={centerX}
          cy={centerY + 20}
          rx={190}
          ry={180}
          className="fill-muted/30 stroke-border"
          strokeWidth={1}
        />

        {/* Upper Level Sections (200s) */}
        {ARENA_SECTIONS.upper.map((config, index) => renderUpperSection(config, index))}

        {/* Lower Level Sections (100s) */}
        {ARENA_SECTIONS.lower.map((config, index) => renderLowerSection(config, index))}

        {/* Floor/Court Area */}
        <ellipse
          cx={centerX}
          cy={centerY + 20}
          rx={85}
          ry={75}
          className="fill-muted/20 stroke-border"
          strokeWidth={1}
        />

        {/* Stage */}
        <path
          d={`M ${centerX - 60} 60 Q ${centerX} 40 ${centerX + 60} 60 L ${centerX + 50} 85 Q ${centerX} 70 ${centerX - 50} 85 Z`}
          className="fill-primary/30 stroke-primary"
          strokeWidth={2}
        />
        <text 
          x={centerX} 
          y={68} 
          className="fill-primary text-[10px] font-bold" 
          textAnchor="middle"
        >
          STAGE
        </text>

        {/* VIP Floor Sections */}
        {ARENA_SECTIONS.vip.map(config => renderVIPSection(config))}

        {/* Floor Label */}
        <text
          x={centerX}
          y={centerY + 50}
          className="fill-muted-foreground text-[10px] font-medium"
          textAnchor="middle"
        >
          FLOOR
        </text>

        {/* Hovered Section Tooltip */}
        {hoveredSection && (
          <g>
            <rect
              x={centerX - 50}
              y={10}
              width={100}
              height={24}
              rx={4}
              className="fill-foreground"
            />
            <text
              x={centerX}
              y={22}
              className="fill-background text-[9px] font-medium"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {hoveredSection.replace('sec-', 'Section ').replace('vip-', 'VIP ')}
            </text>
            {getSectionData(hoveredSection) && (
              <text
                x={centerX}
                y={30}
                className="fill-background/70 text-[7px]"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                ${Math.round(75 * (getSectionData(hoveredSection)?.price_modifier || 1))} · {getSectionData(hoveredSection)?.available} left
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Collapsible Legend */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium hover:bg-muted/50 transition-colors"
          >
            <span>Legend</span>
            {legendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          {legendOpen && (
            <div className="px-3 pb-2 space-y-1.5 border-t border-border pt-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#1e40af' }} />
                <span className="text-muted-foreground">Premium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#2563eb' }} />
                <span className="text-muted-foreground">VIP</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-muted-foreground">Standard</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#60a5fa' }} />
                <span className="text-muted-foreground">Value</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#93c5fd' }} />
                <span className="text-muted-foreground">Economy</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VenueMap.displayName = 'VenueMap';

export { VenueMap };
