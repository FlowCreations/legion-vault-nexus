import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Music, Star, Users } from 'lucide-react';

export default function Step3SalesPage() {
  const navigate = useNavigate();
  const { pageData, sessionId } = useFunnelTracking(3);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('funnel_email') || '';
      
      const { data } = await supabase.functions.invoke('process-funnel-purchase', {
        body: {
          sessionId,
          email,
          productId: pageData?.product_id || 'price_album_10',
          amount: pageData?.price || 10,
          step: 3,
        },
      });

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FunnelLayout step={3}>
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            {pageData?.headline || 'This album wasn\'t made in a boardroom.'}
          </h1>
          
          {pageData?.subheadline && (
            <p className="text-2xl text-muted-foreground">
              {pageData.subheadline}
            </p>
          )}
        </div>

        {/* Social Proof */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border text-center space-y-2">
            <Users className="w-10 h-10 mx-auto text-primary" />
            <div className="text-3xl font-bold">4M+</div>
            <div className="text-sm text-muted-foreground">Listeners Worldwide</div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border text-center space-y-2">
            <Star className="w-10 h-10 mx-auto text-primary" />
            <div className="text-3xl font-bold">4.9/5</div>
            <div className="text-sm text-muted-foreground">Fan Rating</div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border text-center space-y-2">
            <Music className="w-10 h-10 mx-auto text-primary" />
            <div className="text-3xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Original Tracks</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-card/50 backdrop-blur p-8 rounded-lg border space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-foreground">
              ${pageData?.price || 10}
            </div>
            <p className="text-muted-foreground">One-time payment. Yours forever.</p>
          </div>

          <Button 
            onClick={handlePurchase}
            size="lg" 
            className="w-full h-14 text-xl"
            disabled={loading}
          >
            {loading ? 'Processing...' : (pageData?.cta_text || 'Get The Full Album — $10')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Instant download. No recurring charges.
          </p>
        </div>

        {/* Testimonial */}
        <div className="bg-secondary/20 p-6 rounded-lg border-l-4 border-primary">
          <p className="text-lg italic text-foreground mb-2">
            "Makes you feel like you've lived ten lives."
          </p>
          <p className="text-sm text-muted-foreground">— Verified Fan</p>
        </div>
      </div>
    </FunnelLayout>
  );
}
