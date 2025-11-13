import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import epiphanySymbol from '@/assets/epiphany-symbol.png';
import oracleSymbol from '@/assets/oracle-symbol.png';
import catalystSymbol from '@/assets/catalyst-symbol.png';
import { GenerateSymbolsButton } from './GenerateSymbolsButton';

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
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Intelligence Command Center
          </h2>
          <GenerateSymbolsButton />
        </div>
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
              {/* Background gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300",
                isActive ? button.hoverGradient : button.gradient,
                "group-hover:" + button.hoverGradient
              )} />
              
              {/* Glossy shine effect - top arc */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" 
                   style={{ clipPath: 'ellipse(100% 35% at 50% 0%)' }} />
              
              {/* Side shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-white">
                {/* Image or Loading */}
                <div className="relative">
                  {isLoading ? (
                    <Loader2 className="w-20 h-20 animate-spin" />
                  ) : (
                    <>
                      <img 
                        src={button.image} 
                        alt={button.id}
                        className={cn(
                          "w-24 h-24 object-contain transition-all duration-300",
                          isActive && 'drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]'
                        )}
                      />
                      
                      {isActive && (
                        <Sparkles className="absolute -top-3 -right-3 w-7 h-7 text-yellow-300 animate-pulse" />
                      )}
                    </>
                  )}
                </div>
                
                {/* Star decorations */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-1.5 rounded-full bg-white/60 transition-all duration-300",
                      isActive && "bg-white animate-pulse"
                    )} />
                  ))}
                </div>

                {/* Bottom star decorations */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-1.5 rounded-full bg-white/60 transition-all duration-300",
                      isActive && "bg-white animate-pulse"
                    )} />
                  ))}
                </div>
              </div>

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
