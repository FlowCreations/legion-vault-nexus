import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedData, setCachedData } from '@/utils/cacheHelper';

interface VenueDetails {
  ticketmaster_venue_id: string | null;
  venue_image_url: string | null;
  venue_address: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  venue_seatmap_url: string | null;
  venue_url: string | null;
  venue_info: Record<string, unknown> | null;
}

interface TicketmasterVenue {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  seatmapUrl: string | null;
  generalInfo: Record<string, unknown>;
}

interface UseVenueDetailsResult {
  venueDetails: VenueDetails | null;
  loading: boolean;
  error: string | null;
  searchVenues: (venueName: string, city?: string, stateCode?: string) => Promise<TicketmasterVenue[]>;
  selectVenue: (venue: TicketmasterVenue, showId: string) => Promise<void>;
  refetch: () => void;
}

export function useVenueDetails(showId: string | null): UseVenueDetailsResult {
  const [venueDetails, setVenueDetails] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenueDetails = useCallback(async () => {
    if (!showId) {
      setVenueDetails(null);
      return;
    }

    // Check cache first
    const cacheKey = `venue_details_${showId}`;
    const cached = getCachedData<VenueDetails>(cacheKey, 30 * 60 * 1000); // 30 min cache
    if (cached) {
      setVenueDetails(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tour_shows')
        .select('ticketmaster_venue_id, venue_image_url, venue_address, venue_lat, venue_lng, venue_seatmap_url, venue_url, venue_info')
        .eq('id', showId)
        .single();

      if (queryError) throw queryError;

      const details: VenueDetails = {
        ticketmaster_venue_id: data?.ticketmaster_venue_id ?? null,
        venue_image_url: data?.venue_image_url ?? null,
        venue_address: data?.venue_address ?? null,
        venue_lat: data?.venue_lat ?? null,
        venue_lng: data?.venue_lng ?? null,
        venue_seatmap_url: data?.venue_seatmap_url ?? null,
        venue_url: data?.venue_url ?? null,
        venue_info: (data?.venue_info && typeof data.venue_info === 'object' && !Array.isArray(data.venue_info)) 
          ? data.venue_info as Record<string, unknown>
          : null,
      };

      setVenueDetails(details);
      setCachedData(cacheKey, details);
    } catch (err: any) {
      console.error('[useVenueDetails] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    fetchVenueDetails();
  }, [fetchVenueDetails]);

  const searchVenues = async (
    venueName: string,
    city?: string,
    stateCode?: string
  ): Promise<TicketmasterVenue[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-ticketmaster-venue', {
        body: { venue: venueName, city, stateCode },
      });

      if (error) throw error;

      return data?.venues || [];
    } catch (err: any) {
      console.error('[useVenueDetails] Search error:', err);
      throw err;
    }
  };

  const selectVenue = async (venue: TicketmasterVenue, targetShowId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('tour_shows')
        .update({
          ticketmaster_venue_id: venue.id,
          venue_image_url: venue.imageUrl,
          venue_address: venue.address,
          venue_lat: venue.latitude,
          venue_lng: venue.longitude,
          venue_seatmap_url: venue.seatmapUrl,
          venue_url: venue.url,
          venue_info: venue.generalInfo as unknown as Record<string, never>,
        })
        .eq('id', targetShowId);

      if (updateError) throw updateError;

      // Clear cache and refetch
      const cacheKey = `venue_details_${targetShowId}`;
      sessionStorage.removeItem(`analytics_cache_${cacheKey}`);
      
      if (targetShowId === showId) {
        await fetchVenueDetails();
      }
    } catch (err: any) {
      console.error('[useVenueDetails] Select venue error:', err);
      throw err;
    }
  };

  return {
    venueDetails,
    loading,
    error,
    searchVenues,
    selectVenue,
    refetch: fetchVenueDetails,
  };
}
