import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'sol_session_id';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const useEventTracking = () => {
  const trackEvent = async (eventType: string, eventData?: any) => {
    try {
      const sessionId = getSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.functions.invoke('track-event', {
        body: {
          eventType,
          eventData,
          pageUrl: window.location.pathname,
          sessionId,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  };

  useEffect(() => {
    // Track page view on mount
    trackEvent('page_view', {
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Track page exit
    return () => {
      trackEvent('page_exit');
    };
  }, []);

  return { trackEvent };
};
