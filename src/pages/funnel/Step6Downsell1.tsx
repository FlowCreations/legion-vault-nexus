import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';

export default function Step6Downsell1() {
  const navigate = useNavigate();
  const { sessionId, trackConversion } = useFunnelTracking(6);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('funnel_email') || '';
      
      const { data } = await supabase.functions.invoke('process-funnel-purchase', {
        body: {
          sessionId,
          email,
          productId: 'price_album_8',
          amount: 8,
          step: 6,
        },
      });

      if (data?.url) {
        await trackConversion('downsell_1', 8, 'price_album_8');
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error processing downsell:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FunnelLayout step={6}>
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <Heart className="w-16 h-16 mx-auto text-primary" />

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            We dropped the price for you
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Same album, same story — just a little love back your way.
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground line-through">Was $10</div>
            <div className="text-6xl font-bold text-primary">$8</div>
            <div className="text-sm text-muted-foreground">Today only — expires in 2 hours</div>
          </div>

          <Button 
            onClick={handleAccept}
            size="lg"
            className="w-full h-14 text-xl"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Get it for $8'}
          </Button>

          <Button 
            onClick={() => navigate('/funnel/step-7')}
            variant="ghost"
          >
            No thanks
          </Button>
        </div>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We'd rather you have the music than miss out over two bucks.
          This is our way of saying thanks for considering.
        </p>
      </div>
    </FunnelLayout>
  );
}
