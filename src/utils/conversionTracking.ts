import { supabase } from "@/integrations/supabase/client";

interface ConversionTrackingParams {
  userId: string;
  campaignId?: string;
  conversionType: 'free_album_download' | 'song_listen' | 'song_like' | 'full_album_listen';
  conversionValue?: number;
  metadata?: any;
}

export const trackEmailConversion = async ({
  userId,
  campaignId,
  conversionType,
  conversionValue = 0,
  metadata = {}
}: ConversionTrackingParams) => {
  try {
    // Get campaign ID from URL if not provided
    if (!campaignId) {
      const urlParams = new URLSearchParams(window.location.search);
      campaignId = urlParams.get('campaign_id') || undefined;
    }

    if (!campaignId) {
      console.log('No campaign ID found for conversion tracking');
      return;
    }

    // Track the conversion via edge function
    const { data, error } = await supabase.functions.invoke('track-email-conversion', {
      body: {
        userId,
        campaignId,
        conversionType,
        conversionValue,
        actionMetadata: metadata
      }
    });

    if (error) throw error;

    console.log('Conversion tracked successfully:', data);
    return data;
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

// Track when user downloads free album from email link
export const trackFreeAlbumDownload = async (userId: string, albumId: string) => {
  return trackEmailConversion({
    userId,
    conversionType: 'free_album_download',
    metadata: { albumId, source: 'email_campaign' }
  });
};

// Track when user listens to a song from email link
export const trackSongListen = async (userId: string, songId: string, duration: number) => {
  return trackEmailConversion({
    userId,
    conversionType: 'song_listen',
    metadata: { songId, duration, source: 'email_campaign' }
  });
};

// Track when user likes a song from email link
export const trackSongLike = async (userId: string, songId: string) => {
  return trackEmailConversion({
    userId,
    conversionType: 'song_like',
    metadata: { songId, source: 'email_campaign' }
  });
};

// Track when user completes full album listen from email link
export const trackFullAlbumListen = async (userId: string, albumId: string) => {
  return trackEmailConversion({
    userId,
    conversionType: 'full_album_listen',
    metadata: { albumId, source: 'email_campaign' }
  });
};

// Check if current page load is from email campaign
export const isFromEmailCampaign = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('campaign_id') || urlParams.has('utm_source');
};

// Get campaign ID from URL
export const getCampaignIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('campaign_id');
};
