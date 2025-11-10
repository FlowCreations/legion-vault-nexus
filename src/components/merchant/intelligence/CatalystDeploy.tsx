import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, Rocket, Users, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeploymentSummary {
  totalProfiles: number;
  segmentation: {
    observe: number;
    nurture: number;
    trigger: number;
  };
  deploymentsScheduled: number;
  campaignsActivated: number;
  nextScheduledRun: string;
}

export const CatalystDeploy = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DeploymentSummary | null>(null);

  const deployCatalyst = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('catalyst-deploy');
      
      if (error) throw error;
      
      setSummary(data.summary);
      toast.success(`🚀 Catalyst deployed! ${data.summary.deploymentsScheduled} campaigns scheduled`);
    } catch (error: any) {
      console.error('Error deploying catalyst:', error);
      toast.error(error.message || "Failed to deploy catalyst");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Rocket className="h-6 w-6 text-emerald-500" />
              Catalyst
            </CardTitle>
            <CardDescription className="mt-2">
              Turn insight into action. Automate personalized campaigns across your entire fanbase.
            </CardDescription>
          </div>
          <Button
            onClick={deployCatalyst}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Deploy Catalyst
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {!summary && !loading && (
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <Zap className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Ready to Deploy</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Press the button above to analyze your entire fanbase and deploy personalized campaigns based on Oracle predictions and Epiphany insights.
            </p>
          </div>
        </CardContent>
      )}

      {summary && (
        <CardContent className="space-y-6">
          {/* Segmentation Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-red-500" />
                <div className="text-sm font-medium text-red-500">Observe</div>
              </div>
              <div className="text-2xl font-bold">{summary.segmentation.observe}</div>
              <div className="text-xs text-muted-foreground">PTP 0-49</div>
            </div>
            
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-yellow-500" />
                <div className="text-sm font-medium text-yellow-500">Nurture</div>
              </div>
              <div className="text-2xl font-bold">{summary.segmentation.nurture}</div>
              <div className="text-xs text-muted-foreground">PTP 50-79</div>
            </div>
            
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="text-sm font-medium text-green-500">Trigger</div>
              </div>
              <div className="text-2xl font-bold">{summary.segmentation.trigger}</div>
              <div className="text-xs text-muted-foreground">PTP 80-100</div>
            </div>
          </div>

          {/* Deployment Stats */}
          <div className="p-6 bg-background/50 rounded-lg border border-emerald-500/20">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-emerald-600">{summary.deploymentsScheduled}</div>
                <div className="text-sm text-muted-foreground">Campaigns Scheduled</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">{summary.totalProfiles}</div>
                <div className="text-sm text-muted-foreground">Members Analyzed</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Next scheduled run: {new Date(summary.nextScheduledRun).toLocaleString()}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            AI-powered campaigns deployed based on Oracle predictions and Epiphany insights
          </p>
        </CardContent>
      )}
    </Card>
  );
};
