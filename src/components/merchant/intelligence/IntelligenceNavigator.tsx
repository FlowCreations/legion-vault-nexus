import { useState } from 'react';
import { Lightbulb, Eye, Zap, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface IntelligenceNavigatorProps {
  onSelectView: (view: 'epiphany' | 'oracle' | 'catalyst') => void;
  currentView: 'epiphany' | 'oracle' | 'catalyst';
}

export function IntelligenceNavigator({ onSelectView, currentView }: IntelligenceNavigatorProps) {
  const buttons = [
    {
      id: 'epiphany' as const,
      title: 'Epiphany',
      subtitle: 'Reveal Hidden Patterns',
      description: 'Uncover emotional states and community insights you\'re not seeing',
      icon: Lightbulb,
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      hoverGradient: 'from-blue-600 via-cyan-600 to-blue-700',
      glowColor: 'shadow-blue-500/50',
      size: 'medium' as const,
    },
    {
      id: 'oracle' as const,
      title: 'Oracle',
      subtitle: 'Predict the Future',
      description: 'AI-powered predictions of purchase behavior and revenue forecasts',
      icon: Eye,
      gradient: 'from-purple-600 via-pink-600 to-purple-700',
      hoverGradient: 'from-purple-700 via-pink-700 to-purple-800',
      glowColor: 'shadow-purple-500/60',
      size: 'large' as const,
    },
    {
      id: 'catalyst' as const,
      title: 'Catalyst',
      subtitle: 'Deploy & Dominate',
      description: 'Automated campaigns that turn predictions into profits',
      icon: Zap,
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 via-green-600 to-emerald-700',
      glowColor: 'shadow-emerald-500/70',
      size: 'xlarge' as const,
    },
  ];

  const getSizeClasses = (size: string, isActive: boolean) => {
    const base = {
      medium: 'h-32 sm:h-36',
      large: 'h-36 sm:h-40',
      xlarge: 'h-40 sm:h-48',
    }[size];
    
    const scale = isActive ? 'scale-105' : 'scale-100 hover:scale-102';
    
    return `${base} ${scale}`;
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-500 bg-clip-text text-transparent">
          Intelligence Command Center
        </h2>
        <p className="text-muted-foreground">
          Choose your intelligence layer to unlock insights and take action
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buttons.map((button) => {
          const Icon = button.icon;
          const isActive = currentView === button.id;
          
          return (
            <button
              key={button.id}
              onClick={() => onSelectView(button.id)}
              className={cn(
                "relative overflow-hidden rounded-2xl transition-all duration-300 group",
                getSizeClasses(button.size, isActive),
                "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background",
                isActive && `ring-4 ring-offset-2 ${button.glowColor}`
              )}
            >
              {/* Background gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300",
                isActive ? button.hoverGradient : button.gradient,
                "group-hover:" + button.hoverGradient
              )} />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                {/* Icon with sparkle effect */}
                <div className="relative mb-3">
                  <Icon className={cn(
                    "transition-all duration-300",
                    button.size === 'medium' && 'w-10 h-10',
                    button.size === 'large' && 'w-12 h-12',
                    button.size === 'xlarge' && 'w-16 h-16',
                    isActive && 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                  )} />
                  
                  {isActive && (
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
                  )}
                </div>
                
                {/* Title */}
                <h3 className={cn(
                  "font-black uppercase tracking-wider mb-1 transition-all duration-300",
                  button.size === 'medium' && 'text-xl',
                  button.size === 'large' && 'text-2xl',
                  button.size === 'xlarge' && 'text-3xl',
                  isActive && 'text-shadow-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                )}>
                  {button.title}
                </h3>
                
                {/* Subtitle */}
                <p className={cn(
                  "font-semibold mb-2 transition-all duration-300",
                  button.size === 'medium' && 'text-xs',
                  button.size === 'large' && 'text-sm',
                  button.size === 'xlarge' && 'text-base',
                  isActive ? 'text-white/100' : 'text-white/80'
                )}>
                  {button.subtitle}
                </p>
                
                {/* Description - only show on larger sizes */}
                {(button.size === 'large' || button.size === 'xlarge') && (
                  <p className={cn(
                    "text-xs text-white/70 text-center max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    isActive && 'opacity-100'
                  )}>
                    {button.description}
                  </p>
                )}

                {/* Star decorations */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={cn(
                      "w-1 h-1 rounded-full bg-white/60 transition-all duration-300",
                      isActive && "bg-white animate-pulse"
                    )} />
                  ))}
                </div>
              </div>

              {/* Shadow/glow effect */}
              <div className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 blur-xl transition-all duration-300",
                isActive ? `bg-current ${button.glowColor} shadow-2xl` : 'bg-black/20'
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
