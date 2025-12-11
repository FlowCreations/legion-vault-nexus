import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  MousePointer, 
  ShoppingBag, 
  Music, 
  Gift,
  TrendingUp,
  Loader2,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";

interface FanAffiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: string;
  total_clicks: number;
  portal_signups: number;
  digital_purchases: number;
  merch_purchases: number;
  discount_codes_earned: number;
  created_at: string;
  user_profiles?: {
    display_name: string | null;
    email: string | null;
  };
}

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalRewardsIssued: number;
  totalRewardsRedeemed: number;
}

export const FanAffiliatesManager = () => {
  const [affiliates, setAffiliates] = useState<FanAffiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all fan affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('fan_affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliatesError) {
        console.error('Error loading affiliates:', affiliatesError);
      } else if (affiliatesData) {
        // Fetch user profiles separately
        const userIds = affiliatesData.map(a => a.user_id);
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        // Merge profiles with affiliates
        const affiliatesWithProfiles = affiliatesData.map(affiliate => ({
          ...affiliate,
          user_profiles: profilesData?.find(p => p.user_id === affiliate.user_id) || null
        })) as FanAffiliate[];

        setAffiliates(affiliatesWithProfiles);

        // Calculate stats
        const totalAffiliates = affiliatesWithProfiles.length;
        const activeAffiliates = affiliatesWithProfiles.filter(a => a.status === 'active').length;
        const totalClicks = affiliatesWithProfiles.reduce((sum, a) => sum + (a.total_clicks || 0), 0);
        const totalConversions = affiliatesWithProfiles.reduce((sum, a) => 
          sum + (a.portal_signups || 0) + (a.digital_purchases || 0) + (a.merch_purchases || 0), 0
        );

        // Load rewards stats
        const { data: rewardsData } = await supabase
          .from('affiliate_rewards')
          .select('used');

        const totalRewardsIssued = rewardsData?.length || 0;
        const totalRewardsRedeemed = rewardsData?.filter(r => r.used).length || 0;

        setStats({
          totalAffiliates,
          activeAffiliates,
          totalClicks,
          totalConversions,
          totalRewardsIssued,
          totalRewardsRedeemed,
        });
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Affiliates', 
      value: stats?.totalAffiliates || 0, 
      icon: Users,
      color: 'text-blue-500'
    },
    { 
      label: 'Active Affiliates', 
      value: stats?.activeAffiliates || 0, 
      icon: UserCheck,
      color: 'text-green-500'
    },
    { 
      label: 'Total Clicks', 
      value: stats?.totalClicks || 0, 
      icon: MousePointer,
      color: 'text-purple-500'
    },
    { 
      label: 'Total Conversions', 
      value: stats?.totalConversions || 0, 
      icon: TrendingUp,
      color: 'text-yellow-500'
    },
    { 
      label: 'Rewards Issued', 
      value: stats?.totalRewardsIssued || 0, 
      icon: Gift,
      color: 'text-pink-500'
    },
    { 
      label: 'Rewards Redeemed', 
      value: stats?.totalRewardsRedeemed || 0, 
      icon: Gift,
      color: 'text-orange-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fan Affiliates</h2>
        <p className="text-muted-foreground">
          Track and manage your fan affiliate program
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fan Affiliates</CardTitle>
          <CardDescription>
            View performance metrics for each affiliate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No fan affiliates yet</p>
              <p className="text-sm text-muted-foreground">
                Users can join the affiliate program from their profile
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3" />
                        Signups
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Music className="h-3 w-3" />
                        Digital
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        Merch
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Rewards</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">
                        {affiliate.user_profiles?.display_name || 
                         affiliate.user_profiles?.email || 
                         'Unknown User'}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {affiliate.affiliate_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={affiliate.status === 'active' ? 'default' : 'secondary'}
                          className={affiliate.status === 'active' ? 'bg-green-500/20 text-green-500' : ''}
                        >
                          {affiliate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {affiliate.total_clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {affiliate.portal_signups}
                      </TableCell>
                      <TableCell className="text-right">
                        {affiliate.digital_purchases}
                      </TableCell>
                      <TableCell className="text-right">
                        {affiliate.merch_purchases}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {affiliate.discount_codes_earned}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(affiliate.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
