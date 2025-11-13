import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_LIMIT_GB = 100;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

export function useStorageQuota() {
  return useQuery({
    queryKey: ['storage-quota'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: assets, error } = await supabase
        .from('email_assets')
        .select('file_size')
        .eq('user_id', user.id);

      if (error) throw error;

      const usedBytes = assets?.reduce((sum, asset) => sum + (asset.file_size || 0), 0) || 0;
      const usedGB = usedBytes / (1024 * 1024 * 1024);
      const percentUsed = (usedBytes / STORAGE_LIMIT_BYTES) * 100;

      return {
        usedBytes,
        usedGB: Number(usedGB.toFixed(2)),
        totalGB: STORAGE_LIMIT_GB,
        percentUsed: Number(percentUsed.toFixed(1)),
        remainingGB: Number((STORAGE_LIMIT_GB - usedGB).toFixed(2)),
      };
    },
  });
}
