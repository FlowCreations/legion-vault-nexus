import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, Brain, TrendingUp, Users, ShoppingCart, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Database as DatabaseTypes } from "@/integrations/supabase/types";

type BehavioralSnapshot = DatabaseTypes['public']['Tables']['behavioral_data_snapshots']['Row'];

export const DataInsights = () => {
  const [snapshot, setSnapshot] = useState<BehavioralSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestSnapshot();
  }, []);

  const loadLatestSnapshot = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('behavioral_data_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setSnapshot(data);
    } catch (error) {
      console.error('Error loading snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-96 w-full" />
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Data Snapshots Yet</h3>
          <p className="text-sm text-muted-foreground">
            Behavioral data snapshots are generated daily to power your insights
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Data Behind the Data</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Raw behavioral metrics and calculations powering your analytics
        </p>
      </div>

      <Tabs defaultValue="journey" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="journey">Journey Stages</TabsTrigger>
          <TabsTrigger value="scores">PTP/ERA Scores</TabsTrigger>
          <TabsTrigger value="behavior">Behavioral Signals</TabsTrigger>
          <TabsTrigger value="commerce">Commerce Data</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Member Journey Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">{snapshot.discover_count}</div>
                <div className="text-sm text-muted-foreground">Discover Phase</div>
                <p className="text-xs text-muted-foreground">Browsing, exploring</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">{snapshot.engage_count}</div>
                <div className="text-sm text-muted-foreground">Engage Phase</div>
                <p className="text-xs text-muted-foreground">Commenting, sharing</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">{snapshot.invest_count}</div>
                <div className="text-sm text-muted-foreground">Invest Phase</div>
                <p className="text-xs text-muted-foreground">First purchase made</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">{snapshot.loyal_count}</div>
                <div className="text-sm text-muted-foreground">Loyal Phase</div>
                <p className="text-xs text-muted-foreground">6+ months active</p>
              </div>
            </div>

            {Object.keys(snapshot.journey_transitions || {}).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Recent Transitions</h4>
                <div className="text-xs bg-muted p-3 rounded font-mono">
                  {JSON.stringify(snapshot.journey_transitions, null, 2)}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              PTP & ERA Calculations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold">{snapshot.avg_ptp_score?.toFixed(0) || 0}</div>
                <div className="text-sm text-muted-foreground">Avg PTP Score</div>
                <p className="text-xs text-muted-foreground">Prime to Purchase readiness</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{snapshot.avg_era_score?.toFixed(0) || 0}</div>
                <div className="text-sm text-muted-foreground">Avg ERA Score</div>
                <p className="text-xs text-muted-foreground">Engagement & retention</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">{snapshot.high_ptp_count}</div>
                <div className="text-sm text-muted-foreground">High PTP Members</div>
                <p className="text-xs text-muted-foreground">Ready to convert</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">PTP Calculation Factors</h4>
                <div className="text-xs bg-muted p-3 rounded font-mono max-h-48 overflow-auto">
                  {JSON.stringify(snapshot.ptp_calculation_details || {
                    note: "Calculated from: session frequency, cart activity, content engagement, time on site, search behavior"
                  }, null, 2)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">ERA Calculation Factors</h4>
                <div className="text-xs bg-muted p-3 rounded font-mono max-h-48 overflow-auto">
                  {JSON.stringify(snapshot.era_calculation_details || {
                    note: "Calculated from: engagement frequency, recency, actions variety, social interactions, content consumption"
                  }, null, 2)}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Behavioral Signals
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{snapshot.total_searches}</div>
                <div className="text-sm text-muted-foreground">Total Searches</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{snapshot.total_comments}</div>
                <div className="text-sm text-muted-foreground">Comments</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{snapshot.total_messages}</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{snapshot.total_shares}</div>
                <div className="text-sm text-muted-foreground">Shares</div>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <div className="text-2xl font-bold">{Math.floor((snapshot.avg_session_duration_sec || 0) / 60)}m</div>
              <div className="text-sm text-muted-foreground">Avg Session Duration</div>
            </div>

            {Array.isArray(snapshot.top_search_terms) && snapshot.top_search_terms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Top Search Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {snapshot.top_search_terms.slice(0, 10).map((term: any, i: number) => (
                    <Badge key={i} variant="secondary">
                      {typeof term === 'object' ? (term.term || '') : term} {term.count && `(${term.count})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="commerce" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Commerce Signals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">{snapshot.cart_additions}</div>
                <div className="text-sm text-muted-foreground">Cart Additions</div>
                <p className="text-xs text-muted-foreground">Items added to cart</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-600">{snapshot.cart_abandonments}</div>
                <div className="text-sm text-muted-foreground">Cart Abandonments</div>
                <p className="text-xs text-muted-foreground">Carts not completed</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">{snapshot.purchases}</div>
                <div className="text-sm text-muted-foreground">Purchases</div>
                <p className="text-xs text-muted-foreground">Completed transactions</p>
              </div>
            </div>

            {snapshot.cart_additions > 0 && (
              <div className="mt-6">
                <div className="text-sm text-muted-foreground mb-2">Conversion Rate</div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {((snapshot.purchases / snapshot.cart_additions) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {snapshot.purchases} purchases / {snapshot.cart_additions} cart adds
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-4">
          <Database className="w-8 h-8 text-primary flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold">Monthly AI Reports</h3>
            <p className="text-sm text-muted-foreground">
              This raw data powers your monthly AI-generated reports, providing deep insights into fan behavior, 
              conversion patterns, and engagement trends. Export this data or schedule monthly reports based on your subscription tier.
            </p>
            <Badge variant="outline" className="mt-2">
              Last updated: {new Date(snapshot.snapshot_date).toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};