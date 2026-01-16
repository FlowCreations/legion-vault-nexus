import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Users, DollarSign, Video, FileText, TrendingUp, Eye, Award, MapPin, Clock, ShoppingBag, BarChart, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ERABadge } from "@/components/merchant/ERABadge";
import { PTPChip } from "@/components/merchant/PTPChip";
import { PatternDialog } from "@/components/merchant/PatternDialog";
import { getTierColor } from "@/lib/tierColors";
import { Switch } from "@/components/ui/switch";
import { HeartbeatSyncButton } from "@/components/merchant/HeartbeatSyncButton";
import { JourneyStageCard } from "@/components/merchant/JourneyStageCard";
import { FanJourneyTimeline } from "@/components/merchant/FanJourneyTimeline";
import { ContentEngagementPanel } from "@/components/merchant/ContentEngagementPanel";
import { CommerceJourneyPanel } from "@/components/merchant/CommerceJourneyPanel";
import { JourneyFunnelVisualization } from "@/components/merchant/JourneyFunnelVisualization";

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  tier: string;
  total_spend: number;
  mrr: number;
  watch_time: number;
  listen_time: number;
  products_purchased: string[];
  intro_answers?: Record<string, any>;
  last_login: string;
  created_at: string;
  era_current?: number;
  ptp_current?: number;
  era_label?: string;
  ptp_status?: string;
  birthdate?: string;
  gender?: string;
}

interface AdminDashboardProps {
  selectedUserId?: string | null;
}

