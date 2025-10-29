import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle } from 'lucide-react';

export default function Step5Upsell() {
  const navigate = useNavigate();
  const { sessionId, trackConversion } = useFunnelTracking(5);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('funnel_email') || '';
      
      const { data } = await supabase.functions.invoke('process-funnel-purchase', {
        body: {
          sessionId,
          email,
          productId: 'price_live_album_1499',
          amount: 14.99,
          step: 5,
        },
      });

      if (data?.url) {
        await trackConversion('upsell', 14.99, 'price_live_album_1499');
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error processing upsell:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    navigate('/funnel/step-6');
  };

  return (
    <FunnelLayout step={5}>
      <div className="max-w-3xl mx-auto text-center space-y-8 py-12">
        <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">One-Time Offer</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-foreground">
          Since you grabbed the album...
        </h1>
        
        <p className="text-2xl text-muted-foreground">
          Unlock the exclusive live recording — normally $19.99, yours for $14.
        </p>

        <div className="bg-card p-8 rounded-lg border space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <span>400 voices singing back every word</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <span>Full 18-track performance</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <span>Unreleased acoustic versions</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground line-through">
              Regular Price: $19.99
            </div>
            <div className="text-5xl font-bold text-primary">$14</div>
            <div className="text-sm text-muted-foreground">
              Save $6 — This offer expires soon
            </div>
          </div>

          <div className="grid gap-3">
            <Button 
              onClick={handleAccept}
              size="lg"
              className="h-14"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Add to Order — $14'}
            </Button>
            
            <Button 
              onClick={handleDecline}
              variant="ghost"
              size="lg"
            >
              No thanks, continue
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          You won't see this offer again after leaving this page
        </p>
      </div>
    </FunnelLayout>
  );
}
