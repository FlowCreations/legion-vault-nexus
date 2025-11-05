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
            era: newRecord.era || 0,
            era_label: newRecord.era_label || '',
            ptp: newRecord.ptp || 0,
            ptp_status: newRecord.ptp_status || '',
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
              era: newRecord.era || updatedFeatures[index].properties.era,
              ptp: newRecord.ptp || updatedFeatures[index].properties.ptp,
              tier: newRecord.tier || updatedFeatures[index].properties.tier,
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

    // Debounced real-time subscription - batch updates over 5 seconds
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
          updateTimeout = setTimeout(processBatchUpdates, 5000);
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