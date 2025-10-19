import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemberFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    user_id: string;
    name: string;
    avatar_url: string;
    location: string;
    era: number;
    era_label: string;
    ptp: number;
    ptp_status: string;
    tier: string;
    joined_at: string;
    profile_url: string;
  };
}

export interface MembersGeoJSON {
  type: 'FeatureCollection';
  features: MemberFeature[];
}

export const useMembersGeojson = () => {
  const [geojson, setGeojson] = useState<MembersGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeojson = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('members-geojson');
      
      if (error) throw error;
      
      setGeojson(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching members GeoJSON:', err);
      setError(err instanceof Error ? err.message : 'Failed to load member locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeojson();

    // Subscribe to real-time updates on user_profiles
    const channel = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          console.log('User profile changed:', payload);
          // Refetch geojson when any profile changes
          fetchGeojson();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { geojson, loading, error, refetch: fetchGeojson };
};