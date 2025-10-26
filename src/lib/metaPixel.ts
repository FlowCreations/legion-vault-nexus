// Meta Pixel (Facebook Pixel) Integration
// Browser-side tracking for Facebook/Instagram ads

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    __META_PIXEL_INITIALIZED__?: boolean;
  }
}

let isInitialized = false;
let pixelId: string | null = null;

/**
 * Initialize Meta Pixel with the given Pixel ID
 */
export const initMetaPixel = (id: string, onReady?: () => void) => {
  // Check window-level flag first (persists across hot reloads)
  if (window.__META_PIXEL_INITIALIZED__ || isInitialized || !id) {
    console.log('[Meta Pixel] Already initialized globally, skipping');
    return;
  }

  // Also check if fbq already exists (from previous load)
  if (window.fbq) {
    console.log('[Meta Pixel] fbq already exists, skipping initialization');
    window.__META_PIXEL_INITIALIZED__ = true;
    isInitialized = true;
    pixelId = id;
    onReady?.();
    return;
  }

  pixelId = id;
  window.__META_PIXEL_INITIALIZED__ = true;
  console.log('[Meta Pixel] Starting initialization with ID:', id);
  
  const injectScript = () => {
    // Inject the Meta Pixel base code
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${id}');
    `;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
    document.body.appendChild(noscript);

    console.log('[Meta Pixel] Script injected, waiting for fbq...');

    // Wait for fbq to be available with retry logic
    let attempts = 0;
    const checkFbq = () => {
      attempts++;
      if (window.fbq) {
        isInitialized = true;
        console.log('[Meta Pixel] Script loaded and ready! (attempt', attempts, ')');
        onReady?.();
      } else if (attempts < 20) {
        setTimeout(checkFbq, 100);
      } else {
        console.error('[Meta Pixel] Failed to load after 20 attempts (2 seconds)');
      }
    };
    
    setTimeout(checkFbq, 100);
  };

  // Check if DOM is ready
  if (document.readyState === 'loading') {
    console.log('[Meta Pixel] Waiting for DOM to load...');
    document.addEventListener('DOMContentLoaded', injectScript);
  } else {
    injectScript();
  }
};

/**
 * Track a standard Meta Pixel event
 */
export const trackMetaEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!isInitialized || !window.fbq) {
    console.warn('[Meta Pixel] Not initialized, skipping event:', eventName);
    return;
  }

  try {
    window.fbq('track', eventName, parameters);
    console.log('[Meta Pixel] Event tracked:', eventName, parameters);
  } catch (error) {
    console.error('[Meta Pixel] Error tracking event:', error);
  }
};

/**
 * Track a custom Meta Pixel event
 */
export const trackCustomMetaEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!isInitialized || !window.fbq) {
    console.warn('[Meta Pixel] Not initialized, skipping custom event:', eventName);
    return;
  }

  try {
    window.fbq('trackCustom', eventName, parameters);
    console.log('[Meta Pixel] Custom event tracked:', eventName, parameters);
  } catch (error) {
    console.error('[Meta Pixel] Error tracking custom event:', error);
  }
};

/**
 * Track page view (automatically called on init, use for SPA route changes)
 */
export const trackPageView = () => {
  trackMetaEvent('PageView');
};

/**
 * Track product/content view
 */
export const trackViewContent = (params: {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  trackMetaEvent('ViewContent', params);
};

/**
 * Track add to cart
 */
export const trackAddToCart = (params: {
  content_name: string;
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
}) => {
  trackMetaEvent('AddToCart', params);
};

/**
 * Track checkout initiation
 */
export const trackInitiateCheckout = (params: {
  content_ids: string[];
  content_category?: string;
  num_items: number;
  value: number;
  currency: string;
}) => {
  trackMetaEvent('InitiateCheckout', params);
};

/**
 * Track purchase
 */
export const trackPurchase = (params: {
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
  num_items?: number;
}) => {
  trackMetaEvent('Purchase', params);
};

/**
 * Track lead generation (email signups, etc.)
 */
export const trackLead = (params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) => {
  trackMetaEvent('Lead', params);
};

/**
 * Track user registration
 */
export const trackCompleteRegistration = (params?: {
  content_name?: string;
  value?: number;
  currency?: string;
  status?: string;
}) => {
  trackMetaEvent('CompleteRegistration', params);
};

/**
 * Track subscription
 */
export const trackSubscribe = (params: {
  value: number;
  currency: string;
  predicted_ltv?: number;
}) => {
  trackMetaEvent('Subscribe', params);
};

/**
 * Track contact form submission
 */
export const trackContact = () => {
  trackMetaEvent('Contact');
};

/**
 * Get pixel status
 */
export const getPixelStatus = () => ({
  isInitialized,
  pixelId,
  isLoaded: !!window.fbq,
});
