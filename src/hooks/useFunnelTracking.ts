import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackMetaEvent } from '@/lib/metaPixel';

export const useFunnelTracking = (step: number) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [variant, setVariant] = useState<'A' | 'B' | 'C'>('A');
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, [step]);

  const initializeSession = async () => {
    try {
      // Get or create session ID
      let currentSessionId = localStorage.getItem('funnel_session_id');
      
      if (!currentSessionId) {
        currentSessionId = crypto.randomUUID();
        localStorage.setItem('funnel_session_id', currentSessionId);

        // Create new session in database
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('funnel_sessions').insert({
          session_id: currentSessionId,
          user_id: user?.id,
          entry_step: step,
          current_step: step,
        });
      }

      setSessionId(currentSessionId);

      // Get variant assignment
      const { data } = await supabase.functions.invoke('assign-funnel-variant', {
        body: { sessionId: currentSessionId, step },
      });

      if (data) {
        setVariant(data.variant);
        setPageData(data.pageData);
      }

      // Track page view
      await trackFunnelEvent('page_view', {});
      setLoading(false);
    } catch (error) {
      console.error('Error initializing funnel session:', error);
      setLoading(false);
    }
  };

  const trackFunnelEvent = async (eventType: string, meta: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.functions.invoke('track-funnel-event', {
        body: {
          sessionId,
          userId: user?.id,
          step,
          eventType,
          variant,
          meta,
        },
      });

      // Track Meta Pixel events
      if (eventType === 'lead') {
        trackMetaEvent('Lead', { step, variant });
      } else if (eventType === 'checkout') {
        trackMetaEvent('InitiateCheckout', { step, variant, value: meta.amount });
      } else if (eventType === 'purchase') {
        trackMetaEvent('Purchase', { 
          value: meta.amount, 
          currency: 'USD',
          content_ids: [meta.productId] 
        });
      }
    } catch (error) {
      console.error('Error tracking funnel event:', error);
    }
  };

  const trackConversion = async (conversionType: string, amount: number, productId?: string) => {
    await trackFunnelEvent('conversion', {
      conversionType,
      amount,
      productId,
    });
  };

  return {
    sessionId,
    variant,
    pageData,
    loading,
    trackFunnelEvent,
    trackConversion,
  };
};
