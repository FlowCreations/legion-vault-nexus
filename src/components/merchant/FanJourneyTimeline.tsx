import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JourneyMilestone {
  id: string;
  milestone_key: string;
  achieved_at: string;
  metadata: any;
}

interface FanJourneyTimelineProps {
  userId: string;
}

// Journey stages in order
const JOURNEY_STAGES = [
  { key: 'first_portal_visit', label: 'First Visit', stage: 'awareness', icon: '👁️' },
  { key: 'form_started', label: 'Started Form', stage: 'awareness', icon: '📝' },
  { key: 'email_verified', label: 'Email Verified', stage: 'awareness', icon: '✅' },
  { key: 'first_video_start', label: 'Started Video', stage: 'engagement', icon: '▶️' },
  { key: 'first_video_complete', label: 'Completed Video', stage: 'engagement', icon: '🎬' },
  { key: 'first_song_start', label: 'Started Song', stage: 'engagement', icon: '🎵' },
  { key: 'first_song_finish', label: 'Finished Song', stage: 'engagement', icon: '🎶' },
  { key: 'first_replay', label: 'Replayed Content', stage: 'engagement', icon: '🔁' },
  { key: 'first_save', label: 'Saved Content', stage: 'engagement', icon: '💾' },
  { key: 'first_download', label: 'Downloaded Content', stage: 'engagement', icon: '⬇️' },
  { key: 'first_store_visit', label: 'Visited Store', stage: 'conversion', icon: '🏪' },
  { key: 'first_add_to_cart', label: 'Added to Cart', stage: 'conversion', icon: '🛒' },
  { key: 'first_purchase', label: 'First Purchase', stage: 'conversion', icon: '💳' },
  { key: 'repeat_buyer', label: 'Repeat Buyer', stage: 'conversion', icon: '🔄' },
  { key: 'super_fan', label: 'Super Fan', stage: 'advocacy', icon: '⭐' },
  { key: 'first_referral', label: 'First Referral', stage: 'advocacy', icon: '📤' },
  { key: 'affiliate_activated', label: 'Affiliate', stage: 'advocacy', icon: '🤝' },
];

const STAGE_COLORS: Record<string, string> = {
  awareness: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  engagement: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  conversion: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advocacy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

// Validate UUID format to prevent database errors
const isValidUUID = (str: string) => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function FanJourneyTimeline({ userId }: FanJourneyTimelineProps) {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [userId]);

  const loadMilestones = async () => {
    if (!userId || !isValidUUID(userId)) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fan_journey_milestones')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error loading journey milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatus = (key: string) => {
    return milestones.find(m => m.milestone_key === key);
  };

  const getCurrentStage = () => {
    // Find the highest stage the user has reached
    for (let i = JOURNEY_STAGES.length - 1; i >= 0; i--) {
      if (getMilestoneStatus(JOURNEY_STAGES[i].key)) {
        return JOURNEY_STAGES[i].stage;
      }
    }
    return 'awareness';
  };

  const getDropOffs = () => {
    // Find milestones where user started but didn't complete the next step
    const dropOffs: string[] = [];
    
    if (getMilestoneStatus('first_video_start') && !getMilestoneStatus('first_video_complete')) {
      dropOffs.push('Started video but didn\'t finish');
    }
    if (getMilestoneStatus('first_song_start') && !getMilestoneStatus('first_song_finish')) {
      dropOffs.push('Started song but didn\'t finish');
    }
    if (getMilestoneStatus('form_started') && !getMilestoneStatus('email_verified')) {
      dropOffs.push('Started form but didn\'t verify');
    }
    if (getMilestoneStatus('first_add_to_cart') && !getMilestoneStatus('first_purchase')) {
      dropOffs.push('Added to cart but didn\'t buy');
    }
    if (getMilestoneStatus('first_store_visit') && !getMilestoneStatus('first_add_to_cart')) {
      dropOffs.push('Visited store but didn\'t add to cart');
    }
    
    return dropOffs;
  };

  const getDeepeningSignals = () => {
    const signals: string[] = [];
    
    if (getMilestoneStatus('first_replay')) signals.push('🔁 Replays content');
    if (getMilestoneStatus('first_save')) signals.push('💾 Saves favorites');
    if (getMilestoneStatus('first_download')) signals.push('⬇️ Downloads content');
    if (getMilestoneStatus('repeat_buyer')) signals.push('🔄 Repeat purchases');
    if (getMilestoneStatus('super_fan')) signals.push('⭐ Super fan status');
    
    return signals;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentStage = getCurrentStage();
  const dropOffs = getDropOffs();
  const deepeningSignals = getDeepeningSignals();

  return (
    <div className="space-y-6">
      {/* Current Stage Badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current Stage:</span>
        <Badge className={`${STAGE_COLORS[currentStage]} capitalize text-sm px-3 py-1`}>
          {currentStage}
        </Badge>
        <span className="text-sm text-muted-foreground">
          ({milestones.length} milestones achieved)
        </span>
      </div>

      {/* Drop-off Warnings */}
      {dropOffs.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              Drop-off Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {dropOffs.map((dropOff, i) => (
                <li key={i} className="text-sm text-amber-300/80">• {dropOff}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Deepening Signals */}
      {deepeningSignals.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Deepening Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {deepeningSignals.map((signal, i) => (
                <Badge key={i} variant="outline" className="text-emerald-300/80">
                  {signal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Journey Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {JOURNEY_STAGES.map((stage, index) => {
              const achieved = getMilestoneStatus(stage.key);
              const isLast = index === JOURNEY_STAGES.length - 1;
              
              return (
                <div key={stage.key} className="flex items-start gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${achieved 
                        ? STAGE_COLORS[stage.stage] 
                        : 'bg-muted/30 text-muted-foreground/50'
                      }`}>
                      {achieved ? stage.icon : <Circle className="w-3 h-3" />}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-6 ${achieved ? 'bg-primary/30' : 'bg-muted/20'}`} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${achieved ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {stage.label}
                      </span>
                      {achieved && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(achieved.achieved_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
