import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Loader2, ChevronLeft, ChevronRight, Clock, Heart, TrendingUp, Calendar, Trophy, Route, ShoppingCart, Share2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PTPBehaviorBreakdown } from "./PTPBehaviorBreakdown";
import { JourneyStageCard } from "./JourneyStageCard";
import { FanJourneyTimeline } from "./FanJourneyTimeline";
import { ContentEngagementPanel } from "./ContentEngagementPanel";
import { CommerceJourneyPanel } from "./CommerceJourneyPanel";
interface MilestoneData {
  current_badge: string | null;
  total_minutes: number;
}

interface CommunityMember {
  id: string;
  user_id: string | null;
  heartbeat_member_id: string | null;
  display_name: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tier: string | null;
  membership_tier: string | null;
  created_at: string;
  last_active_at: string | null;
  total_spend: number;
  era_current: number | null;
  ptp_current: number | null;
  era_label: string | null;
  ptp_status: string | null;
  watch_time: number | null;
  listen_time: number | null;
  livestream_engagement_score: number | null;
  login_streak: number | null;
  inactive_days: number | null;
  is_super_fan: boolean | null;
  milestone?: MilestoneData;
}

interface CommunityMembersProps {
  selectedUserId?: string | null;
}

export function CommunityMembers({ selectedUserId }: CommunityMembersProps) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [milestoneMap, setMilestoneMap] = useState<Map<string, MilestoneData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const { toast } = useToast();
  
  const ITEMS_PER_PAGE = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadMembers();
  }, [currentPage, debouncedSearch, tierFilter, milestoneFilter]);

  // Scroll to selected user if provided
  useEffect(() => {
    if (selectedUserId && members.length > 0) {
      setTimeout(() => {
        const memberRow = document.querySelector(`[data-user-id="${selectedUserId}"]`);
        if (memberRow) {
          memberRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [selectedUserId, members]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      // Load milestone data first
      const { data: milestoneData } = await supabase
        .from('milestone_progress')
        .select('user_id, current_badge, total_minutes');

      const milestones = new Map<string, MilestoneData>();
      milestoneData?.forEach(m => {
        milestones.set(m.user_id, {
          current_badge: m.current_badge,
          total_minutes: m.total_minutes || 0,
        });
      });
      setMilestoneMap(milestones);

      // Build query with filters and pagination
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(
          `display_name.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`
        );
      }

      // Apply tier filter
      if (tierFilter !== "all") {
        query = query.or(
          `membership_tier.ilike.%${tierFilter}%,tier.ilike.%${tierFilter}%`
        );
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Enrich members with milestone data
      let enrichedMembers = (data || []).map(member => ({
        ...member,
        milestone: member.user_id ? milestones.get(member.user_id) : undefined,
      }));

      // Apply milestone filter client-side (since it's from a different table)
      if (milestoneFilter !== "all") {
        const userIdsWithBadge = Array.from(milestones.entries())
          .filter(([_, m]) => m.current_badge === milestoneFilter)
          .map(([userId, _]) => userId);
        enrichedMembers = enrichedMembers.filter(m => m.user_id && userIdsWithBadge.includes(m.user_id));
      }

      setMembers(enrichedMembers);
      setTotalCount(milestoneFilter !== "all" ? enrichedMembers.length : (count || 0));
    } catch (error) {
      console.error('Error loading members:', error);
      toast({ title: "Error loading members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string | null) => {
    const tierName = tier || "FREE";
    const colors: Record<string, string> = {
      "Legionnaires": "bg-yellow-500 text-black border-yellow-600",
      "Outlaws": "bg-orange-500 text-white border-orange-600",
      "Rebels": "bg-blue-500 text-white border-blue-600",
      "FREE": "bg-muted text-muted-foreground border-muted-foreground/20",
    };

    return (
      <Badge className={`${colors[tierName] || colors.FREE} font-semibold`}>
        {tierName}
      </Badge>
    );
  };

  const getMilestoneBadge = (milestone: MilestoneData | undefined) => {
    if (!milestone || !milestone.current_badge) return null;
    
    const badgeConfig: Record<string, { icon: string; label: string; className: string }> = {
      silver_star: { icon: "⭐", label: "Silver Star", className: "bg-slate-400/20 text-slate-300 border border-slate-400/30" },
      gold_star: { icon: "🌟", label: "Gold Star", className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
      dunbar_champion: { icon: "🏅", label: "Champion", className: "bg-amber-600/20 text-amber-400 border border-amber-600/30" },
    };

    const config = badgeConfig[milestone.current_badge];
    if (!config) return null;

    const hours = Math.round(milestone.total_minutes / 60);
    return (
      <Badge className={config.className}>
        {config.icon} {config.label} • {hours}h
      </Badge>
    );
  };

  const getPTPBadge = (ptpStatus: string | null, ptpScore: number | null) => {
    const colors: Record<string, string> = {
      'green': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'yellow': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'red': 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    
    const status = ptpStatus?.toLowerCase() || 'red';
    return (
      <Badge className={colors[status] || colors.red}>
        {ptpScore !== null ? `${ptpScore}` : 'N/A'}
      </Badge>
    );
  };

  const getERABadge = (eraLabel: string | null) => {
    const colors: Record<string, string> = {
      'discover': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'engage': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      'invest': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'loyal': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    };
    
    const label = eraLabel?.toLowerCase() || 'discover';
    return (
      <Badge className={colors[label] || colors.discover}>
        {eraLabel || 'Discover'}
      </Badge>
    );
  };

  const getStatusBadge = (lastActive: string | null) => {
    if (!lastActive) return <Badge variant="outline">Never Active</Badge>;
    
    const lastActiveDate = new Date(lastActive);
    const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) {
      return <Badge className="bg-green-500 text-white">Active Now</Badge>;
    } else if (hoursSinceActive < 24) {
      return <Badge className="bg-green-500/70 text-white">Active Today</Badge>;
    } else if (hoursSinceActive < 168) {
      return <Badge variant="outline">Active This Week</Badge>;
    } else {
      return <Badge variant="outline">Inactive</Badge>;
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Directory
              </CardTitle>
              <CardDescription>
                Showing {members.length > 0 ? startItem : 0}-{endItem} of {totalCount} members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Legionnaires">Legionnaires</SelectItem>
                <SelectItem value="Outlaws">Outlaws</SelectItem>
                <SelectItem value="Rebels">Rebels</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
              </SelectContent>
            </Select>
            <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                <SelectItem value="silver_star">⭐ Silver Star</SelectItem>
                <SelectItem value="gold_star">🌟 Gold Star</SelectItem>
                <SelectItem value="dunbar_champion">🏅 Dunbar Champion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Directory Cards */}
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No members found
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  data-user-id={member.user_id}
                  className={`border rounded-lg p-4 hover:bg-accent/50 transition-colors ${
                    member.user_id === selectedUserId ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {member.display_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{member.display_name || "Anonymous"}</h3>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMember(member)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMember(member)}
                          >
                            View Pattern
                          </Button>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {getTierBadge(member.membership_tier || member.tier)}
                        {getMilestoneBadge(member.milestone)}
                        {member.user_id && <JourneyStageCard userId={member.user_id} compact />}
                        {member.era_label && (
                          <Badge className={`${
                            member.era_label.toLowerCase() === 'engaged' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            member.era_label.toLowerCase() === 'loyal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            member.era_label.toLowerCase() === 'invest' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            ERA {member.era_current || 0} • {member.era_label}
                          </Badge>
                        )}
                        {member.ptp_status && (
                          <Badge className={`${
                            member.ptp_status.toLowerCase() === 'hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            member.ptp_status.toLowerCase() === 'warm' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            PTP {member.ptp_current || 0}
                          </Badge>
                        )}
                        {member.is_super_fan && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            ⭐ Super Fan
                          </Badge>
                        )}
                      </div>

                      {/* Details Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium truncate">{member.location || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Watch Time</p>
                          <p className="font-medium">{Math.floor((member.watch_time || 0) / 60)}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Spend</p>
                          <p className="font-medium">${member.total_spend?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Joined</p>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Bio/Notes if available */}
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedMember && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={selectedMember.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {selectedMember.display_name?.charAt(0) || selectedMember.email?.charAt(0) || '?'}
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
                          {getERABadge(selectedMember.era_label)}
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
                          {getPTPBadge(selectedMember.ptp_status, selectedMember.ptp_current)}
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
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        {getStatusBadge(selectedMember.last_active_at)}
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
    </div>
  );
}
