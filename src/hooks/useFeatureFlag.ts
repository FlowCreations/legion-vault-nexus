import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFeatureFlag = (flagName: string) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlag();

    // Subscribe to changes
    const channel = supabase
      .channel(`feature-flag-${flagName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
          filter: `flag_name=eq.${flagName}`
        },
        (payload) => {
          if (payload.new && 'enabled' in payload.new) {
            setEnabled(payload.new.enabled as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flagName]);

  const fetchFlag = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('flag_name', flagName)
        .single();

      if (!error && data) {
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching feature flag:', error);
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading };
};
