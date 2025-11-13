import { cn } from '@/lib/utils';
import epiphanySymbol from '@/assets/epiphany-symbol.png';
import oracleSymbol from '@/assets/oracle-symbol.png';
import catalystSymbol from '@/assets/catalyst-symbol.png';

interface IntelligenceNavigatorProps {
  onSelectView?: (view: 'epiphany' | 'oracle' | 'catalyst' | null) => void;
  currentView?: 'epiphany' | 'oracle' | 'catalyst' | null;
}

export function IntelligenceNavigator({ onSelectView, currentView }: IntelligenceNavigatorProps) {
  const handleButtonClick = (buttonId: 'epiphany' | 'oracle' | 'catalyst') => {
    if (onSelectView) onSelectView(buttonId);
  };

  const buttons = [
    {
      id: 'epiphany' as const,
      image: epiphanySymbol,
      name: 'Epiphany',
    },
    {
      id: 'oracle' as const,
      image: oracleSymbol,
      name: 'Oracle',
    },
    {
      id: 'catalyst' as const,
      image: catalystSymbol,
      name: 'Catalyst',
    },
  ];

  return (
    <div className="flex items-center justify-center gap-12 py-12">
      {buttons.map((button) => {
        const isActive = currentView === button.id;
        
        return (
          <button
            key={button.id}
            onClick={() => handleButtonClick(button.id)}
            className={cn(
              "group relative w-56 h-56 rounded-full transition-all duration-500",
              "focus:outline-none",
              isActive && "scale-105",
              !isActive && "hover:scale-103"
            )}
          >
            {/* Outer glow ring */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-xl transition-all duration-500",
              isActive 
                ? "bg-gradient-to-br from-yellow-400/60 via-amber-500/60 to-yellow-600/60 scale-110" 
                : "bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-yellow-600/20 scale-100 group-hover:scale-110 group-hover:from-yellow-400/40 group-hover:via-amber-500/40 group-hover:to-yellow-600/40"
            )} />
            
            {/* Main medallion body */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Base gold gradient */}
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-500",
                "bg-gradient-to-br from-[#F9D976] via-[#F39F27] to-[#C58E11]",
                isActive && "from-[#FFE57F] via-[#FFB84D] to-[#D4A024]"
              )} />
              
              {/* Outer beveled rim */}
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9A7721] via-transparent to-[#9A7721] opacity-30" />
                <div className="absolute inset-[8px] rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/20" />
              </div>
              
              {/* Inner surface with brushed effect */}
              <div className="absolute inset-[12px] rounded-full bg-gradient-radial from-[#F9D976] via-[#EDB454] to-[#D4A024]" />
              
              {/* Symbol container - embossed effect */}
              <div className="absolute inset-[20px] rounded-full flex items-center justify-center">
                {/* Inner shadow for emboss */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_12px_rgba(0,0,0,0.25),inset_0_-4px_12px_rgba(255,255,255,0.15)]" />
                
                {/* Symbol */}
                <div className={cn(
                  "relative w-full h-full rounded-full flex items-center justify-center transition-all duration-500",
                  isActive && "drop-shadow-[0_0_12px_rgba(255,223,0,0.9)]"
                )}>
                  <img 
                    src={button.image} 
                    alt={button.name}
                    className={cn(
                      "w-[85%] h-[85%] object-contain transition-all duration-500",
                      "drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]",
                      isActive && "brightness-110"
                    )}
                  />
                </div>
              </div>
              
              {/* Top arc shine - reflective highlight */}
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-500",
                "bg-gradient-to-b from-white/40 via-white/10 to-transparent",
                "group-hover:from-white/50 group-hover:via-white/15",
                isActive && "from-white/50 via-white/20"
              )} 
                   style={{ clipPath: 'ellipse(95% 30% at 50% 10%)' }} />
              
              {/* Holographic moving shine on hover */}
              <div className={cn(
                "absolute inset-0 rounded-full opacity-0 transition-all duration-700",
                "bg-gradient-to-tr from-transparent via-white/30 to-transparent",
                "group-hover:opacity-100 group-hover:translate-x-2"
              )} />
              
              {/* Active inner radiance */}
              {isActive && (
                <div className="absolute inset-[16px] rounded-full bg-gradient-radial from-yellow-300/30 via-transparent to-transparent animate-pulse" />
              )}
            </div>
            
            {/* Bottom shadow for depth */}
            <div className={cn(
              "absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-10 rounded-full blur-2xl transition-all duration-500",
              isActive 
                ? "bg-yellow-600/60 shadow-2xl" 
                : "bg-black/40 group-hover:bg-yellow-600/40"
            )} />
          </button>
        );
      })}
    </div>
  );
}
