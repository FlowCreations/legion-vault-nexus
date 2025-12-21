import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface JourneyStageCardProps {
  userId: string;
  compact?: boolean;
}

const STAGE_ORDER = ['awareness', 'engagement', 'conversion', 'advocacy'];

const STAGE_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  awareness: { label: 'Aware', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '👁️' },
  engagement: { label: 'Engaged', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '💜' },
  conversion: { label: 'Buyer', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '💳' },
  advocacy: { label: 'Advocate', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '⭐' },
};

const MILESTONE_TO_STAGE: Record<string, string> = {
  'first_portal_visit': 'awareness',
  'form_started': 'awareness',
  'email_verified': 'awareness',
  'first_video_start': 'engagement',
  'first_video_complete': 'engagement',
  'first_song_start': 'engagement',
  'first_song_finish': 'engagement',
  'first_replay': 'engagement',
  'first_save': 'engagement',
  'first_download': 'engagement',
  'first_store_visit': 'conversion',
  'first_add_to_cart': 'conversion',
  'first_purchase': 'conversion',
  'repeat_buyer': 'conversion',
  'super_fan': 'advocacy',
  'first_referral': 'advocacy',
  'affiliate_activated': 'advocacy',
};

export function JourneyStageCard({ userId, compact = false }: JourneyStageCardProps) {
  const [milestoneKeys, setMilestoneKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [userId]);

  const loadMilestones = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('fan_journey_milestones')
        .select('milestone_key')
        .eq('user_id', userId);

      if (error) throw error;
      setMilestoneKeys((data || []).map(m => m.milestone_key));
    } catch (error) {
      console.error('Error loading journey stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const { currentStage, hasDropOff, hasDeepening } = useMemo(() => {
    let highestStage = 'awareness';
    let hasDropOff = false;
    let hasDeepening = false;

    // Determine highest stage
    for (const key of milestoneKeys) {
      const stage = MILESTONE_TO_STAGE[key];
      if (stage && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(highestStage)) {
        highestStage = stage;
      }
    }

    // Check for drop-offs
    const hasKey = (k: string) => milestoneKeys.includes(k);
    if ((hasKey('first_video_start') && !hasKey('first_video_complete')) ||
        (hasKey('first_song_start') && !hasKey('first_song_finish')) ||
        (hasKey('first_add_to_cart') && !hasKey('first_purchase')) ||
        (hasKey('form_started') && !hasKey('email_verified'))) {
      hasDropOff = true;
    }

    // Check for deepening signals
    if (hasKey('first_replay') || hasKey('first_save') || hasKey('first_download') || hasKey('repeat_buyer')) {
      hasDeepening = true;
    }

    return { currentStage: highestStage, hasDropOff, hasDeepening };
  }, [milestoneKeys]);

  if (loading || milestoneKeys.length === 0) {
    return null;
  }

  const config = STAGE_CONFIG[currentStage];

  if (compact) {
    return (
      <Badge className={`${config.className} gap-1`}>
        {config.icon} {config.label}
        {hasDropOff && <AlertTriangle className="w-3 h-3 text-amber-400" />}
        {hasDeepening && <TrendingUp className="w-3 h-3 text-emerald-400" />}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.className} gap-1`}>
        {config.icon} {config.label}
      </Badge>
      {hasDropOff && (
        <Badge variant="outline" className="text-amber-400 border-amber-500/30 gap-1">
          <AlertTriangle className="w-3 h-3" /> Drop-off
        </Badge>
      )}
      {hasDeepening && (
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1">
          <TrendingUp className="w-3 h-3" /> Deepening
        </Badge>
      )}
    </div>
  );
}
