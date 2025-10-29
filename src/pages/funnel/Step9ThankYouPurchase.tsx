import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { CheckCircle, Download } from 'lucide-react';

export default function Step9ThankYouPurchase() {
  const navigate = useNavigate();
  const { trackConversion } = useFunnelTracking(9);

  useEffect(() => {
    // Track purchase completion
    trackConversion('purchase', 10, 'album_main');
  }, []);

  return (
    <FunnelLayout step={9}>
      <div className="max-w-3xl mx-auto text-center space-y-8 py-12">
        <CheckCircle className="w-24 h-24 mx-auto text-primary" />
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Thank you for supporting real music.
          </h1>
          
          <p className="text-2xl text-muted-foreground">
            Your download link is on its way to your inbox.
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border space-y-6">
          <h2 className="text-2xl font-bold">What's Next?</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex gap-4">
              <Download className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold">Download Your Album</div>
                <div className="text-sm text-muted-foreground">
                  Check your email for the download link
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/funnel/step-10')}
            size="lg"
            className="w-full"
          >
            Set Up Your JRNY Portal
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Join thousands of fans in the JRNY community
        </p>
      </div>
    </FunnelLayout>
  );
}
