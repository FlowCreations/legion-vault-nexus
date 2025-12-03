import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';
import { useJRNY } from '@/providers/JRNYProvider';
import { toast } from 'sonner';

export default function Step1LeadCapture() {
  const navigate = useNavigate();
  const { pageData, trackConversion } = useFunnelTracking(1);
  const { revealIdentity } = useJRNY();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Reveal JRNY identity with email
      await revealIdentity(email, { source: 'funnel_step1' });
      
      // Track lead conversion
      await trackConversion('lead', 0);
      
      // Store email for later
      localStorage.setItem('funnel_email', email);
      
      toast.success('You\'re in! Check your inbox.');
      navigate('/funnel/step-2');
    } catch (error) {
      console.error('Error capturing lead:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FunnelLayout step={1}>
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            {pageData?.headline || 'Hey there, we don\'t take it lightly that you showed up here.'}
          </h1>
          
          {pageData?.subheadline && (
            <p className="text-xl md:text-2xl text-muted-foreground">
              {pageData.subheadline}
            </p>
          )}
          
          {pageData?.body_copy && (
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {pageData.body_copy}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 text-lg"
          />
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-12 text-lg"
            disabled={loading}
          >
            {loading ? 'Processing...' : (pageData?.cta_text || 'Get My Free Album')}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          No spam. Just real music. Unsubscribe anytime.
        </p>
      </div>
    </FunnelLayout>
  );
}
