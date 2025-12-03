import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const JRNY_COOKIE_NAME = 'jrny_id';
const JRNY_STORAGE_KEY = 'jrny_identity';
const SESSION_STORAGE_KEY = 'jrny_session_id';
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

interface JRNYIdentity {
  jrnyId: string | null;
  sessionId: string;
  isIdentified: boolean;
  heatLevel: string;
  engagementScore: number;
}

// Generate a privacy-conscious device fingerprint
const generateFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Get device information
const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
  }
  
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return {
    deviceType,
    browser,
    os,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
};

// Cookie utilities
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
};

// Get UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
  };
};

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

export const useJRNYIdentity = (tenantSlug?: string) => {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<JRNYIdentity>({
    jrnyId: null,
    sessionId: getSessionId(),
    isIdentified: false,
    heatLevel: 'cold',
    engagementScore: 0,
  });
  const initialized = useRef(false);
  const lastTrackedPage = useRef<string>('');

  // Initialize identity on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    initializeIdentity();
  }, []);

  // Link user when they authenticate
  useEffect(() => {
    if (user && identity.jrnyId) {
      linkUserToIdentity(user.id, user.email);
    }
  }, [user, identity.jrnyId]);

  const initializeIdentity = async () => {
    try {
      // Try to get existing jrny_id from cookie
      let jrnyId = getCookie(JRNY_COOKIE_NAME);
      
      // Fallback to localStorage
      if (!jrnyId) {
        const stored = localStorage.getItem(JRNY_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            jrnyId = parsed.jrnyId;
          } catch (e) {
            // Invalid stored data
          }
        }
      }

      const fingerprint = generateFingerprint();
      const deviceInfo = getDeviceInfo();
      const utmParams = getUTMParams();

      // Call identify endpoint
      const { data, error } = await supabase.functions.invoke('jrny-identify', {
        body: {
          jrny_id: jrnyId,
          fingerprint,
          device_info: deviceInfo,
          page_url: window.location.href,
          referrer: document.referrer,
          utm_params: utmParams,
          tenant_slug: tenantSlug || 'sol', // Default to SØL
        },
      });

      if (error) {
        console.error('[JRNY] Identify error:', error);
        return;
      }

      const finalJrnyId = data.jrny_id;

      // Store the jrny_id
      setCookie(JRNY_COOKIE_NAME, finalJrnyId, COOKIE_MAX_AGE);
      localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
        jrnyId: finalJrnyId,
        fingerprint,
        lastSeen: new Date().toISOString(),
      }));

      setIdentity(prev => ({
        ...prev,
        jrnyId: finalJrnyId,
        isIdentified: data.was_recovered || !data.is_new,
      }));

      console.log('[JRNY] Identity initialized:', { 
        jrnyId: finalJrnyId, 
        wasRecovered: data.was_recovered,
        isNew: data.is_new 
      });

      // Track initial page view
      trackEvent('page_view', { 
        page: window.location.pathname,
        title: document.title 
      });

    } catch (error) {
      console.error('[JRNY] Initialization error:', error);
    }
  };

  const trackEvent = useCallback(async (
    eventType: string,
    eventData?: Record<string, any>
  ) => {
    if (!identity.jrnyId) {
      console.warn('[JRNY] Cannot track event - no jrny_id');
      return;
    }

    // Dedupe page views
    if (eventType === 'page_view') {
      const pageKey = window.location.pathname;
      if (lastTrackedPage.current === pageKey) return;
      lastTrackedPage.current = pageKey;
    }

    try {
      const { data, error } = await supabase.functions.invoke('jrny-track-event', {
        body: {
          jrny_id: identity.jrnyId,
          session_id: identity.sessionId,
          event_type: eventType,
          event_data: eventData,
          page_url: window.location.href,
          tenant_slug: tenantSlug || 'sol',
        },
      });

      if (error) {
        console.error('[JRNY] Track event error:', error);
        return;
      }

      console.log('[JRNY] Event tracked:', { eventType, scoreAdded: data?.score_added });
    } catch (error) {
      console.error('[JRNY] Track event error:', error);
    }
  }, [identity.jrnyId, identity.sessionId, tenantSlug]);

  const revealIdentity = useCallback(async (
    email: string,
    additionalData?: { firstName?: string; lastName?: string; phone?: string; source?: string }
  ) => {
    if (!identity.jrnyId) {
      console.warn('[JRNY] Cannot reveal identity - no jrny_id');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('jrny-reveal-identity', {
        body: {
          jrny_id: identity.jrnyId,
          email,
          first_name: additionalData?.firstName,
          last_name: additionalData?.lastName,
          phone: additionalData?.phone,
          source: additionalData?.source || 'email_capture',
          tenant_slug: tenantSlug || 'sol',
        },
      });

      if (error) {
        console.error('[JRNY] Reveal identity error:', error);
        return null;
      }

      // Update local state if jrny_id changed (merge happened)
      if (data.jrny_id !== identity.jrnyId) {
        setCookie(JRNY_COOKIE_NAME, data.jrny_id, COOKIE_MAX_AGE);
        localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
          jrnyId: data.jrny_id,
          lastSeen: new Date().toISOString(),
        }));
      }

      setIdentity(prev => ({
        ...prev,
        jrnyId: data.jrny_id,
        isIdentified: true,
        heatLevel: data.heat_level || prev.heatLevel,
        engagementScore: data.engagement_score || prev.engagementScore,
      }));

      console.log('[JRNY] Identity revealed:', { 
        jrnyId: data.jrny_id, 
        wasMerged: data.was_merged,
        linkedToUser: data.linked_to_user 
      });

      return data;
    } catch (error) {
      console.error('[JRNY] Reveal identity error:', error);
      return null;
    }
  }, [identity.jrnyId, tenantSlug]);

  const linkUserToIdentity = useCallback(async (userId: string, email?: string | null) => {
    if (!identity.jrnyId) return;

    try {
      const { data, error } = await supabase.functions.invoke('jrny-link-user', {
        body: {
          jrny_id: identity.jrnyId,
          user_id: userId,
          email,
          auth_event: 'login',
        },
      });

      if (error) {
        console.error('[JRNY] Link user error:', error);
        return;
      }

      // Update jrny_id if merge happened
      if (data.jrny_id !== identity.jrnyId) {
        setCookie(JRNY_COOKIE_NAME, data.jrny_id, COOKIE_MAX_AGE);
        localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
          jrnyId: data.jrny_id,
          lastSeen: new Date().toISOString(),
        }));

        setIdentity(prev => ({
          ...prev,
          jrnyId: data.jrny_id,
          isIdentified: true,
        }));
      }

      console.log('[JRNY] User linked:', { jrnyId: data.jrny_id, userId });
    } catch (error) {
      console.error('[JRNY] Link user error:', error);
    }
  }, [identity.jrnyId]);

  return {
    ...identity,
    trackEvent,
    revealIdentity,
    linkUserToIdentity,
  };
};

// Export utility functions
export { generateFingerprint, getDeviceInfo, getCookie, setCookie };
