import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { Music, Users, Gift, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Step10PortalOnboarding() {
  const navigate = useNavigate();
  const { trackConversion } = useFunnelTracking(10);
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      await trackConversion('portal_join', 0);
      toast.success('Portal activated! Welcome to JRNY.');
      navigate('/community');
    } catch (error) {
      console.error('Error activating portal:', error);
      toast.error('Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Music,
      title: 'Full Music Library',
      description: 'Access all albums, singles, and exclusive tracks',
    },
    {
      icon: Users,
      title: 'Community Access',
      description: 'Connect with fans and join exclusive discussions',
    },
    {
      icon: Calendar,
      title: 'Early Show Access',
      description: 'Get first dibs on tour tickets and meet & greets',
    },
    {
      icon: Gift,
      title: 'Rewards Program',
      description: 'Earn points for every listen and unlock prizes',
    },
  ];

  return (
    <FunnelLayout step={10}>
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Welcome to JRNY
          </h1>
          
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            You're not just a fan — you're family. Here's what you unlock:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div 
              key={benefit.title}
              className="bg-card p-8 rounded-lg border hover:border-primary transition-colors"
            >
              <benefit.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 rounded-lg border space-y-6">
          <h2 className="text-3xl font-bold text-center">
            Ready to dive in?
          </h2>
          
          <Button 
            onClick={handleActivate}
            size="lg"
            className="w-full h-14 text-xl"
            disabled={loading}
          >
            {loading ? 'Activating...' : 'Activate My Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Takes less than 30 seconds. No credit card required.
          </p>
        </div>
      </div>
    </FunnelLayout>
  );
}
