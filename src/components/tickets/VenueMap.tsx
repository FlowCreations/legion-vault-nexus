import { useState } from "react";
import { cn } from "@/lib/utils";

interface VenueSection {
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

export function VenueMap({ sections, selectedSectionId, onSelectSection }: VenueMapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const getSectionColor = (section: VenueSection, isHovered: boolean, isSelected: boolean) => {
    const ratio = section.available / section.capacity;
    
    if (section.available === 0) return "fill-muted stroke-border";
    
    if (isSelected) return "fill-primary stroke-primary";
    if (isHovered) return "fill-primary/70 stroke-primary";
    
    if (ratio < 0.1) return "fill-destructive/60 stroke-destructive";
    if (ratio < 0.3) return "fill-yellow-500/60 stroke-yellow-600";
    return "fill-emerald-500/60 stroke-emerald-600";
  };

  const getSectionByType = (type: string) => sections.filter(s => s.section_type === type || s.id === type);

  // Find sections by their demo IDs
  const floorSection = sections.find(s => s.id === 'floor' || s.section_type === 'pit');
  const frontSection = sections.find(s => s.id === 'front');
  const centerSection = sections.find(s => s.id === 'center');
  const rearSection = sections.find(s => s.id === 'rear');
  const balconySection = sections.find(s => s.id === 'balcony');

  const renderSection = (section: VenueSection | undefined, path: string, textX: number, textY: number) => {
    if (!section) return null;
    
    const isHovered = hoveredSection === section.id;
    const isSelected = selectedSectionId === section.id;
    const isSoldOut = section.available === 0;

    return (
      <g
        className={cn(
          "transition-all duration-200 cursor-pointer",
          isSoldOut && "opacity-40 cursor-not-allowed"
        )}
        onMouseEnter={() => !isSoldOut && setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={() => !isSoldOut && onSelectSection(section)}
      >
        <path
          d={path}
          className={cn(
            "transition-all duration-200 stroke-2",
            getSectionColor(section, isHovered, isSelected),
            isSelected && "stroke-[3]"
          )}
        />
        <text
          x={textX}
          y={textY}
          className="fill-foreground text-[10px] font-medium pointer-events-none"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {section.section_name.split(' ')[0]}
        </text>
        {isHovered && !isSoldOut && (
          <text
            x={textX}
            y={textY + 12}
            className="fill-muted-foreground text-[8px] pointer-events-none"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {section.available} left
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-card rounded-xl border border-border overflow-hidden">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width="400" height="300" className="fill-background" />
        
        {/* Stage */}
        <path
          d="M 100 30 Q 200 10 300 30 L 280 50 Q 200 35 120 50 Z"
          className="fill-primary/20 stroke-primary stroke-2"
        />
        <text x="200" y="35" className="fill-primary text-xs font-bold" textAnchor="middle">
          STAGE
        </text>

        {/* Floor / Pit Section */}
        {renderSection(
          floorSection,
          "M 130 60 L 270 60 L 280 110 L 120 110 Z",
          200, 85
        )}

        {/* Front Orchestra - Left */}
        {renderSection(
          frontSection,
          "M 50 70 L 115 60 L 115 110 L 40 120 Z",
          77, 90
        )}

        {/* Front Orchestra - Right */}
        {sections.find(s => s.id === 'front') && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              frontSection?.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => frontSection && frontSection.available > 0 && setHoveredSection(frontSection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => frontSection && frontSection.available > 0 && onSelectSection(frontSection)}
          >
            <path
              d="M 285 60 L 350 70 L 360 120 L 285 110 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                frontSection && getSectionColor(frontSection, hoveredSection === frontSection.id, selectedSectionId === frontSection.id)
              )}
            />
            <text x="322" y="90" className="fill-foreground text-[10px] font-medium pointer-events-none" textAnchor="middle">
              Front
            </text>
          </g>
        )}

        {/* Center Orchestra */}
        {renderSection(
          centerSection,
          "M 115 115 L 285 115 L 295 170 L 105 170 Z",
          200, 142
        )}

        {/* Center Orchestra - Left Wing */}
        {centerSection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              centerSection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => centerSection.available > 0 && setHoveredSection(centerSection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => centerSection.available > 0 && onSelectSection(centerSection)}
          >
            <path
              d="M 35 125 L 110 115 L 100 170 L 25 165 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(centerSection, hoveredSection === centerSection.id, selectedSectionId === centerSection.id)
              )}
            />
          </g>
        )}

        {/* Center Orchestra - Right Wing */}
        {centerSection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              centerSection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => centerSection.available > 0 && setHoveredSection(centerSection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => centerSection.available > 0 && onSelectSection(centerSection)}
          >
            <path
              d="M 290 115 L 365 125 L 375 165 L 300 170 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(centerSection, hoveredSection === centerSection.id, selectedSectionId === centerSection.id)
              )}
            />
          </g>
        )}

        {/* Rear Orchestra */}
        {renderSection(
          rearSection,
          "M 100 175 L 300 175 L 310 220 L 90 220 Z",
          200, 197
        )}

        {/* Rear - Left */}
        {rearSection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              rearSection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => rearSection.available > 0 && setHoveredSection(rearSection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => rearSection.available > 0 && onSelectSection(rearSection)}
          >
            <path
              d="M 20 170 L 95 170 L 85 220 L 15 215 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(rearSection, hoveredSection === rearSection.id, selectedSectionId === rearSection.id)
              )}
            />
          </g>
        )}

        {/* Rear - Right */}
        {rearSection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              rearSection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => rearSection.available > 0 && setHoveredSection(rearSection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => rearSection.available > 0 && onSelectSection(rearSection)}
          >
            <path
              d="M 305 170 L 380 170 L 385 215 L 315 220 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(rearSection, hoveredSection === rearSection.id, selectedSectionId === rearSection.id)
              )}
            />
          </g>
        )}

        {/* Balcony */}
        {renderSection(
          balconySection,
          "M 60 235 L 340 235 L 355 275 L 45 275 Z",
          200, 255
        )}

        {/* Balcony - Left */}
        {balconySection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              balconySection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => balconySection.available > 0 && setHoveredSection(balconySection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => balconySection.available > 0 && onSelectSection(balconySection)}
          >
            <path
              d="M 10 225 L 55 225 L 40 275 L 5 270 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(balconySection, hoveredSection === balconySection.id, selectedSectionId === balconySection.id)
              )}
            />
          </g>
        )}

        {/* Balcony - Right */}
        {balconySection && (
          <g
            className={cn(
              "transition-all duration-200 cursor-pointer",
              balconySection.available === 0 && "opacity-40 cursor-not-allowed"
            )}
            onMouseEnter={() => balconySection.available > 0 && setHoveredSection(balconySection.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => balconySection.available > 0 && onSelectSection(balconySection)}
          >
            <path
              d="M 345 225 L 390 225 L 395 270 L 360 275 Z"
              className={cn(
                "transition-all duration-200 stroke-2",
                getSectionColor(balconySection, hoveredSection === balconySection.id, selectedSectionId === balconySection.id)
              )}
            />
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-600" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/60 border border-yellow-600" />
          <span className="text-muted-foreground">Limited</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm bg-destructive/60 border border-destructive" />
          <span className="text-muted-foreground">Few Left</span>
        </div>
      </div>
    </div>
  );
}
