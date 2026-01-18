import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, ChevronLeft, ChevronRight, Clock, Heart, TrendingUp, Calendar, Trophy, Route, ShoppingCart, Share2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PTPBehaviorBreakdown } from "./PTPBehaviorBreakdown";
import { FanJourneyTimeline } from "./FanJourneyTimeline";
import { ContentEngagementPanel } from "./ContentEngagementPanel";
import { CommerceJourneyPanel } from "./CommerceJourneyPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommunityMembers, CommunityMember, MilestoneData } from "@/hooks/useCommunityMembers";

interface CommunityMembersProps {
  selectedUserId?: string | null;
}

export function CommunityMembers({ selectedUserId }: CommunityMembersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  
  const ITEMS_PER_PAGE = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use optimized React Query hook
  const {
    members,
    totalCount,
    totalPages,
    isLoading,
    isFetching
  } = useCommunityMembers({
    page: currentPage,
    search: debouncedSearch,
    tierFilter,
    milestoneFilter,
    pageSize: ITEMS_PER_PAGE
  });

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
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const getTierBadge = (tier: string | null) => {
    const tierName = tier || "Free";
    const colors: Record<string, string> = {
      "Legionnaire": "bg-amber-500 text-black border-amber-600",
      "Outlaw": "bg-purple-500 text-white border-purple-600",
      "Rebel": "bg-red-500 text-white border-red-600",
      "Free": "bg-muted text-muted-foreground border-muted-foreground/20",
    };

    return (
      <Badge className={`${colors[tierName] || colors.Free} font-semibold`}>
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

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Member Directory
          </CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                <SelectItem value="Legionnaire">Legionnaire</SelectItem>
                <SelectItem value="Outlaw">Outlaw</SelectItem>
                <SelectItem value="Rebel">Rebel</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
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
                  disabled={currentPage === 1 || isFetching}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isFetching}
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
