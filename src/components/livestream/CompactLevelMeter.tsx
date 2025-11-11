import React from 'react';

interface CompactLevelMeterProps {
  level: number; // 0-100
  label?: string;
}

export const CompactLevelMeter = ({ level, label }: CompactLevelMeterProps) => {
  // Convert level (0-100) to dBFS (-50 to 0)
  const dbLevel = level > 0 ? -50 + (level / 100) * 50 : -Infinity;
  
  // Calculate bar height (0-100%)
  const barHeight = Math.min(100, Math.max(0, level));
  
  // Determine color based on dB level
  const getColor = () => {
    if (dbLevel > -3) return 'bg-red-500'; // Peak/clip warning
    if (dbLevel > -12) return 'bg-yellow-500'; // Hot
    if (dbLevel > -24) return 'bg-green-500'; // Good
    return 'bg-blue-500/50'; // Low
  };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      {/* dB scale markers */}
      <div className="h-[120px] w-12 bg-black/40 rounded relative overflow-hidden border border-white/10">
        {/* Scale markers */}
        <div className="absolute inset-0 flex flex-col justify-between text-[8px] text-white/40 px-1 py-1">
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-24</span>
          <span>-36</span>
          <span>-50</span>
        </div>
        
        {/* Level bars - dual channel style with GPU acceleration */}
        <div 
          className="absolute bottom-0 left-1 w-4 transition-all duration-50" 
          style={{ 
            height: `${barHeight}%`,
            willChange: 'height',
          }}
        >
          <div className={`w-full h-full ${getColor()} rounded-sm`} />
        </div>
        <div 
          className="absolute bottom-0 right-1 w-4 transition-all duration-50" 
          style={{ 
            height: `${barHeight}%`,
            willChange: 'height',
          }}
        >
          <div className={`w-full h-full ${getColor()} rounded-sm`} />
        </div>
      </div>
      
      {/* dB value display */}
      <div className="text-xs font-mono text-blue-400 bg-black/60 px-2 py-0.5 rounded border border-blue-500/30 min-w-[60px] text-center">
        {dbLevel === -Infinity ? '-∞' : `${dbLevel.toFixed(1)}`}
        <span className="text-[9px] text-white/50 ml-1">LUFS</span>
      </div>
      
      {label && (
        <div className="text-[10px] text-white/60 uppercase tracking-wide">
          {label}
        </div>
      )}
    </div>
  );
};
