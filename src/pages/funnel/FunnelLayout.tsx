import { ReactNode, useEffect } from 'react';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { Loader2 } from 'lucide-react';

interface FunnelLayoutProps {
  children: ReactNode;
  step: number;
}

export default function FunnelLayout({ children, step }: FunnelLayoutProps) {
  const { loading, trackFunnelEvent, variant, pageData } = useFunnelTracking(step);

  useEffect(() => {
    // Track time on page
    const startTime = Date.now();
    
    return () => {
      const timeOnPage = (Date.now() - startTime) / 1000;
      trackFunnelEvent('time_on_page', { seconds: timeOnPage });
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="absolute top-0 left-0 right-0 h-1 bg-secondary">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 12) * 100}%` }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>

      {/* Hidden data attributes for variant tracking */}
      <div 
        data-funnel-step={step} 
        data-funnel-variant={variant}
        data-page-data={JSON.stringify(pageData)}
        style={{ display: 'none' }}
      />
    </div>
  );
}
