import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { RefreshCw } from 'lucide-react';

export const HeartbeatToggle = () => {
  const { toast } = useToast();
  const { enabled, loading } = useFeatureFlag('enable_heartbeat_integration');
  const [updating, setUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: checked })
        .eq('flag_name', 'enable_heartbeat_integration');

      if (error) throw error;

      toast({
        title: checked ? 'Heartbeat Enabled' : 'Heartbeat Disabled',
        description: checked 
          ? 'Community data integration is now active'
          : 'Community data integration has been paused',
      });
    } catch (error) {
      console.error('Error toggling heartbeat:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Heartbeat integration',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex-1">
        <Label htmlFor="heartbeat-toggle" className="text-base font-medium">
          Heartbeat Integration
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          {enabled 
            ? 'Community data is being synced and displayed on the globe'
            : 'Disable to improve performance and reduce loading times'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {updating && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch
          id="heartbeat-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading || updating}
        />
      </div>
    </div>
  );
};
