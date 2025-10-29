import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function Step2ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/funnel/step-3');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <FunnelLayout step={2}>
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <CheckCircle className="w-20 h-20 mx-auto text-primary" />
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            You're in.
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Check your inbox — your free album is on the way.
          </p>
          
          <p className="text-lg text-foreground">
            Thanks for believing in real artists. You're part of something real.
          </p>
        </div>

        <div className="pt-8">
          <Button 
            onClick={() => navigate('/funnel/step-3')}
            size="lg"
          >
            Continue to Next Step
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Redirecting automatically in 5 seconds...
        </p>
      </div>
    </FunnelLayout>
  );
}
