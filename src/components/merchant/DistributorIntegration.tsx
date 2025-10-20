import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Music, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StreamingStats {
  platform: string;
  streams: number;
  estimated_revenue: number;
  period_start: string;
  period_end: string;
}

const DISTRIBUTORS = [
  "DistroKid",
  "CD Baby",
  "TuneCore",
  "Amuse",
  "Ditto Music",
  "Viberate",
  "Other"
];

export function DistributorIntegration() {
  const [distributor, setDistributor] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StreamingStats[]>([]);
  const [monthlyProjection, setMonthlyProjection] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("streaming_stats")
      .select("*")
      .order("period_start", { ascending: false })
      .limit(7);

    if (error) {
      console.error("Error fetching stats:", error);
      return;
    }

    setStats(data || []);
    calculateProjection(data || []);
  };

  const calculateProjection = (statsData: StreamingStats[]) => {
    if (statsData.length === 0) return;

    const weeklyStreams = statsData.reduce((sum, stat) => sum + stat.streams, 0);
    const weeklyRevenue = statsData.reduce((sum, stat) => sum + Number(stat.estimated_revenue), 0);
    
    // Project monthly based on weekly average (4.33 weeks per month)
    const monthlyEst = weeklyRevenue * 4.33;
    setMonthlyProjection(monthlyEst);
  };

  const connectDistributor = async () => {
    if (!distributor || !apiKey) {
      toast.error("Please select distributor and enter API key");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("distributor_integrations")
      .insert({
        merchant_id: user.id,
        distributor_name: distributor,
        api_credentials: { api_key: apiKey },
        last_sync: new Date().toISOString()
      });

    if (error) {
      toast.error("Failed to connect distributor");
    } else {
      toast.success("Distributor connected successfully");
      setApiKey("");
    }
    setLoading(false);
  };

  const mockSync = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mock data for demonstration
    const mockData = {
      merchant_id: user.id,
      platform: "Spotify",
      streams: Math.floor(Math.random() * 5000) + 1000,
      estimated_revenue: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase
      .from("streaming_stats")
      .insert([mockData]);

    if (!error) {
      toast.success("Synced latest streaming data");
      fetchStats();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Music className="h-6 w-6 text-affirmative-primary" />
          <h2 className="text-2xl font-bold">Distributor Integration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="distributor">Music Distributor</Label>
            <Select value={distributor} onValueChange={setDistributor}>
              <SelectTrigger id="distributor" className="mt-2">
                <SelectValue placeholder="Select distributor" />
              </SelectTrigger>
              <SelectContent>
                {DISTRIBUTORS.map((dist) => (
                  <SelectItem key={dist} value={dist}>
                    {dist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="api-key">API Key / Access Token</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your distributor API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Get your API key from your distributor's developer settings
            </p>
          </div>

          <Button onClick={connectDistributor} disabled={loading} className="w-full">
            Connect Distributor
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-affirmative-primary" />
            <h2 className="text-2xl font-bold">Royalty Estimates</h2>
          </div>
          <Button variant="outline" size="sm" onClick={mockSync}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 bg-gradient-to-br from-affirmative-primary/10 to-affirmative-primary/5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-affirmative-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Monthly Revenue</p>
                <p className="text-3xl font-bold">${monthlyProjection.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Music className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">This Week's Streams</p>
                <p className="text-3xl font-bold">
                  {stats.reduce((sum, s) => sum + s.streams, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {stats.length === 0 ? (
              <p className="text-muted-foreground">No streaming data yet. Connect your distributor to start tracking.</p>
            ) : (
              stats.map((stat, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{stat.platform}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(stat.period_start).toLocaleDateString()} - {new Date(stat.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{stat.streams.toLocaleString()} streams</p>
                      <p className="text-sm text-affirmative-primary">${Number(stat.estimated_revenue).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
