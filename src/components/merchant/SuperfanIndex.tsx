import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MemberCard } from "./MemberCard";

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

// Fetch superfans sorted by PTP score
async function fetchSuperfans() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, avatar_url, tier, membership_tier, ptp_current, ptp_status, era_current, era_label, total_spend, watch_time, listen_time')
    .order('ptp_current', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export function SuperfanIndex() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const navigate = useNavigate();

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ['superfans-index'],
    queryFn: fetchSuperfans,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const getTierBadge = (tier: string | null) => {
    const tierName = tier?.toLowerCase() || 'free';
    let badgeClass = 'px-4 py-1.5 text-sm font-semibold rounded-full';
    let tierDisplay = tier || 'Free';
    
    if (tierName === 'legionnaire') {
      badgeClass += ' bg-amber-500/90 text-black';
      tierDisplay = 'Legionnaire';
    } else if (tierName === 'outlaw') {
      badgeClass += ' bg-purple-600/90 text-white';
      tierDisplay = 'Outlaw';
    } else if (tierName === 'rebel') {
      badgeClass += ' bg-red-500/80 text-white';
      tierDisplay = 'Rebel';
    } else {
      badgeClass += ' bg-muted text-muted-foreground';
      tierDisplay = 'Free';
    }
    
    return <Badge className={badgeClass}>{tierDisplay}</Badge>;
  };

  const getERABadge = (eraLabel: string | null, eraScore: number | null) => {
    const label = eraLabel?.toLowerCase() || 'discover';
    let badgeClass = 'px-4 py-1.5 text-sm font-semibold rounded-full';
    
    if (label.includes('invest')) {
      badgeClass += ' bg-purple-600/90 text-white';
    } else if (label.includes('engage')) {
      badgeClass += ' bg-blue-600/90 text-white';
    } else if (label.includes('loyal')) {
      badgeClass += ' bg-emerald-600/90 text-white';
    } else {
      badgeClass += ' bg-amber-600/90 text-white';
    }
    
    return <Badge className={badgeClass}>ERA • {eraLabel || 'Discover'}</Badge>;
  };

  const getPTPIndicator = (ptp: number | null) => {
    if (!ptp) return <div className="w-4 h-4 rounded-full bg-gray-500" />;
    if (ptp >= 70) return <div className="w-4 h-4 rounded-full bg-green-500" />;
    if (ptp >= 40) return <div className="w-4 h-4 rounded-full bg-yellow-500" />;
    return <div className="w-4 h-4 rounded-full bg-red-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior Heatmap</CardTitle>
          <CardDescription>Purchase readiness ranked by PTP score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const seedDemoData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data');
      if (error) throw error;
      toast.success("Demo data seeded successfully! Refreshing...");
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error("Failed to seed demo data");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Behavior Heatmap</CardTitle>
            <CardDescription>Purchase readiness ranked by PTP score</CardDescription>
          </div>
          <Button onClick={seedDemoData} variant="outline" disabled={isLoading}>
            Seed Demo Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member, index) => (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-6 flex-1">
                {/* Rank Number */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600/20 text-amber-400 font-bold text-lg flex-shrink-0">
                  {index + 1}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2">{member.display_name}</h3>
                  <div className="flex gap-2">
                    {getTierBadge(member.tier || member.membership_tier)}
                    {getERABadge(member.era_label, member.era_current)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-12 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Watch Time</p>
                  <p className="font-semibold text-lg">
                    {Math.floor(((member.watch_time || 0) + (member.listen_time || 0)) / 60)}h
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Spend</p>
                  <p className="font-semibold text-lg">${(member.total_spend || 0).toFixed(2)}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm text-muted-foreground">PTP</p>
                  {getPTPIndicator(member.ptp_current)}
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

      {/* Member Profile Sheet */}
      <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto pt-12">
          <SheetHeader className="mb-4">
            <SheetTitle>Member Profile</SheetTitle>
          </SheetHeader>
          {selectedMember && (
            <MemberCard 
              member={{
                name: selectedMember.display_name,
                avatar_url: selectedMember.avatar_url,
                tier: selectedMember.tier || selectedMember.membership_tier,
                total_spend: selectedMember.total_spend,
                watch_time_seconds: (selectedMember.watch_time || 0) * 60,
                listen_time_seconds: (selectedMember.listen_time || 0) * 60,
                era_score: selectedMember.era_current,
                ptp_status: selectedMember.ptp_status,
                user_id: selectedMember.id
              }}
              onClose={() => setSelectedMember(null)}
              onViewProfile={() => {
                navigate(`/merchant/community/${selectedMember.id}`);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
