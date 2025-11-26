import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, TrendingUp, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CommunityMembers } from "./CommunityMembers";
import { SuperfanIndex } from "./SuperfanIndex";
import { AIAnalytics } from "./AIAnalytics";
import { PTPCalculationTrigger } from "./admin/PTPCalculationTrigger";
import AdminDashboard from "@/pages/AdminDashboard";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

interface CommunityStats {
  totalMembers: number;
  totalMRR: number;
  totalRevenue: number;
  avgERA: number;
  hotPTPLeads: number;
  membersWithScores: number;
  lastComputed: string | null;
}

interface CommunityManagementProps {
  selectedUserId?: string | null;
}

export function CommunityManagement({ selectedUserId }: CommunityManagementProps) {
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    totalMRR: 0,
    totalRevenue: 0,
    avgERA: 0,
    hotPTPLeads: 0,
    membersWithScores: 0,
    lastComputed: null,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total members count
      const { count: totalMembers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get members with PTP/ERA scores
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('total_spend, era_current, ptp_current, ptp_status');

      const totalRevenue = profilesData?.reduce((sum, p) => sum + (p.total_spend || 0), 0) || 0;
      const membersWithScores = profilesData?.filter(p => p.ptp_current !== null).length || 0;
      const avgERA = profilesData && profilesData.length > 0
        ? profilesData.reduce((sum, p) => sum + (p.era_current || 0), 0) / profilesData.length
        : 0;
      const hotPTPLeads = profilesData?.filter(p => 
        p.ptp_status?.toLowerCase() === 'hot' || (p.ptp_current && p.ptp_current >= 70)
      ).length || 0;

      // Get last computation date
      const { data: lastScore } = await supabase
        .from('era_ptp_scores_daily')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalMembers: totalMembers || 0,
        totalMRR: 0, // This would need to be calculated from subscriptions
        totalRevenue,
        avgERA: Math.round(avgERA * 10) / 10,
        hotPTPLeads,
        membersWithScores,
        lastComputed: lastScore?.created_at || null,
      });
    } catch (error) {
      console.error('Error loading community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      toast({
        title: "Seeding demo data...",
        description: "This will populate ERA/PTP scores for all users",
      });

      const { data, error } = await supabase.functions.invoke('seed-demo-data');

      if (error) throw error;

      toast({
        title: "Demo data seeded successfully!",
        description: `Populated scores for ${data.profiles || 0} users`,
      });

      // Reload stats
      await loadStats();
    } catch (error: any) {
      console.error('Error seeding demo data:', error);
      toast({
        title: "Error seeding data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshScores = async () => {
    try {
      setRefreshing(true);
      toast({
        title: "Refreshing PTP scores...",
        description: "Computing scores for all active users",
      });

      const { error } = await supabase.functions.invoke('compute-era-ptp', {
        body: { recompute_all: true },
      });

      if (error) throw error;

      toast({
        title: "Scores refreshed successfully!",
        description: "All PTP/ERA scores have been updated",
      });

      // Reload stats
      await loadStats();
    } catch (error: any) {
      console.error('Error refreshing scores:', error);
      toast({
        title: "Error refreshing scores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    clickable = false,
    highlight = false,
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
    clickable?: boolean;
    highlight?: boolean;
  }) => (
    <Card className={`${clickable ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
            <p className={`text-3xl font-bold ${highlight ? 'text-green-500' : ''}`}>
              {loading ? '...' : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Community Management</h1>
        <p className="text-muted-foreground">Manage your community members and settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
        />
        <StatCard
          title="Total MRR"
          value={`$${stats.totalMRR.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Revenue"
          value={`$${Math.round(stats.totalRevenue).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg ERA (7d)"
          value={`${stats.avgERA}/10`}
          icon={TrendingUp}
        />
        <StatCard
          title="Hot PTP Leads"
          value={stats.hotPTPLeads}
          icon={Sparkles}
          subtitle="Click to view"
          clickable
          highlight
        />
      </div>

      {/* Data Status & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {stats.membersWithScores} of {stats.totalMembers} users have PTP scores
              </p>
              {stats.lastComputed && (
                <p className="text-xs text-muted-foreground">
                  Last computed: {new Date(stats.lastComputed).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSeedDemoData}
                disabled={seeding}
                variant="outline"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Seed Demo ERA/PTP Data
                  </>
                )}
              </Button>
              <Button
                onClick={handleRefreshScores}
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh PTP Scores
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="superfan">Superfan Index</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="ai">AI Analytics</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Suspense fallback={<LoadingSpinner />}>
            <CommunityMembers selectedUserId={selectedUserId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="superfan">
          <Suspense fallback={<LoadingSpinner />}>
            <SuperfanIndex />
          </Suspense>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Tiers management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Suspense fallback={<LoadingSpinner />}>
            <AIAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="tracking">
          <Suspense fallback={<LoadingSpinner />}>
            <PTPCalculationTrigger />
          </Suspense>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Legal documents coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Suspense fallback={<LoadingSpinner />}>
            <AdminDashboard selectedUserId={selectedUserId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
