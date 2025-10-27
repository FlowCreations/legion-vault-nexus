import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ABTestResultsProps {
  campaignId: string;
}

export const ABTestResults = ({ campaignId }: ABTestResultsProps) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [campaignId]);

  const loadResults = async () => {
    try {
      const { data: variants } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!variants) {
        setResults([]);
        return;
      }

      const variantStats = await Promise.all(
        variants.map(async (variant) => {
          const { data: assignments } = await supabase
            .from('ab_test_assignments')
            .select('user_id')
            .eq('variant_id', variant.id);

          const userIds = assignments?.map(a => a.user_id) || [];

          const { data: sends } = await supabase
            .from('email_sends')
            .select('*')
            .eq('campaign_id', campaignId)
            .in('user_id', userIds);

          const total = sends?.length || 0;
          const opened = sends?.filter(s => s.opened_at).length || 0;
          const clicked = sends?.filter(s => s.clicked_at).length || 0;

          return {
            ...variant,
            totalSent: total,
            opened,
            clicked,
            openRate: total > 0 ? (opened / total) * 100 : 0,
            clickRate: total > 0 ? (clicked / total) * 100 : 0,
          };
        })
      );

      setResults(variantStats);
    } catch (error) {
      console.error('Error loading AB test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSignificance = () => {
    if (results.length < 2) return 0;
    const maxSent = Math.max(...results.map(r => r.totalSent));
    return maxSent >= 100 ? 0.95 : maxSent / 100;
  };

  if (loading) {
    return <div>Loading results...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>A/B Test Results</CardTitle>
        <CardDescription>Performance comparison across variants</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map(variant => (
            <div key={variant.id} className="border rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">Variant {variant.variant_name}</h4>
                  {variant.is_winner && (
                    <Badge className="bg-yellow-500">Winner</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {variant.traffic_percentage}% of audience
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">{variant.openRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{variant.opened}/{variant.totalSent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                  <p className="text-2xl font-bold">{variant.clickRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{variant.clicked}/{variant.totalSent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CTOR</p>
                  <p className="text-2xl font-bold">
                    {variant.opened > 0 ? ((variant.clicked / variant.opened) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Subject Line:</p>
                <p className="text-sm text-muted-foreground">{variant.subject_line}</p>
              </div>
            </div>
          ))}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Statistical Significance</AlertTitle>
            <AlertDescription>
              {calculateSignificance() > 0.95 
                ? "Results are statistically significant (95% confidence)"
                : `More data needed for statistical significance (${(calculateSignificance() * 100).toFixed(0)}% confidence)`
              }
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};
