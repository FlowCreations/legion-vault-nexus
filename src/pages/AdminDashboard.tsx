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
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [pixels, setPixels] = useState([]);
  const [legalDocs, setLegalDocs] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
    loadTierCounts();
    loadPixels();
    loadLegalDocs();
  }, []);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMembers(data as Member[]);
    } else {
      // Use mock data if no real data available
      setMembers(mockMembers);
    }
  };

  const loadTierCounts = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("tier");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(profile => {
        if (profile.tier) {
          counts[profile.tier] = (counts[profile.tier] || 0) + 1;
        }
      });
      setTierCounts(counts);
    }
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

  const totalMRR = members.reduce((sum, m) => sum + (m.mrr || 0), 0);
  const totalSpend = members.reduce((sum, m) => sum + (m.total_spend || 0), 0);
  const totalWatchTime = members.reduce((sum, m) => sum + (m.watch_time || 0), 0);

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
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMRR.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalWatchTime / 60)}h</div>
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
              <div className="grid gap-4">
                {members.map((member) => (
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
                            <Badge className={getTierColor(member.tier)}>
                              {member.tier || "N/A"}
                            </Badge>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Total Spend</p>
                              <p className="font-semibold">${member.total_spend?.toFixed(2) || "0.00"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">MRR</p>
                              <p className="font-semibold">${member.mrr?.toFixed(2) || "0.00"}</p>
                            </div>
                          </div>
                        </div>

                        {member.bio && (
                          <p className="text-sm text-muted-foreground">{member.bio}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">INTRO</h4>
                            <div className="grid gap-1 text-sm">
                              {Object.entries(member.intro_answers).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-muted-foreground min-w-[100px]">{key}:</span>
                                  <span className="font-medium">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                          <span>Last login: {member.last_login
                            ? formatDistanceToNow(new Date(member.last_login), { addSuffix: true })
                            : "Never"}</span>
                          <span>•</span>
                          <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No members found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="superfans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Superfan Index</CardTitle>
              <CardDescription>Ranked by engagement, watch time, purchases, and shares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members
                  .sort((a, b) => {
                    const scoreA = (a.watch_time || 0) + (a.listen_time || 0) + (a.total_spend || 0) * 100;
                    const scoreB = (b.watch_time || 0) + (b.listen_time || 0) + (b.total_spend || 0) * 100;
                    return scoreB - scoreA;
                  })
                  .map((member, index) => {
                    const score = Math.floor(((member.watch_time || 0) + (member.listen_time || 0) + (member.total_spend || 0) * 100) / 100);
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{member.display_name}</h3>
                            <Badge className={getTierColor(member.tier)}>
                              {member.tier}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Watch Time</p>
                            <p className="font-semibold">{Math.floor((member.watch_time || 0) / 60)}h</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Total Spend</p>
                            <p className="font-semibold">${(member.total_spend || 0).toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Score</p>
                            <p className="font-bold text-primary">{score}</p>
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
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geo-Heatmap
                </CardTitle>
                <CardDescription>High-engagement regions</CardDescription>
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
                    <span className="text-sm text-muted-foreground">7PM - 10PM EST</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Purchase Peak</span>
                    <span className="text-sm text-muted-foreground">8PM - 9PM EST</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="font-medium">Content Peak</span>
                    <span className="text-sm text-muted-foreground">9PM - 11PM EST</span>
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
                  <p className="text-sm text-muted-foreground mt-1">Entry Point</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Profile Visit</p>
                  <p className="text-sm text-muted-foreground mt-1">45% convert</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Merch Browse</p>
                  <p className="text-sm text-muted-foreground mt-1">62% engage</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Purchase</p>
                  <p className="text-sm text-muted-foreground mt-1">28% convert</p>
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
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
  },
];
