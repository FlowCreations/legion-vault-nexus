import { useState, useEffect } from "react";
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
import { Users, DollarSign, Video, FileText, TrendingUp, Eye, Award, MapPin, Clock, ShoppingBag, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ERABadge } from "@/components/merchant/ERABadge";
import { PTPChip } from "@/components/merchant/PTPChip";
import { PatternDialog } from "@/components/merchant/PatternDialog";
import { getTierColor } from "@/lib/tierColors";

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
  const [selectedPattern, setSelectedPattern] = useState<{ member: any; pattern: any } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { toast } = useToast();
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
    loadTierCounts();
    loadPixels();
    loadLegalDocs();
  }, []);

  useEffect(() => {
    // If a user was selected from the globe, show their profile
    if (selectedUserId && members.length > 0) {
      const member = members.find(m => m.user_id === selectedUserId);
      if (member) {
        setSelectedMember(member);
      }
    }
  }, [selectedUserId, members]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Always combine real members with demo profiles
    const realMembers = data || [];
    
    // Add demo ERA/PTP scores to real members who don't have them
    const realMembersWithScores = realMembers.map(member => {
      if (!member.era_current || !member.ptp_current) {
        const era = Math.floor(Math.random() * 10) + 1; // 1-10
        const ptp = Math.floor(Math.random() * 100); // 0-100
        
        let eraLabel = 'Discover';
        if (era > 3 && era <= 6) eraLabel = 'Engage';
        else if (era > 6 && era <= 8) eraLabel = 'Invest';
        else if (era > 8) eraLabel = 'Loyal';
        
        let ptpStatus = 'Cold';
        if (ptp >= 40 && ptp < 70) ptpStatus = 'Warm';
        else if (ptp >= 70) ptpStatus = 'Hot';
        
        return {
          ...member,
          era_current: era,
          ptp_current: ptp,
          era_label: eraLabel,
          ptp_status: ptpStatus
        };
      }
      return member;
    });
    
    // Add demo scores to mock members
    const mockWithScores = mockMembers.map(member => {
      const era = Math.floor(Math.random() * 10) + 1;
      const ptp = Math.floor(Math.random() * 100);
      
      let eraLabel = 'Discover';
      if (era > 3 && era <= 6) eraLabel = 'Engage';
      else if (era > 6 && era <= 8) eraLabel = 'Invest';
      else if (era > 8) eraLabel = 'Loyal';
      
      let ptpStatus = 'Cold';
      if (ptp >= 40 && ptp < 70) ptpStatus = 'Warm';
      else if (ptp >= 70) ptpStatus = 'Hot';
      
      return {
        ...member,
        era_current: era,
        ptp_current: ptp,
        era_label: eraLabel,
        ptp_status: ptpStatus
      };
    });
    
    // Always combine real members with demo members
    setMembers([...realMembersWithScores, ...mockWithScores] as Member[]);
  };

  const loadTierCounts = async () => {
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
  };

  const loadPixels = async () => {
    const { data } = await supabase
      .from("tracking_pixels")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPixels(data);
  };

  const loadLegalDocs = async () => {
    const { data } = await supabase
      .from("legal_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setLegalDocs(data);
  };

  const addPixel = async (platform: string, pixelId: string) => {
    const { error } = await supabase.from("tracking_pixels").insert({
      name: platform,
      platform,
      pixel_id: pixelId,
      enabled: true
    });

    if (!error) {
      toast({ title: "Pixel added successfully" });
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
      toast({ title: "Legal document added successfully" });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Community Management</h2>
          <p className="text-muted-foreground">Manage your community members and settings</p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2">
          Powered by <span className="font-bold ml-1">JRNY</span>
        </Badge>
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
          setFilterPTP('Hot');
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
          <TabsTrigger value="superfans">Superfan Index</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
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
              <div className="flex gap-4 mb-6 flex-wrap">
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
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
              </div>
              
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
            </CardContent>
          </Card>
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
                                {member.tier}
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
                  toast({ title: "Error seeding data", variant: "destructive" });
                } else {
                  toast({ title: "Demo data seeded successfully! Refreshing..." });
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
      </Tabs>
      
      {selectedPattern && (
        <PatternDialog
          isOpen={!!selectedPattern}
          onClose={() => setSelectedPattern(null)}
          memberName={selectedPattern.member.display_name}
          pattern={selectedPattern.pattern}
        />
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-white/20 rounded-2xl p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedMember.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.display_name}`} />
                  <AvatarFallback>{selectedMember.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold">{selectedMember.display_name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getTierColor(selectedMember.tier)} px-4 py-1.5 text-sm h-8 min-w-[120px] flex items-center justify-center`}>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock members matching the directory profiles
const mockMembers: Member[] = [
  {
    id: "1",
    user_id: "1",
    display_name: "Sarah Johnson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Country music fanatic from Nashville. Been following SOL since day one!",
    location: "Nashville, TN",
    tier: "Legion Elite",
    total_spend: 450.00,
    mrr: 29.99,
    watch_time: 14400,
    listen_time: 28800,
    products_purchased: ["Hoodie", "Vinyl", "Poster"],
    intro_answers: {
      "Favorite Album": "Outlaw Sessions",
      "How did you discover SOL": "Live show in Nashville",
      "Favorite Song": "Wild Horse"
    },
    last_login: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    birthdate: "1992-05-15",
    gender: "female",
    patternIndex: 4,
  } as any,
  {
    id: "2",
    user_id: "2",
    display_name: "Mike Chen",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "Love the energy and authenticity. Can't wait for the next tour!",
    location: "Austin, TX",
    tier: "Legion Member",
    total_spend: 125.50,
    mrr: 9.99,
    watch_time: 7200,
    listen_time: 18000,
    products_purchased: ["T-Shirt", "Album"],
    intro_answers: {
      "Favorite Album": "Acoustic Sessions",
      "How did you discover SOL": "Spotify recommendation",
      "Favorite Song": "Carolina"
    },
    last_login: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    birthdate: "1988-11-22",
    gender: "male",
    patternIndex: 9,
  } as any,
  {
    id: "3",
    user_id: "3",
    display_name: "Emily Rodriguez",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    bio: "The raw emotion in every song speaks to my soul. SOL forever!",
    location: "Los Angeles, CA",
    tier: "Legion Elite",
    total_spend: 680.25,
    mrr: 49.99,
    watch_time: 21600,
    listen_time: 36000,
    products_purchased: ["VIP Ticket", "Hoodie", "Hat"],
    intro_answers: {
      "Favorite Album": "Power Sessions",
      "How did you discover SOL": "Friend recommendation",
      "Favorite Song": "Power"
    },
    last_login: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    birthdate: "1995-03-08",
    gender: "female",
    patternIndex: 6,
  } as any,
  {
    id: "4",
    user_id: "4",
    display_name: "David Kim",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    bio: "Been to 5 shows so far. The acoustic sessions are unmatched!",
    location: "Chicago, IL",
    tier: "Legion Member",
    total_spend: 200.00,
    mrr: 14.99,
    watch_time: 10800,
    listen_time: 21600,
    products_purchased: ["Album", "Poster"],
    intro_answers: {
      "Favorite Album": "Stripped Down",
      "How did you discover SOL": "YouTube",
      "Favorite Song": "Angels"
    },
    last_login: new Date(Date.now() - 18000000).toISOString(),
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    patternIndex: 2,
  } as any,
  {
    id: "5",
    user_id: "5",
    display_name: "Jessica Martinez",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
    bio: "The storytelling is incredible. Every lyric hits different.",
    location: "New York, NY",
    tier: "Legion VIP",
    total_spend: 890.00,
    mrr: 99.99,
    watch_time: 28800,
    listen_time: 43200,
    products_purchased: ["VIP Pass", "Vinyl", "Hoodie", "Tour Merch"],
    intro_answers: {
      "Favorite Album": "Walking on the Edge",
      "How did you discover SOL": "Concert",
      "Favorite Song": "Strange"
    },
    last_login: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 450 * 86400000).toISOString(),
    patternIndex: 1,
  } as any,
  {
    id: "6",
    user_id: "6",
    display_name: "Robert Taylor",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
    bio: "From Texas with love. SOL represents everything country should be.",
    location: "Dallas, TX",
    tier: "Free Member",
    total_spend: 45.00,
    mrr: 0.00,
    watch_time: 3600,
    listen_time: 7200,
    products_purchased: ["Sticker"],
    intro_answers: {
      "Favorite Album": "Outlaw Sessions",
      "How did you discover SOL": "Radio",
      "Favorite Song": "Wild Horse"
    },
    last_login: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    patternIndex: 8,
  } as any,
  {
    id: "7",
    user_id: "7",
    display_name: "Amanda White",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda",
    bio: "VIP member since the beginning. Worth every penny!",
    location: "Nashville, TN",
    tier: "Legion VIP",
    total_spend: 1250.00,
    mrr: 99.99,
    watch_time: 36000,
    listen_time: 50400,
    products_purchased: ["VIP Pass", "All Merch", "Signed Items"],
    intro_answers: {
      "Favorite Album": "Power Sessions",
      "How did you discover SOL": "Local show",
      "Favorite Song": "Air Tonight"
    },
    last_login: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 600 * 86400000).toISOString(),
    patternIndex: 5,
  } as any,
  {
    id: "8",
    user_id: "8",
    display_name: "Chris Anderson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
    bio: "The Legion is like family. Best community I've ever been part of.",
    location: "Phoenix, AZ",
    tier: "Legion Elite",
    total_spend: 550.00,
    mrr: 49.99,
    watch_time: 18000,
    listen_time: 32400,
    products_purchased: ["Hoodie", "Album", "Hat"],
    intro_answers: {
      "Favorite Album": "Acoustic Sessions",
      "How did you discover SOL": "Festival",
      "Favorite Song": "Carolina"
    },
    last_login: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    patternIndex: 3,
  } as any,
  {
    id: "9",
    user_id: "9",
    display_name: "Jordan Blake",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    bio: "Music is my therapy. SOL gets it. Every song hits home.",
    location: "Denver, CO",
    tier: "Legion Member",
    total_spend: 175.00,
    mrr: 14.99,
    watch_time: 9000,
    listen_time: 16200,
    products_purchased: ["Album", "T-Shirt"],
    intro_answers: {
      "Favorite Album": "Acoustic Sessions",
      "How did you discover SOL": "Instagram",
      "Favorite Song": "Runnin"
    },
    last_login: new Date(Date.now() - 28800000).toISOString(),
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    patternIndex: 10,
  } as any,
  {
    id: "10",
    user_id: "10",
    display_name: "Taylor Morgan",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=taylor",
    bio: "Following the journey from the start. Can't wait to see where it goes!",
    location: "Seattle, WA",
    tier: "Legion Elite",
    total_spend: 620.00,
    mrr: 49.99,
    watch_time: 19800,
    listen_time: 34200,
    products_purchased: ["VIP Ticket", "Hoodie", "Vinyl"],
    intro_answers: {
      "Favorite Album": "Power Sessions",
      "How did you discover SOL": "Friend",
      "Favorite Song": "Power"
    },
    last_login: new Date(Date.now() - 10800000).toISOString(),
    created_at: new Date(Date.now() - 250 * 86400000).toISOString(),
    patternIndex: 6,
  } as any,
  {
    id: "11",
    user_id: "11",
    display_name: "Alex Rivera",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Real country music. Real stories. Real fans. That's what we're about.",
    location: "Miami, FL",
    tier: "Legion Member",
    total_spend: 95.00,
    mrr: 9.99,
    watch_time: 5400,
    listen_time: 10800,
    products_purchased: ["T-Shirt"],
    intro_answers: {
      "Favorite Album": "Stripped Down",
      "How did you discover SOL": "TikTok",
      "Favorite Song": "Angels"
    },
    last_login: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    patternIndex: 4,
  } as any,
  {
    id: "12",
    user_id: "12",
    display_name: "Morgan Hayes",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=morgan",
    bio: "Been collecting all the merch. The quality is amazing!",
    location: "Portland, OR",
    tier: "Legion VIP",
    total_spend: 1050.00,
    mrr: 99.99,
    watch_time: 32400,
    listen_time: 46800,
    products_purchased: ["All Albums", "Hoodie", "Hat", "Poster"],
    intro_answers: {
      "Favorite Album": "Walking on the Edge",
      "How did you discover SOL": "Concert",
      "Favorite Song": "Strange"
    },
    last_login: new Date(Date.now() - 21600000).toISOString(),
    created_at: new Date(Date.now() - 400 * 86400000).toISOString(),
    patternIndex: 7,
  } as any,
  {
    id: "13",
    user_id: "13",
    display_name: "Casey Jordan",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=casey",
    bio: "Just discovered SOL and already obsessed. Where has this been all my life?",
    location: "Boston, MA",
    tier: "Free Member",
    total_spend: 25.00,
    mrr: 0.00,
    watch_time: 1800,
    listen_time: 3600,
    products_purchased: [],
    intro_answers: {
      "Favorite Album": "Outlaw Sessions",
      "How did you discover SOL": "YouTube",
      "Favorite Song": "Wild Horse"
    },
    last_login: new Date(Date.now() - 345600000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    patternIndex: 0,
  } as any,
  {
    id: "14",
    user_id: "14",
    display_name: "Riley Thompson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley",
    bio: "The acoustic versions are pure magic. Can't stop listening.",
    location: "San Diego, CA",
    tier: "Legion Elite",
    total_spend: 480.00,
    mrr: 29.99,
    watch_time: 16200,
    listen_time: 27000,
    products_purchased: ["Vinyl", "Hoodie"],
    intro_answers: {
      "Favorite Album": "Acoustic Sessions",
      "How did you discover SOL": "Radio",
      "Favorite Song": "Carolina"
    },
    last_login: new Date(Date.now() - 36000000).toISOString(),
    created_at: new Date(Date.now() - 160 * 86400000).toISOString(),
    patternIndex: 1,
  } as any,
  {
    id: "15",
    user_id: "15",
    display_name: "Sam Cooper",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    bio: "Supporting real artists making real music. Keep it coming!",
    location: "Atlanta, GA",
    tier: "Legion Member",
    total_spend: 210.00,
    mrr: 14.99,
    watch_time: 11400,
    listen_time: 19800,
    products_purchased: ["Album", "Hat", "Poster"],
    intro_answers: {
      "Favorite Album": "Power Sessions",
      "How did you discover SOL": "Friend recommendation",
      "Favorite Song": "Air Tonight"
    },
    last_login: new Date(Date.now() - 57600000).toISOString(),
    created_at: new Date(Date.now() - 110 * 86400000).toISOString(),
    patternIndex: 2,
  } as any,
];
