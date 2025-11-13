import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import epiphanySymbol from '@/assets/epiphany-symbol.png';
import oracleSymbol from '@/assets/oracle-symbol.png';
import catalystSymbol from '@/assets/catalyst-symbol.png';

interface IntelligenceNavigatorProps {
  onSelectView?: (view: 'epiphany' | 'oracle' | 'catalyst') => void;
  currentView?: 'epiphany' | 'oracle' | 'catalyst';
}

export function IntelligenceNavigator({ onSelectView, currentView }: IntelligenceNavigatorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const handleButtonClick = async (buttonId: 'epiphany' | 'oracle' | 'catalyst') => {
    setLoading(buttonId);
    try {
      let functionName = '';
      let successMessage = '';
      
      if (buttonId === 'epiphany') {
        functionName = 'generate-epiphany-insight';
        successMessage = 'Epiphany revealed';
      } else if (buttonId === 'oracle') {
        functionName = 'generate-oracle-insight';
        successMessage = 'Oracle insight generated';
      } else if (buttonId === 'catalyst') {
        functionName = 'catalyst-deploy';
        successMessage = 'Catalyst deployed';
      }
      
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      toast.success(successMessage);
      if (onSelectView) onSelectView(buttonId);
    } catch (error: any) {
      console.error(`Error triggering ${buttonId}:`, error);
      toast.error(error.message || `Failed to trigger ${buttonId}`);
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    {
      id: 'epiphany' as const,
      image: epiphanySymbol,
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      hoverGradient: 'from-blue-600 via-cyan-600 to-blue-700',
      glowColor: 'shadow-blue-500/50',
    },
    {
      id: 'oracle' as const,
      image: oracleSymbol,
      gradient: 'from-purple-600 via-pink-600 to-purple-700',
      hoverGradient: 'from-purple-700 via-pink-700 to-purple-800',
      glowColor: 'shadow-purple-500/60',
    },
    {
      id: 'catalyst' as const,
      image: catalystSymbol,
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 via-green-600 to-emerald-700',
      glowColor: 'shadow-emerald-500/70',
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent mb-2">
          Intelligence Command Center
        </h2>
        <p className="text-muted-foreground">
          Choose your intelligence layer to unlock insights and take action
        </p>
      </div>

      <div className="flex items-center justify-center gap-8">
        {buttons.map((button) => {
          const isActive = currentView === button.id;
          const isLoading = loading === button.id;
          
          return (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.id)}
              disabled={loading !== null}
              className={cn(
                "relative w-48 h-48 rounded-full overflow-hidden transition-all duration-300 group",
                "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background",
                isActive && `ring-4 ring-offset-2 ${button.glowColor} scale-105`,
                !isActive && "hover:scale-102",
                loading !== null && loading !== button.id && "opacity-50"
              )}
            >
              {/* Symbol Image - Full Fill */}
              <img 
                src={button.image} 
                alt={button.id}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Glossy shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-50" 
                   style={{ clipPath: 'ellipse(100% 35% at 50% 0%)' }} />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-20 h-20 text-white animate-spin" />
                </div>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <Sparkles className="absolute top-4 right-4 w-8 h-8 text-yellow-300 animate-pulse drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
              )}

              {/* Bottom shadow/glow effect */}
              <div className={cn(
                "absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl transition-all duration-300",
                isActive ? `bg-current ${button.glowColor} shadow-2xl opacity-80` : 'bg-black/30 opacity-50'
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
