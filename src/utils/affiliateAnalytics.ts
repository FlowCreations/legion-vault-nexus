import { supabase } from "@/integrations/supabase/client";

export const trackAffiliateContentClick = async (
  contentId: string,
  contentUrl: string
) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get or create session ID
    const sessionId = sessionStorage.getItem('analytics_session_id') || 
                     crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
    
    // Track click using database function
    const { error } = await supabase.rpc('track_affiliate_content_click', {
      p_content_id: contentId,
      p_user_id: user?.id || null,
      p_session_id: sessionId,
      p_referrer: document.referrer,
      p_user_agent: navigator.userAgent
    });
    
    if (error) {
      console.error('Error tracking click:', error);
    }
    
    // Open the content URL
    window.open(contentUrl, '_blank');
  } catch (error) {
    console.error('Error tracking click:', error);
    // Still open the URL even if tracking fails
    window.open(contentUrl, '_blank');
  }
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const detectMusicPlatform = (url: string): string => {
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('music.apple.com')) return 'Apple Music';
  if (url.includes('youtube.com/music')) return 'YouTube Music';
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  return 'External Link';
};
