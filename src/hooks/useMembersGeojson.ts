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
    tier: string;
    joined_at: string;
    profile_url: string;
    watch_time?: number;
    listen_time?: number;
    livestream_engagement_score?: number;
    livestream_reaction_count?: number;
    community_engagement_score?: number;
    login_streak?: number;
    total_sessions?: number;
    last_active_at?: string;
    total_spend?: number;
    mrr?: number;
    era_label?: string;
    ptp_status?: boolean;
    is_super_fan?: boolean;
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
      console.log('🔍 useMembersGeojson: Fetching GeoJSON...');
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('members-geojson');
      
      console.log('📦 useMembersGeojson response:', { data, error });
      
      if (error) throw error;
      
      console.log('✅ useMembersGeojson: Got', data?.features?.length || 0, 'features');
      if (data?.features?.length > 0) {
        console.log('📍 First feature:', data.features[0]);
      }
      
      setGeojson(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching members GeoJSON:', err);
      setError(err instanceof Error ? err.message : 'Failed to load member locations');
    } finally {
      setLoading(false);
    }
  };

  // Optimized: Update specific features instead of full refetch
  const updateFeature = (payload: any) => {
    if (!geojson) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setGeojson((prev) => {
      if (!prev) return prev;

      let updatedFeatures = [...prev.features];

      if (eventType === 'DELETE' && oldRecord) {
        // Remove deleted user
        updatedFeatures = updatedFeatures.filter(
          (f) => f.properties.user_id !== oldRecord.user_id
        );
      } else if (eventType === 'INSERT' && newRecord?.latitude && newRecord?.longitude) {
        // Add new user with coordinates
        const newFeature: MemberFeature = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [newRecord.longitude, newRecord.latitude],
          },
          properties: {
            user_id: newRecord.user_id,
            name: newRecord.display_name || 'Community Member',
            avatar_url: newRecord.avatar_url || '',
            location: newRecord.location || '',
            tier: newRecord.tier || 'free',
            joined_at: newRecord.created_at,
            profile_url: `/community/${newRecord.user_id}`,
          },
        };
        updatedFeatures.push(newFeature);
      } else if (eventType === 'UPDATE' && newRecord) {
        // Update existing user
        const index = updatedFeatures.findIndex(
          (f) => f.properties.user_id === newRecord.user_id
        );

        if (index !== -1 && newRecord.latitude && newRecord.longitude) {
          updatedFeatures[index] = {
            ...updatedFeatures[index],
            geometry: {
              type: 'Point',
              coordinates: [newRecord.longitude, newRecord.latitude],
            },
            properties: {
              ...updatedFeatures[index].properties,
              name: newRecord.display_name || updatedFeatures[index].properties.name,
              avatar_url: newRecord.avatar_url || updatedFeatures[index].properties.avatar_url,
              location: newRecord.location || updatedFeatures[index].properties.location,
            tier: newRecord.tier || updatedFeatures[index].properties.tier,
            watch_time: newRecord.watch_time ?? updatedFeatures[index].properties.watch_time,
            listen_time: newRecord.listen_time ?? updatedFeatures[index].properties.listen_time,
            livestream_engagement_score: newRecord.livestream_engagement_score ?? updatedFeatures[index].properties.livestream_engagement_score,
            community_engagement_score: newRecord.community_engagement_score ?? updatedFeatures[index].properties.community_engagement_score,
            total_spend: newRecord.total_spend ?? updatedFeatures[index].properties.total_spend,
            mrr: newRecord.mrr ?? updatedFeatures[index].properties.mrr,
          },
        };
        } else if (index !== -1 && (!newRecord.latitude || !newRecord.longitude)) {
          // Remove if coordinates were removed
          updatedFeatures.splice(index, 1);
        }
      }

      return {
        type: 'FeatureCollection',
        features: updatedFeatures,
      };
    });
  };

  useEffect(() => {
    fetchGeojson();

    // Optimized real-time subscription - batch updates over 2 seconds
    let updateTimeout: NodeJS.Timeout;
    const pendingUpdates: any[] = [];

    const processBatchUpdates = () => {
      if (pendingUpdates.length > 0) {
        console.log(`Processing ${pendingUpdates.length} batched updates`);
        pendingUpdates.forEach(updateFeature);
        pendingUpdates.length = 0;
      }
    };

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
          // Batch updates to avoid excessive re-renders
          pendingUpdates.push(payload);
          
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(processBatchUpdates, 2000); // Reduced from 5s to 2s
        }
      )
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      processBatchUpdates(); // Process any pending updates
      supabase.removeChannel(channel);
    };
  }, []);

  return { geojson, loading, error, refetch: fetchGeojson };
};