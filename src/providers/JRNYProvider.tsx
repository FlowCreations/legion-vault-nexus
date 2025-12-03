import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const JRNY_COOKIE_NAME = 'jrny_id';
const JRNY_STORAGE_KEY = 'jrny_identity';
const SESSION_STORAGE_KEY = 'jrny_session_id';
const COOKIE_MAX_AGE = 31536000; // 1 year

interface JRNYContextType {
  jrnyId: string | null;
  sessionId: string;
  trackEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
  revealIdentity: (email: string, additionalData?: { firstName?: string; lastName?: string; phone?: string; source?: string }) => Promise<any>;
}

const JRNYContext = createContext<JRNYContextType | null>(null);

// Cookie utilities
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
};

// Generate fingerprint
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
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Get device info
const getDeviceInfo = () => {
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

// Get UTM params
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

// Get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

// Store for jrnyId that persists across renders
let globalJrnyId: string | null = null;
let globalSessionId: string = '';

export function JRNYProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initialized = useRef(false);
  const lastTrackedPage = useRef<string>('');

  // Initialize on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    globalSessionId = getSessionId();
    initializeIdentity();
  }, []);

  // Link user when authenticated
  useEffect(() => {
    if (user && globalJrnyId) {
      linkUserToIdentity(user.id, user.email);
    }
  }, [user]);

  const initializeIdentity = async () => {
    try {
      // Try cookie first, then localStorage
      let jrnyId = getCookie(JRNY_COOKIE_NAME);
      if (!jrnyId) {
        const stored = localStorage.getItem(JRNY_STORAGE_KEY);
        if (stored) {
          try {
            jrnyId = JSON.parse(stored).jrnyId;
          } catch (e) {}
        }
      }

      const fingerprint = generateFingerprint();
      const deviceInfo = getDeviceInfo();
      const utmParams = getUTMParams();

      const { data, error } = await supabase.functions.invoke('jrny-identify', {
        body: {
          jrny_id: jrnyId,
          fingerprint,
          device_info: deviceInfo,
          page_url: window.location.href,
          referrer: document.referrer,
          utm_params: utmParams,
          tenant_slug: 'sol',
        },
      });

      if (error) {
        console.error('[JRNY] Identify error:', error);
        return;
      }

      globalJrnyId = data.jrny_id;

      // Persist
      setCookie(JRNY_COOKIE_NAME, data.jrny_id, COOKIE_MAX_AGE);
      localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
        jrnyId: data.jrny_id,
        fingerprint,
        lastSeen: new Date().toISOString(),
      }));

      console.log('[JRNY] Identity initialized:', { 
        jrnyId: data.jrny_id, 
        wasRecovered: data.was_recovered,
        isNew: data.is_new 
      });

      // Track initial page view
      await trackEventInternal('page_view', { 
        page: window.location.pathname,
        title: document.title 
      });

    } catch (error) {
      console.error('[JRNY] Initialization error:', error);
    }
  };

  const trackEventInternal = async (eventType: string, eventData?: Record<string, any>) => {
    if (!globalJrnyId) {
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
          jrny_id: globalJrnyId,
          session_id: globalSessionId,
          event_type: eventType,
          event_data: eventData,
          page_url: window.location.href,
          tenant_slug: 'sol',
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
  };

  const revealIdentityInternal = async (
    email: string,
    additionalData?: { firstName?: string; lastName?: string; phone?: string; source?: string }
  ) => {
    if (!globalJrnyId) {
      console.warn('[JRNY] Cannot reveal identity - no jrny_id');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('jrny-reveal-identity', {
        body: {
          jrny_id: globalJrnyId,
          email,
          first_name: additionalData?.firstName,
          last_name: additionalData?.lastName,
          phone: additionalData?.phone,
          source: additionalData?.source || 'email_capture',
          tenant_slug: 'sol',
        },
      });

      if (error) {
        console.error('[JRNY] Reveal identity error:', error);
        return null;
      }

      // Update if jrny_id changed (merge)
      if (data.jrny_id !== globalJrnyId) {
        globalJrnyId = data.jrny_id;
        setCookie(JRNY_COOKIE_NAME, data.jrny_id, COOKIE_MAX_AGE);
        localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
          jrnyId: data.jrny_id,
          lastSeen: new Date().toISOString(),
        }));
      }

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
  };

  const linkUserToIdentity = async (userId: string, email?: string | null) => {
    if (!globalJrnyId) return;

    try {
      const { data, error } = await supabase.functions.invoke('jrny-link-user', {
        body: {
          jrny_id: globalJrnyId,
          user_id: userId,
          email,
          auth_event: 'login',
        },
      });

      if (error) {
        console.error('[JRNY] Link user error:', error);
        return;
      }

      // Update if merge happened
      if (data.jrny_id !== globalJrnyId) {
        globalJrnyId = data.jrny_id;
        setCookie(JRNY_COOKIE_NAME, data.jrny_id, COOKIE_MAX_AGE);
        localStorage.setItem(JRNY_STORAGE_KEY, JSON.stringify({
          jrnyId: data.jrny_id,
          lastSeen: new Date().toISOString(),
        }));
      }

      console.log('[JRNY] User linked:', { jrnyId: data.jrny_id, userId });
    } catch (error) {
      console.error('[JRNY] Link user error:', error);
    }
  };

  const contextValue: JRNYContextType = {
    jrnyId: globalJrnyId,
    sessionId: globalSessionId,
    trackEvent: trackEventInternal,
    revealIdentity: revealIdentityInternal,
  };

  return (
    <JRNYContext.Provider value={contextValue}>
      {children}
    </JRNYContext.Provider>
  );
}

export function useJRNY() {
  const context = useContext(JRNYContext);
  if (!context) {
    throw new Error('useJRNY must be used within <JRNYProvider>');
  }
  return context;
}

// Export for direct access when context isn't available
export function getJRNYId() {
  return globalJrnyId;
}

export function getJRNYSessionId() {
  return globalSessionId;
}
