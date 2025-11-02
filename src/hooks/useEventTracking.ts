import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import * as MetaPixel from '@/lib/metaPixel';

const SESSION_KEY = 'sol_session_id';

// Helper function to detect emotional context from event patterns
const detectEmotionalContext = (eventType: string, eventData?: any): string => {
  // Music engagement
  if (eventType.includes('track_') || eventType.includes('song_') || eventType.includes('stream')) {
    return 'connected_through_music';
  }
  
  // Product interest
  if (eventType.includes('product_view') || eventType.includes('add_to_cart') || eventType.includes('merch')) {
    return 'exploring_offerings';
  }
  
  // Community engagement
  if (eventType.includes('post_') || eventType.includes('comment_') || eventType.includes('community')) {
    return 'community_engaged';
  }
  
  // High engagement indicators
  if (eventType.includes('purchase') || eventType.includes('subscribe')) {
    return 'committed_and_invested';
  }
  
  return 'present_and_browsing';
};

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
      
      // Detect emotional metadata based on event patterns
      const emotionalContext = detectEmotionalContext(eventType, eventData);
      
      // Track in our backend via edge function
      await supabase.functions.invoke('track-event', {
        body: {
          eventType,
          eventData: {
            ...eventData,
            emotional_context: emotionalContext,
          },
          pageUrl: window.location.pathname,
          sessionId,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      // Track to Meta Pixel if configured
      trackToMetaPixel(eventType, eventData);
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  };

  const trackToMetaPixel = (eventType: string, eventData?: any) => {
    const status = MetaPixel.getPixelStatus();
    if (!status.isInitialized) return;

    // Map internal events to Meta Pixel standard events
    switch (eventType) {
      case 'page_view':
        MetaPixel.trackPageView();
        break;
      
      case 'view_product':
      case 'view_merch':
      case 'view_album':
      case 'view_video':
        MetaPixel.trackViewContent({
          content_name: eventData?.name || eventData?.title || 'Unknown',
          content_category: eventData?.category || eventType,
          content_ids: eventData?.id ? [eventData.id] : [],
          content_type: 'product',
          value: eventData?.price,
          currency: 'USD',
        });
        break;
      
      case 'add_to_cart':
        MetaPixel.trackAddToCart({
          content_name: eventData?.name || 'Product',
          content_ids: [eventData?.id || ''],
          content_type: 'product',
          value: eventData?.price || 0,
          currency: 'USD',
        });
        break;
      
      case 'initiate_checkout':
        MetaPixel.trackInitiateCheckout({
          content_ids: eventData?.items?.map((i: any) => i.id) || [],
          num_items: eventData?.items?.length || 1,
          value: eventData?.total || 0,
          currency: 'USD',
        });
        break;
      
      case 'purchase':
        MetaPixel.trackPurchase({
          content_ids: eventData?.items?.map((i: any) => i.id) || [],
          content_type: 'product',
          value: eventData?.total || 0,
          currency: 'USD',
          num_items: eventData?.items?.length || 1,
        });
        break;
      
      case 'email_signup':
      case 'lead':
        MetaPixel.trackLead({
          content_name: eventData?.source || 'Email List',
          content_category: 'subscription',
        });
        break;
      
      case 'user_registration':
      case 'signup':
        MetaPixel.trackCompleteRegistration({
          content_name: 'User Registration',
          status: 'completed',
        });
        break;
      
      case 'subscribe':
      case 'subscription_purchase':
        MetaPixel.trackSubscribe({
          value: eventData?.price || 0,
          currency: 'USD',
          predicted_ltv: eventData?.ltv,
        });
        break;
      
      case 'contact':
      case 'contact_form':
        MetaPixel.trackContact();
        break;
      
      // Custom events
      case 'stream_song':
      case 'play_music':
        MetaPixel.trackCustomMetaEvent('StreamSong', {
          song_title: eventData?.title,
          artist: eventData?.artist,
        });
        break;
      
      case 'view_gallery':
        MetaPixel.trackCustomMetaEvent('ViewGallery', eventData);
        break;
      
      case 'book_cameo':
        MetaPixel.trackCustomMetaEvent('BookCameo', eventData);
        break;
      
      case 'join_community':
        MetaPixel.trackCustomMetaEvent('JoinCommunity', eventData);
        break;
    }
  };

  useEffect(() => {
    // Track page view on mount
    trackEvent('page_view', {
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });
  }, []);

  return { trackEvent };
};
