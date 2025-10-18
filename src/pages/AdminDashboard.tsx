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
import { Users, DollarSign, Video, FileText, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  tier: string;
  total_spend: number;
  mrr: number;
  watch_time: number;
  listen_time: number;
  products_purchased: string[];
  last_login: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [pixels, setPixels] = useState([]);
  const [legalDocs, setLegalDocs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      navigate("/");
      toast({ title: "Access denied", description: "Admin access required", variant: "destructive" });
      return;
    }

    setIsAdmin(true);
    loadMembers();
    loadTierCounts();
    loadPixels();
    loadLegalDocs();
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMembers(data);
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

  if (!isAdmin) {
    return null;
  }

  const totalMRR = members.reduce((sum, m) => sum + (m.mrr || 0), 0);
  const totalSpend = members.reduce((sum, m) => sum + (m.total_spend || 0), 0);
  const totalWatchTime = members.reduce((sum, m) => sum + (m.watch_time || 0), 0);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your community and content</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
            <TabsTrigger value="members">Manage Members</TabsTrigger>
            <TabsTrigger value="videos">Video Library</TabsTrigger>
            <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
            <TabsTrigger value="pixels">Tracking Pixels</TabsTrigger>
            <TabsTrigger value="legal">Legal Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Member Management</CardTitle>
                <CardDescription>View and manage all community members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Total Spend</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead>Watch Time</TableHead>
                        <TableHead>Listen Time</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Signed Up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.display_name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {member.tier || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>${member.total_spend?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>${member.mrr?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>{Math.floor((member.watch_time || 0) / 60)}h</TableCell>
                          <TableCell>{Math.floor((member.listen_time || 0) / 60)}h</TableCell>
                          <TableCell>
                            {member.last_login
                              ? formatDistanceToNow(new Date(member.last_login), { addSuffix: true })
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {new Date(member.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Video Management</CardTitle>
                <CardDescription>Upload and manage video content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/video-manager")} className="bg-gradient-gold">
                  <Video className="mr-2 h-4 w-4" />
                  Go to Video Manager
                </Button>
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
    </div>
  );
}
