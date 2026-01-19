import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Heart, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FanJourneyTimeline } from "./FanJourneyTimeline";
import { ContentEngagementPanel } from "./ContentEngagementPanel";
import { CommerceJourneyPanel } from "./CommerceJourneyPanel";

interface Member {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
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
  location: string | null;
  is_super_fan: boolean | null;
  livestream_engagement_score: number | null;
  login_streak: number | null;
  inactive_days: number | null;
  created_at: string;
  last_active_at: string | null;
}

// Fetch superfans sorted by PTP score
async function fetchSuperfans() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, display_name, email, avatar_url, tier, membership_tier, ptp_current, ptp_status, era_current, era_label, total_spend, watch_time, listen_time, location, is_super_fan, livestream_engagement_score, login_streak, inactive_days, created_at, last_active_at')
    .order('ptp_current', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export function SuperfanIndex() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMember(member);
                  }}
                >
                  View Profile
                </Button>
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
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedMember && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={selectedMember.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {selectedMember.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-xl">{selectedMember.display_name || 'Anonymous'}</div>
                    <div className="text-sm text-muted-foreground">{selectedMember.email}</div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="journey">Journey</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="commerce">Commerce</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">ERA Score</p>
                            <p className="text-2xl font-bold">{selectedMember.era_current || 0}</p>
                          </div>
                          {getERABadge(selectedMember.era_label, selectedMember.era_current)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">PTP Score</p>
                            <p className="text-2xl font-bold">{selectedMember.ptp_current || 0}</p>
                          </div>
                          <Badge className={`${
                            selectedMember.ptp_status?.toLowerCase() === 'hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            selectedMember.ptp_status?.toLowerCase() === 'warm' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {selectedMember.ptp_status || 'Cold'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Member Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Member Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tier</span>
                        {getTierBadge(selectedMember.membership_tier || selectedMember.tier)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span>{selectedMember.location || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Super Fan</span>
                        <Badge variant={selectedMember.is_super_fan ? "default" : "secondary"}>
                          {selectedMember.is_super_fan ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Spend</span>
                        <span className="font-semibold">${selectedMember.total_spend?.toFixed(2) || '0.00'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Engagement Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Watch Time</p>
                          <p className="font-semibold">{Math.floor((selectedMember.watch_time || 0) / 60)} hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Listen Time</p>
                          <p className="font-semibold">{Math.floor((selectedMember.listen_time || 0) / 60)} hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Livestream Engagement</p>
                          <p className="font-semibold">{selectedMember.livestream_engagement_score || 0} points</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Login Streak</p>
                          <p className="font-semibold">{selectedMember.login_streak || 0} days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Inactive Days</p>
                          <p className="font-semibold">{selectedMember.inactive_days || 0} days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span>{format(new Date(selectedMember.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Active</span>
                        <span>{selectedMember.last_active_at ? format(new Date(selectedMember.last_active_at), 'MMM d, yyyy h:mm a') : 'Never'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="journey" className="mt-6">
                  <FanJourneyTimeline userId={selectedMember.user_id || selectedMember.id} />
                </TabsContent>

                <TabsContent value="content" className="mt-6">
                  <ContentEngagementPanel userId={selectedMember.user_id || selectedMember.id} />
                </TabsContent>

                <TabsContent value="commerce" className="mt-6">
                  <CommerceJourneyPanel userId={selectedMember.user_id || selectedMember.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
