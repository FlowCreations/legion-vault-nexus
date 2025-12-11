import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_COOKIE_NAME = 'sol_affiliate';
const AFFILIATE_COOKIE_DAYS = 30;

// Set affiliate cookie
const setAffiliateCookie = (code: string) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + AFFILIATE_COOKIE_DAYS);
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${code};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  
  // Also store in localStorage as backup
  localStorage.setItem(AFFILIATE_COOKIE_NAME, JSON.stringify({
    code,
    expires: expires.toISOString()
  }));
};

// Get affiliate code from cookie or localStorage
export const getAffiliateCode = (): string | null => {
  // Try cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === AFFILIATE_COOKIE_NAME && value) {
      return value;
    }
  }
  
  // Fall back to localStorage
  const stored = localStorage.getItem(AFFILIATE_COOKIE_NAME);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (new Date(data.expires) > new Date()) {
        return data.code;
      } else {
        localStorage.removeItem(AFFILIATE_COOKIE_NAME);
      }
    } catch {
      localStorage.removeItem(AFFILIATE_COOKIE_NAME);
    }
  }
  
  return null;
};

// Determine link type from pathname
const getLinkType = (pathname: string): 'portal' | 'music' | 'merch' => {
  if (pathname.startsWith('/music') || pathname.startsWith('/album')) {
    return 'music';
  }
  if (pathname.startsWith('/shop') || pathname.startsWith('/merch')) {
    return 'merch';
  }
  return 'portal';
};

// Get JRNY ID if available
const getJrnyId = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'jrny_id' && value) {
      return value;
    }
  }
  return localStorage.getItem('jrny_id');
};

// Get session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('affiliate_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('affiliate_session_id', sessionId);
  }
  return sessionId;
};

export const useAffiliateTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // Store the affiliate code
      setAffiliateCookie(refCode.toUpperCase());

      // Track the click
      const trackClick = async () => {
        try {
          await supabase.functions.invoke('affiliate-track-click', {
            body: {
              affiliate_code: refCode.toUpperCase(),
              link_type: getLinkType(location.pathname),
              visitor_jrny_id: getJrnyId(),
              visitor_session_id: getSessionId(),
              landing_page: location.pathname,
              referrer_url: document.referrer,
              user_agent: navigator.userAgent,
            }
          });
          console.log('Affiliate click tracked for:', refCode);
        } catch (error) {
          console.error('Error tracking affiliate click:', error);
        }
      };

      trackClick();

      // Clean up URL by removing ref param (optional - keeps URL clean)
      // const newUrl = new URL(window.location.href);
      // newUrl.searchParams.delete('ref');
      // window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search, location.pathname]);
};

// Function to attribute a conversion
export const attributeAffiliateConversion = async (
  triggerType: 'signup' | 'digital_purchase' | 'subscription' | 'merch_purchase',
  userId?: string
) => {
  const affiliateCode = getAffiliateCode();
  
  if (!affiliateCode) {
    console.log('No affiliate code found for conversion attribution');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('affiliate-attribute-conversion', {
      body: {
        affiliate_code: affiliateCode,
        trigger_type: triggerType,
        converted_user_id: userId,
        visitor_jrny_id: getJrnyId(),
        visitor_session_id: getSessionId(),
      }
    });

    if (error) throw error;

    console.log('Affiliate conversion attributed:', data);
    return data;
  } catch (error) {
    console.error('Error attributing affiliate conversion:', error);
    return null;
  }
};
