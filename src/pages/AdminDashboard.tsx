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
      setMembers(data);
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
      <div>
        <h2 className="text-3xl font-bold mb-2">Community Management</h2>
        <p className="text-muted-foreground">Manage your community members and settings</p>
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
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="pixels">Tracking</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
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
const mockMembers = [
  {
    id: "1",
    user_id: "1",
    display_name: "Sarah Mitchell",
    tier: "Legionnaires",
    total_spend: 149.99,
    mrr: 25.00,
    watch_time: 7200,
    listen_time: 14400,
    products_purchased: ["Hoodie", "Album"],
    last_login: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 7776000000).toISOString(),
  },
  {
    id: "2",
    user_id: "2",
    display_name: "Marcus Johnson",
    tier: "Legionnaires",
    total_spend: 89.99,
    mrr: 25.00,
    watch_time: 5400,
    listen_time: 10800,
    products_purchased: ["T-Shirt", "Cap"],
    last_login: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 15552000000).toISOString(),
  },
  {
    id: "3",
    user_id: "3",
    display_name: "Emily Rodriguez",
    tier: "Rebels",
    total_spend: 199.99,
    mrr: 10.00,
    watch_time: 9600,
    listen_time: 18000,
    products_purchased: ["Limited Edition Vinyl", "Poster"],
    last_login: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 31104000000).toISOString(),
  },
  {
    id: "4",
    user_id: "4",
    display_name: "Alex Thompson",
    tier: "Rebels",
    total_spend: 45.00,
    mrr: 10.00,
    watch_time: 3600,
    listen_time: 7200,
    products_purchased: ["Sticker Pack"],
    last_login: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 5184000000).toISOString(),
  },
  {
    id: "5",
    user_id: "5",
    display_name: "Chris Anderson",
    tier: "Rebels",
    total_spend: 120.00,
    mrr: 10.00,
    watch_time: 6000,
    listen_time: 12000,
    products_purchased: ["Album Bundle", "Bandana"],
    last_login: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 20736000000).toISOString(),
  },
];
