import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailRevenueAttributionProps {
  dateRange: {
    start: string;
    end: string;
  };
}

export const EmailRevenueAttribution = ({ dateRange }: EmailRevenueAttributionProps) => {
  const [attributionData, setAttributionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttributionData();
  }, [dateRange]);

  const loadAttributionData = async () => {
    try {
      // Get all purchases in date range
      const { data: purchases } = await supabase
        .from('orders')
        .select('*, user_id, total_amount, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (!purchases || purchases.length === 0) {
        setAttributionData([]);
        setLoading(false);
        return;
      }

      // For each purchase, find recent email clicks
      const attributed = await Promise.all(
        purchases.map(async (purchase) => {
          const { data: emailActivity } = await supabase
            .from('email_sends')
            .select(`
              *,
              campaign:email_campaigns(name)
            `)
            .eq('user_id', purchase.user_id)
            .not('clicked_at', 'is', null)
            .lt('clicked_at', purchase.created_at)
            .order('clicked_at', { ascending: false })
            .limit(1);

          if (emailActivity && emailActivity.length > 0) {
            const timeDiff = new Date(purchase.created_at).getTime() - new Date(emailActivity[0].clicked_at!).getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff <= 24) {
              return {
                campaignId: emailActivity[0].campaign_id,
                campaignName: emailActivity[0].campaign?.name || 'Unknown',
                amount: typeof purchase.total_amount === 'string' 
                  ? parseFloat(purchase.total_amount)
                  : purchase.total_amount,
              };
            }
          }
          return null;
        })
      );

      const validAttributions = attributed.filter(a => a !== null);
      
      // Group by campaign
      const byCampaign = validAttributions.reduce((acc: any, attr: any) => {
        if (!acc[attr.campaignId]) {
          acc[attr.campaignId] = {
            campaignName: attr.campaignName,
            revenue: 0,
            purchases: 0
          };
        }
        acc[attr.campaignId].revenue += attr.amount;
        acc[attr.campaignId].purchases += 1;
        return acc;
      }, {});

      setAttributionData(Object.values(byCampaign));
    } catch (error) {
      console.error('Error loading attribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = attributionData.reduce((sum, c) => sum + c.revenue, 0);

  if (loading) {
    return <div>Loading revenue attribution...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Attribution</CardTitle>
        <CardDescription>
          Purchases made within 24 hours of email click
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Attributed Revenue</p>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-2">
            {attributionData
              .sort((a, b) => b.revenue - a.revenue)
              .map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{campaign.campaignName}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.purchases} purchases
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${campaign.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: ${(campaign.revenue / campaign.purchases).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
