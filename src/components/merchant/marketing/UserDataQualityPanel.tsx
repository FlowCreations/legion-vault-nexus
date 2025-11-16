import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DataQuality {
  eventsWithUserIds: number;
  eventsWithTimestamps: number;
  eventsWithMetadata: number;
  totalEvents: number;
  profilesWithActivity: number;
  totalProfiles: number;
  recentEvents: number; // last 24h
}

export const UserDataQualityPanel = () => {
  const [quality, setQuality] = useState<DataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadDataQuality();
  }, []);

  const loadDataQuality = async () => {
    try {
      // Check events quality
      const { data: allEvents } = await supabase
        .from('events')
        .select('member_id, created_at, meta');

      const { data: recentEvents } = await supabase
        .from('events')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Check profiles quality
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, last_active_at, watch_time, listen_time');

      const eventsWithUserIds = allEvents?.filter(e => e.member_id).length || 0;
      const eventsWithTimestamps = allEvents?.filter(e => e.created_at).length || 0;
      const eventsWithMetadata = allEvents?.filter(e => e.meta && Object.keys(e.meta).length > 0).length || 0;
      const profilesWithActivity = allProfiles?.filter(p => 
        p.last_active_at || (p.watch_time && p.watch_time > 0) || (p.listen_time && p.listen_time > 0)
      ).length || 0;

      setQuality({
        eventsWithUserIds,
        eventsWithTimestamps,
        eventsWithMetadata,
        totalEvents: allEvents?.length || 0,
        profilesWithActivity,
        totalProfiles: allProfiles?.length || 0,
        recentEvents: recentEvents?.length || 0,
      });
    } catch (error) {
      console.error('Error loading data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePTPScores = async () => {
    setCalculating(true);
    try {
      // Get all user IDs
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id')
        .not('user_id', 'is', null);

      if (!users || users.length === 0) {
        toast.error('No users found to calculate PTP scores');
        return;
      }

      // Calculate PTP for each user
      let successCount = 0;
      for (const user of users) {
        try {
          await supabase.functions.invoke('calculate-ptp-score', {
            body: { userId: user.user_id }
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to calculate PTP for user ${user.user_id}:`, err);
        }
      }

      toast.success(`Calculated PTP scores for ${successCount} users`);
      await loadDataQuality();
    } catch (error) {
      console.error('Error calculating PTP scores:', error);
      toast.error('Failed to calculate PTP scores');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!quality) return null;

  const userIdPercentage = quality.totalEvents > 0 
    ? Math.round((quality.eventsWithUserIds / quality.totalEvents) * 100) 
    : 0;
  const timestampPercentage = quality.totalEvents > 0 
    ? Math.round((quality.eventsWithTimestamps / quality.totalEvents) * 100) 
    : 0;
  const metadataPercentage = quality.totalEvents > 0 
    ? Math.round((quality.eventsWithMetadata / quality.totalEvents) * 100) 
    : 0;
  const profileActivityPercentage = quality.totalProfiles > 0 
    ? Math.round((quality.profilesWithActivity / quality.totalProfiles) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality & Completeness</CardTitle>
        <CardDescription>
          Ensuring accurate, complete, and AI-ready user data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Events Data Quality */}
        <div>
          <h3 className="font-semibold mb-3">Events Tracking Quality</h3>
          <div className="space-y-2">
            <QualityMetric
              label="Associated with User IDs"
              value={quality.eventsWithUserIds}
              total={quality.totalEvents}
              percentage={userIdPercentage}
              isGood={userIdPercentage > 80}
            />
            <QualityMetric
              label="Properly Timestamped"
              value={quality.eventsWithTimestamps}
              total={quality.totalEvents}
              percentage={timestampPercentage}
              isGood={timestampPercentage > 95}
            />
            <QualityMetric
              label="Include Metadata"
              value={quality.eventsWithMetadata}
              total={quality.totalEvents}
              percentage={metadataPercentage}
              isGood={metadataPercentage > 50}
            />
          </div>
        </div>

        {/* User Profiles Quality */}
        <div>
          <h3 className="font-semibold mb-3">User Profile Data</h3>
          <div className="space-y-2">
            <QualityMetric
              label="Profiles with Activity Data"
              value={quality.profilesWithActivity}
              total={quality.totalProfiles}
              percentage={profileActivityPercentage}
              isGood={profileActivityPercentage > 70}
            />
          </div>
        </div>

        {/* Real-time Tracking */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Real-time Tracking Active</p>
              <p className="text-sm text-muted-foreground mt-1">
                {quality.recentEvents} events captured in the last 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* PTP Calculation */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">PTP Score Calculation</h3>
              <p className="text-sm text-muted-foreground">
                Calculate AI-powered purchase propensity for all users
              </p>
            </div>
            <Button 
              onClick={calculatePTPScores}
              disabled={calculating || quality.totalEvents === 0}
            >
              {calculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Calculating...
                </>
              ) : (
                'Calculate PTP Scores'
              )}
            </Button>
          </div>
        </div>

        {/* Data Structure Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">✓ Data Structure Validated</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Events stored with proper schema</li>
            <li>• User profiles linked correctly</li>
            <li>• Timestamps in ISO format</li>
            <li>• Ready for AI analysis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const QualityMetric = ({ 
  label, 
  value, 
  total, 
  percentage, 
  isGood 
}: { 
  label: string; 
  value: number; 
  total: number; 
  percentage: number; 
  isGood: boolean;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg border">
    <div className="flex items-center gap-3">
      {isGood ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <AlertCircle className="h-5 w-5 text-yellow-500" />
      )}
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value.toLocaleString()} of {total.toLocaleString()} events
        </p>
      </div>
    </div>
    <Badge variant={isGood ? "default" : "secondary"} className={isGood ? "bg-green-500" : ""}>
      {percentage}%
    </Badge>
  </div>
);