export default function AdminDashboard({ selectedUserId }: AdminDashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [pixels, setPixels] = useState([]);
  const [legalDocs, setLegalDocs] = useState([]);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [filterERA, setFilterERA] = useState<string>('all');
  const [filterPTP, setFilterPTP] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<{ member: any; pattern: any } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cameoFlagEnabled, setCameoFlagEnabled] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const PAGE_SIZE = 50;
  const { toast: toastHook } = useToast();
  const navigate = useNavigate();

  const patterns = [
    {
      name: "The Emotional Warm-Up Loop",
      emoji: "🔁",
      description: "A fan replays short emotional clips (vlogs, behind-the-scenes, acoustic versions) multiple times before diving into longer content.",
      signal: "Emotional attachment forming — they're warming up to identity alignment.",
      action: "Trigger 'Deeper Dive' prompt or story recommendation."
    },
    {
      name: "The Meaning-First Buyer",
      emoji: "🛒",
      description: "Watches or reads the story before visiting the store.",
      signal: "Purchases are narrative-driven — buying for meaning, not merch.",
      action: "Prioritize storytelling in their content feed; offer 'Era Drop' related to what they viewed."
    },
    {
      name: "The Soundtrack Bond",
      emoji: "💽",
      description: "Listens to full albums in sequence rather than shuffle.",
      signal: "Deep psychological absorption — more likely to buy physical or signed editions.",
      action: "Push collector's items or vinyl offers; they crave completion."
    },
    {
      name: "The Repetition-to-Reinforcement Cycle",
      emoji: "🧠",
      description: "Fan repeatedly watches the same doc, vlog, or live performance over several days.",
      signal: "Emotional resonance has peaked — they're ready for a deeper bond (VIP, meet & greet, membership).",
      action: "Trigger 'Join the Inner Circle' or exclusive content invite."
    },
    {
      name: "The Social Mirror Pattern",
      emoji: "💬",
      description: "Comments or shares right after watching — especially tagging friends.",
      signal: "Identity expression. They're using the brand as part of their self-image.",
      action: "Reward them with spotlight features or personalized thank-you notes."
    },
    {
      name: "The 7-Hour Activation",
      emoji: "⏱️",
      description: "Once a fan spends 7+ cumulative hours in the portal (music, gallery, videos).",
      signal: "Tribe bond formed — they behave like lifelong members.",
      action: "Trigger personalized message or physical touchpoint (gift card, signed postcard)."
    },
    {
      name: "The Era Echo Pattern",
      emoji: "🎟️",
      description: "A fan re-engages with old era content right before a new era drop.",
      signal: "They're nostalgic and emotionally primed — high likelihood of purchasing new merch or tickets.",
      action: "Send 'Then & Now' campaign showing continuity between eras."
    },
    {
      name: "The Reciprocity Loop",
      emoji: "📦",
      description: "After receiving something physical (gift card, signed photo, postcard), digital activity spikes 40–50%.",
      signal: "Physical recognition fuels digital loyalty.",
      action: "Automate 'offline echo' triggers after each fulfillment."
    },
    {
      name: "The Exploration Flow",
      emoji: "🧭",
      description: "Navigates organically — homepage → music → vlog → gallery → merch (instead of jumping directly to one item).",
      signal: "Explorers are 4× more loyal and higher lifetime value.",
      action: "Encourage curiosity pathways through adaptive recommendations."
    },
    {
      name: "The Drop-Time Surge",
      emoji: "⚡",
      description: "Sudden spikes in logins, replays, or chat messages within 24h of new content.",
      signal: "Cultural heatwave — fans are synchronized emotionally.",
      action: "Launch limited-time drop or exclusive Q&A during that window."
    },
    {
      name: "The Loyalty Cascade",
      emoji: "💎",
      description: "One fan's activity (comment, repost, review) leads to measurable increases in 2–3 others' engagement.",
      signal: "That fan is an emotional influencer inside the micro-community.",
      action: "Tag them as 'Seed Node' for early releases or ambassador invites."
    }
  ];


  useEffect(() => {
    loadMembers();
    // Defer non-critical loads for better initial performance
    const loadDeferred = () => {
      loadTierCounts();
      loadPixels();
      loadLegalDocs();
      loadFeatureFlags();
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDeferred);
    } else {
      setTimeout(loadDeferred, 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload members when page changes
  useEffect(() => {
    loadMembers();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // If a user was selected from the globe, show their profile
    if (selectedUserId && members.length > 0) {
      const member = members.find(m => m.user_id === selectedUserId);
      if (member) {
        setSelectedMember(member);
      }
    }
  }, [selectedUserId, members]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      // Get total count first for pagination
      const { count } = await supabase
        .from("user_profiles")
        .select("*", { count: 'exact', head: true });
      
      const total = count || 0;
      setTotalPages(Math.ceil(total / PAGE_SIZE));
      
      // Fetch paginated user profiles with ERA/PTP scores
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (error) {
        console.error('Error loading members:', error);
        setMembers([]);
        return;
      }

      const realMembers = data || [];
      
      // Use REAL data - no more random demo scores for real users
      const realMembersWithScores = realMembers.map(member => {
        // If they have real ERA/PTP scores, use them
        if (member.era_current && member.ptp_current && member.era_label && member.ptp_status) {
          return member;
        }
        
        // If no scores yet, set defaults indicating they need to engage more
        return {
          ...member,
          era_current: 1, // Start at Discover
          ptp_current: 0, // Cold lead
          era_label: 'Discover',
          ptp_status: 'Stop',
          watch_time: member.watch_time || 0,
          listen_time: member.listen_time || 0
        };
      });
      
      setMembers(realMembersWithScores as Member[]);
    } finally {
      setLoadingMembers(false);
    }
  }, [page]);

  const loadTierCounts = useCallback(async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("tier");

    // Use mock data for demo
    const counts: Record<string, number> = {
      "Rebels": 150,
      "Outlaws": 125,
      "Legionnaires": 80
    };
    setTierCounts(counts);
  }, []);

  const loadPixels = useCallback(async () => {
    const { data } = await supabase
      .from("tracking_pixels")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPixels(data);
  }, []);

  const loadLegalDocs = useCallback(async () => {
    const { data } = await supabase
      .from("legal_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setLegalDocs(data);
  }, []);

  const loadFeatureFlags = useCallback(async () => {
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', 'enable_cameo_booking')
      .single();

    if (data) {
      setCameoFlagEnabled(data.enabled);
    }
  }, []);

  const toggleCameoFeature = async () => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: !cameoFlagEnabled })
      .eq('flag_name', 'enable_cameo_booking');

    if (!error) {
      setCameoFlagEnabled(!cameoFlagEnabled);
      toast.success('Feature flag updated');
    } else {
      toast.error('Failed to update feature flag');
    }
  };

  const addPixel = async (platform: string, pixelId: string) => {
    const { error } = await supabase.from("tracking_pixels").insert({
      name: platform,
      platform,
      pixel_id: pixelId,
      enabled: true
    });

    if (!error) {
      toast.success("Pixel added successfully");
      loadPixels();
    }
  };

  const addLegalDoc = async (title: string, content: string, type: string) => {
    const { error } = await supabase.from("legal_documents").insert({
      title,
      content,
      document_type: type,
      effective_date: new Date().toISOString()
    });

    if (!error) {
      toast.success("Legal document added successfully");
      loadLegalDocs();
    }
  };

  // Mock stats for demo
  const totalMembers = 355;
  const totalMRR = 7100;
  const totalRevenue = 21300;
  
  // Compute analytics
  const avgERA = members.length > 0 
    ? Math.round(members.reduce((sum, m) => sum + (m.era_current || 5), 0) / members.length)
    : 5;
  
  const hotPTPLeads = members.filter(m => (m.ptp_current || 0) >= 70).length;
  
  // Filter and sort members
  const getFilteredMembers = () => {
    let filtered = [...members];
    
    // Filter by ERA
    if (filterERA !== 'all') {
      filtered = filtered.filter(m => m.era_label === filterERA);
    }
    
    // Filter by PTP
    if (filterPTP !== 'all') {
      filtered = filtered.filter(m => m.ptp_status === filterPTP);
    }
    
    // Filter by Tier
    if (filterTier !== 'all') {
      filtered = filtered.filter(m => m.tier?.toLowerCase() === filterTier.toLowerCase());
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'era') return (b.era_current || 0) - (a.era_current || 0);
      if (sortBy === 'ptp') return (b.ptp_current || 0) - (a.ptp_current || 0);
      if (sortBy === 'total_spend') return (b.total_spend || 0) - (a.total_spend || 0);
      if (sortBy === 'last_login') {
        const dateA = a.last_login ? new Date(a.last_login).getTime() : 0;
        const dateB = b.last_login ? new Date(b.last_login).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
    
    return filtered;
  };
  
  const filteredMembers = getFilteredMembers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Community Management</h2>
        <p className="text-muted-foreground">Manage your community members and settings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Members</CardTitle>
            <Users className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalMRR.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg ERA (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgERA}/10</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => {
          setFilterPTP('Go');
          setSortBy('ptp');
        }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Hot PTP Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{hotPTPLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Click to view</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="journey" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Fan Journey
          </TabsTrigger>
          <TabsTrigger value="superfans">Superfan Index</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="pixels">Tracking</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Directory</CardTitle>
              <CardDescription>View all community members with their profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Sort */}
              <div className="flex gap-4 mb-6 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                  >
                    <option value="created_at">Join Date</option>
                    <option value="era">ERA</option>
                    <option value="ptp">PTP</option>
                    <option value="last_login">Last Activity</option>
                    <option value="total_spend">Total Spend</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">ERA:</span>
                  <select 
                    value={filterERA}
                    onChange={(e) => setFilterERA(e.target.value)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                  >
                    <option value="all">All</option>
                    <option value="Discover">Discover</option>
                    <option value="Engage">Engage</option>
                    <option value="Invest">Invest</option>
                    <option value="Loyal">Loyal</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">PTP:</span>
                  <select 
                    value={filterPTP}
                    onChange={(e) => setFilterPTP(e.target.value)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                  >
                    <option value="all">All</option>
                    <option value="Stop">Stop</option>
                    <option value="Wait">Wait</option>
                    <option value="Go">Go</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tier:</span>
                  <select 
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                  >
                    <option value="all">All</option>
                    <option value="free">Free</option>
                    <option value="rebels">Rebels</option>
                    <option value="outlaws">Outlaws</option>
                    <option value="legionnaires">Legionnaires</option>
                  </select>
                </div>

                {(filterERA !== 'all' || filterPTP !== 'all' || filterTier !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterERA('all');
                      setFilterPTP('all');
                      setFilterTier('all');
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading members...</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.display_name}`} />
                          <AvatarFallback>{member.display_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{member.display_name || "Unknown"}</h3>
                              <Badge className={`${getTierColor(member.tier)} px-4 py-1.5 text-sm h-8 min-w-[120px] flex items-center justify-center`}>
                                {member.tier || "N/A"}
                              </Badge>
                              {member.era_current && member.era_label && (
                                <ERABadge era={member.era_current} label={member.era_label} />
                              )}
                              {member.ptp_current !== undefined && member.ptp_status && (
                                <PTPChip ptp={member.ptp_current} status={member.ptp_status} />
                              )}
                              <JourneyStageCard userId={member.user_id} compact />
                            </div>
                            <div className="flex gap-6 text-sm">
                              <div className="text-center">
                                <p className="text-foreground/70 font-medium">Total Spend</p>
                                <p className="font-bold text-foreground">${member.total_spend?.toFixed(2) || "0.00"}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-foreground/70 font-medium">MRR</p>
                                <p className="font-bold text-foreground">${member.mrr?.toFixed(2) || "0.00"}</p>
                              </div>
                            </div>
                          </div>

                          {member.bio && (
                            <p className="text-sm text-foreground/80 font-medium">{member.bio}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-foreground/70 font-medium">
                            {member.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {member.location}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Watch: {Math.floor((member.watch_time || 0) / 60)}h
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Listen: {Math.floor((member.listen_time || 0) / 60)}h
                            </div>
                          </div>

                          {member.intro_answers && (
                            <div className="mt-2 p-3 bg-muted/50 rounded-md">
                              <h4 className="text-xs font-bold text-foreground/70 mb-2">INTRO</h4>
                              <div className="grid gap-1 text-sm">
                                {Object.entries(member.intro_answers).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-foreground/70 font-medium min-w-[100px]">{key}:</span>
                                    <span className="font-semibold text-foreground">{value as string}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 text-xs text-foreground/70 font-medium pt-2">
                            <div className="flex items-center gap-2">
                              <span>Last login: {member.last_login
                                ? formatDistanceToNow(new Date(member.last_login), { addSuffix: true })
                                : "Never"}</span>
                              <span>•</span>
                              <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
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
                                onClick={() => {
                                  const patternIndex = (member as any).patternIndex || Math.floor(Math.random() * patterns.length);
                                  setSelectedPattern({ member, pattern: patterns[patternIndex] });
                                }}
                              >
                                View Pattern
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found matching filters
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({members.length} members loaded)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || loadingMembers}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loadingMembers}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Fan Journey Analytics</h3>
              <p className="text-muted-foreground">Track fan progression from awareness to advocacy</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                const { data, error } = await supabase.functions.invoke('seed-journey-milestones');
                if (error) {
                  toast.error("Error seeding journey data");
                } else {
                  toast.success("Journey milestones seeded! Refreshing...");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Seed Demo Milestones
            </Button>
          </div>
          
          <JourneyFunnelVisualization />
        </TabsContent>

        <TabsContent value="superfans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Heatmap</CardTitle>
              <CardDescription>Purchase readiness ranked by PTP score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members
                  .sort((a, b) => {
                    const ptpA = a.ptp_current || 0;
                    const ptpB = b.ptp_current || 0;
                    return ptpB - ptpA;
                  })
                  .map((member, index) => {
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{member.display_name}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge className={`${getTierColor(member.tier)} px-4 py-1.5 text-sm h-8 min-w-[120px] flex items-center justify-center`}>
                                {member.tier || 'Free'}
                              </Badge>
                              {member.era_current && member.era_label && (
                                <ERABadge era={member.era_current} label={member.era_label} />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-foreground/70 font-medium">Watch Time</p>
                            <p className="font-bold text-foreground">{Math.floor((member.watch_time || 0) / 60)}h</p>
                          </div>
                          <div className="text-center">
                            <p className="text-foreground/70 font-medium">Total Spend</p>
                            <p className="font-bold text-foreground">${(member.total_spend || 0).toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-foreground/70 font-medium">PTP</p>
                            {member.ptp_current !== undefined && member.ptp_status ? (
                              <PTPChip ptp={member.ptp_current} status={member.ptp_status} />
                            ) : (
                              <p className="font-bold text-muted-foreground">N/A</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="mb-6 flex justify-end">
            <Button 
              onClick={async () => {
                const { data, error } = await supabase.functions.invoke('seed-demo-data');
                if (error) {
                  toast.error("Error seeding data");
                } else {
                  toast.success("Demo data seeded successfully! Refreshing...");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              variant="outline"
            >
              Seed Demo ERA/PTP Data
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Cohort Rivers
                </CardTitle>
                <CardDescription>Overlapping behavioral segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Nashville, TN</span>
                    <Badge>High Activity</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Austin, TX</span>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Los Angeles, CA</span>
                    <Badge>High Activity</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Timing
                </CardTitle>
                <CardDescription>Peak login & purchase hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Peak Hours</span>
                    <span className="text-sm font-semibold text-foreground">7PM - 10PM EST</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Purchase Peak</span>
                    <span className="text-sm font-semibold text-foreground">8PM - 9PM EST</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Content Peak</span>
                    <span className="text-sm font-semibold text-foreground">9PM - 11PM EST</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Top Content Analytics
                </CardTitle>
                <CardDescription>Most-watched & shared media</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Virtual Tour Finale</span>
                    <span className="text-sm font-semibold">2.4k views</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Acoustic Session</span>
                    <span className="text-sm font-semibold">1.8k views</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Behind the Scenes</span>
                    <span className="text-sm font-semibold">1.2k views</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Merch Performance
                </CardTitle>
                <CardDescription>Best sellers + margin data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Tour Hoodie</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">143 sold</p>
                      <p className="text-xs text-muted-foreground">45% margin</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Limited Vinyl</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">89 sold</p>
                      <p className="text-xs text-muted-foreground">60% margin</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Signature Cap</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">67 sold</p>
                      <p className="text-xs text-muted-foreground">55% margin</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Behavior Flow Mapping</CardTitle>
              <CardDescription>Navigation from content → commerce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">Video Views</p>
                  <p className="text-sm font-semibold text-foreground/80 mt-1">Entry Point</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Profile Visit</p>
                  <p className="text-sm font-semibold text-foreground/80 mt-1">45% convert</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Merch Browse</p>
                  <p className="text-sm font-semibold text-foreground/80 mt-1">62% engage</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Purchase</p>
                  <p className="text-sm font-semibold text-foreground/80 mt-1">28% convert</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


          <TabsContent value="tiers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membership Tiers Overview</CardTitle>
                <CardDescription>Distribution of members across tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Rebels ($10/mo)</h3>
                    <p className="text-3xl font-bold">{tierCounts["Rebels"] || 0}</p>
                    <p className="text-sm text-muted-foreground">members</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Outlaws ($25/mo)</h3>
                    <p className="text-3xl font-bold">{tierCounts["Outlaws"] || 0}</p>
                    <p className="text-sm text-muted-foreground">members</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Legionnaires ($50/mo)</h3>
                    <p className="text-3xl font-bold">{tierCounts["Legionnaires"] || 0}</p>
                    <p className="text-sm text-muted-foreground">members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pixels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Tracking</CardTitle>
                <CardDescription>Manage tracking pixels for analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Facebook Pixel ID</Label>
                    <Input placeholder="567890123456789" />
                  </div>
                  <div>
                    <Label>Google Tag Manager ID</Label>
                    <Input placeholder="GTM-ABCDE1F" />
                  </div>
                  <div>
                    <Label>Google Analytics ID</Label>
                    <Input placeholder="G-ZN18MXN96S" />
                  </div>
                </div>
                <Button className="bg-gradient-gold">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Legal Documents</CardTitle>
                <CardDescription>Manage terms of service, privacy policy, and other legal documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Privacy Policy</h3>
                    <Button variant="outline">Review And Accept</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Terms and Conditions</h3>
                    <Button variant="outline">Review And Accept</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Data Processing Addendum</h3>
                    <Button variant="outline">Review And Accept</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Control which features are enabled for your community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Cameo Booking</p>
                    <p className="text-sm text-muted-foreground">
                      Allow fans to book personalized cameo videos
                    </p>
                  </div>
                  <Switch
                    checked={cameoFlagEnabled}
                    onCheckedChange={toggleCameoFeature}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
      
      {selectedPattern && (
        <PatternDialog
          isOpen={!!selectedPattern}
          onClose={() => setSelectedPattern(null)}
          memberName={selectedPattern.member.display_name}
          pattern={selectedPattern.pattern}
        />
      )}

      <Drawer open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DrawerContent className="max-h-[90vh]">
          {selectedMember && (
            <>
              <DrawerHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedMember.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.display_name}`} />
                      <AvatarFallback>{selectedMember.display_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DrawerTitle className="text-2xl">{selectedMember.display_name}</DrawerTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getTierColor(selectedMember.tier)} px-3 py-1 text-xs`}>
                          {selectedMember.tier || "N/A"}
                        </Badge>
                        {selectedMember.era_current && selectedMember.era_label && (
                          <ERABadge era={selectedMember.era_current} label={selectedMember.era_label} />
                        )}
                        {selectedMember.ptp_current !== undefined && selectedMember.ptp_status && (
                          <PTPChip ptp={selectedMember.ptp_current} status={selectedMember.ptp_status} />
                        )}
                      </div>
                    </div>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-white/10">
                      <X className="h-5 w-5" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>
              
              <div className="p-6 overflow-y-auto">
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="journey">Journey</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="commerce">Commerce</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    {selectedMember.bio && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground/70 mb-2">BIO</h3>
                        <p className="text-foreground">{selectedMember.bio}</p>
                      </div>
                    )}

                    {selectedMember.location && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground/70 mb-2">LOCATION</h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedMember.location}</span>
                        </div>
                      </div>
                    )}

                    {(selectedMember.birthdate || selectedMember.gender) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMember.birthdate && (() => {
                          const today = new Date();
                          const birth = new Date(selectedMember.birthdate);
                          let age = today.getFullYear() - birth.getFullYear();
                          const monthDiff = today.getMonth() - birth.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                            age--;
                          }
                          return (
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h3 className="text-xs font-bold text-foreground/70 mb-2">AGE</h3>
                              <p className="text-2xl font-bold">{age} years</p>
                            </div>
                          );
                        })()}
                        {selectedMember.gender && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <h3 className="text-xs font-bold text-foreground/70 mb-2">GENDER</h3>
                            <p className="text-2xl font-bold capitalize">{selectedMember.gender}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-xs font-bold text-foreground/70 mb-2">TOTAL SPEND</h3>
                        <p className="text-2xl font-bold">${selectedMember.total_spend?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-xs font-bold text-foreground/70 mb-2">MRR</h3>
                        <p className="text-2xl font-bold">${selectedMember.mrr?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-xs font-bold text-foreground/70 mb-2">WATCH TIME</h3>
                        <p className="text-2xl font-bold">{Math.floor((selectedMember.watch_time || 0) / 60)}h</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-xs font-bold text-foreground/70 mb-2">LISTEN TIME</h3>
                        <p className="text-2xl font-bold">{Math.floor((selectedMember.listen_time || 0) / 60)}h</p>
                      </div>
                    </div>

                    {selectedMember.intro_answers && (
                      <div>
                        <h3 className="text-sm font-bold text-foreground/70 mb-3">INTRO ANSWERS</h3>
                        <div className="space-y-2">
                          {Object.entries(selectedMember.intro_answers).map(([key, value]) => (
                            <div key={key} className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-bold text-foreground/70 mb-1">{key}</p>
                              <p className="text-foreground">{value as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-foreground/70 pt-4 border-t">
                      <span>Last login: {selectedMember.last_login
                        ? formatDistanceToNow(new Date(selectedMember.last_login), { addSuffix: true })
                        : "Never"}</span>
                      <span>•</span>
                      <span>Joined: {new Date(selectedMember.created_at).toLocaleDateString()}</span>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="journey">
                    <FanJourneyTimeline userId={selectedMember.user_id || selectedMember.id} />
                  </TabsContent>
                  
                  <TabsContent value="content">
                    <ContentEngagementPanel userId={selectedMember.user_id || selectedMember.id} />
                  </TabsContent>
                  
                  <TabsContent value="commerce">
                    <CommerceJourneyPanel userId={selectedMember.user_id || selectedMember.id} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

