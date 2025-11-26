import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Member {
  id: string;
  display_name: string;
  avatar_url: string | null;
  tier: string | null;
  membership_tier: string | null;
  ptp_current: number | null;
  ptp_status: string | null;
  era_current: number | null;
  era_label: string | null;
  total_spend: number;
  watch_time: number | null;
  listen_time: number | null;
}

export function SuperfanIndex() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuperfans();
  }, []);

  const loadSuperfans = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, tier, membership_tier, ptp_current, ptp_status, era_current, era_label, total_spend, watch_time, listen_time')
        .not('ptp_current', 'is', null)
        .order('ptp_current', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading superfans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string | null) => {
    const tierName = tier?.toLowerCase() || 'free';
    if (tierName.includes('legionnaire')) return 'bg-yellow-500 text-black border-yellow-600';
    if (tierName.includes('outlaw')) return 'bg-orange-500 text-white border-orange-600';
    if (tierName.includes('rebel')) return 'bg-blue-500 text-white border-blue-600';
    return 'bg-muted text-muted-foreground border-muted-foreground/20';
  };

  const getPTPColor = (ptp: number | null) => {
    if (!ptp) return 'bg-gray-500/20 text-gray-400';
    if (ptp >= 70) return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (ptp >= 40) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  };

  const getERAColor = (label: string | null) => {
    const eraLabel = label?.toLowerCase() || 'discover';
    if (eraLabel === 'loyal') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (eraLabel === 'invest') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (eraLabel === 'engage') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Heatmap</CardTitle>
        <CardDescription>Purchase readiness ranked by PTP score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member, index) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.display_name}`} />
                  <AvatarFallback>{member.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="font-semibold">{member.display_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={`${getTierColor(member.tier || member.membership_tier)} text-xs`}>
                      {member.tier || member.membership_tier || 'FREE'}
                    </Badge>
                    {member.era_label && (
                      <Badge className={`${getERAColor(member.era_label)} text-xs`}>
                        ERA • {member.era_label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">PTP Score</p>
                  <Badge className={`${getPTPColor(member.ptp_current)} text-lg font-bold`}>
                    {member.ptp_current || 0}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="font-bold">${(member.total_spend || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="font-bold">
                    {Math.floor(((member.watch_time || 0) + (member.listen_time || 0)) / 60)}h
                  </p>
                </div>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No superfans found. Run the PTP calculation to populate scores.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
