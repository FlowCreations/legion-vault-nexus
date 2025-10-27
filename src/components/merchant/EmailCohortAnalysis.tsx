import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface EmailCohortAnalysisProps {
  campaignId: string;
}

export const EmailCohortAnalysis = ({ campaignId }: EmailCohortAnalysisProps) => {
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCohortAnalysis();
  }, [campaignId]);

  const loadCohortAnalysis = async () => {
    try {
      const { data: sends } = await supabase
        .from('email_sends')
        .select(`
          *,
          user:user_profiles(era_current, ptp_current)
        `)
        .eq('campaign_id', campaignId);

      // Group by ERA label
      const eraGroups = sends?.reduce((acc: any, send: any) => {
        const era = send.user?.era_current || 'Unknown';
        if (!acc[era]) acc[era] = [];
        acc[era].push(send);
        return acc;
      }, {});

      const cohorts = Object.entries(eraGroups || {}).map(([era, sends]: [string, any]) => {
        const total = sends.length;
        const opened = sends.filter((s: any) => s.opened_at).length;
        const clicked = sends.filter((s: any) => s.clicked_at).length;

        return {
          name: era,
          total,
          openRate: total > 0 ? (opened / total) * 100 : 0,
          clickRate: total > 0 ? (clicked / total) * 100 : 0,
          ctorRate: opened > 0 ? (clicked / opened) * 100 : 0
        };
      });

      setCohortData(cohorts);
    } catch (error) {
      console.error('Error loading cohort analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = () => {
    if (cohortData.length === 0) return [];
    
    const insights = [];
    
    const bestOpen = cohortData.reduce((best, c) => 
      c.openRate > best.openRate ? c : best, cohortData[0]);
    insights.push(`${bestOpen.name} has the highest open rate at ${bestOpen.openRate.toFixed(1)}%`);

    const worstOpen = cohortData.reduce((worst, c) => 
      c.openRate < worst.openRate ? c : worst, cohortData[0]);
    if (worstOpen.openRate < 20) {
      insights.push(`${worstOpen.name} may need re-engagement campaigns (${worstOpen.openRate.toFixed(1)}% open rate)`);
    }

    return insights;
  };

  if (loading) {
    return <div>Loading cohort analysis...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Performance</CardTitle>
        <CardDescription>Email engagement by audience segment</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cohort</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead>Click Rate</TableHead>
              <TableHead>CTOR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohortData.map(cohort => (
              <TableRow key={cohort.name}>
                <TableCell className="font-medium">{cohort.name}</TableCell>
                <TableCell>{cohort.total}</TableCell>
                <TableCell>{cohort.openRate.toFixed(1)}%</TableCell>
                <TableCell>{cohort.clickRate.toFixed(1)}%</TableCell>
                <TableCell>{cohort.ctorRate.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {generateInsights().length > 0 && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Insights</h4>
            <ul className="text-sm space-y-1">
              {generateInsights().map((insight, index) => (
                <li key={index}>• {insight}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
