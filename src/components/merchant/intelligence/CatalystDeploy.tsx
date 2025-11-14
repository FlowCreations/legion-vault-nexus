import { useState, useEffect } from "react";
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
    <Card className="border-2 bg-gradient-to-br from-blue-500/10 to-background animate-fade-in" style={{ borderColor: '#3b82f633' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-blue-500" />
          Catalyst Deploy
        </CardTitle>
        <CardDescription>
          Deploy AI-powered campaigns based on Oracle predictions and Epiphany insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && !loading && (
          <Button 
            onClick={deployCatalyst}
            className="w-full"
            size="lg"
          >
            <Zap className="mr-2 h-4 w-4" />
            Deploy Catalyst
          </Button>
        )}
        
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        
        {summary && (
          <div className="space-y-6">
            {/* Segmentation Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 rounded-lg border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-red-500" />
                  <div className="text-sm font-medium text-red-500">Observe</div>
                </div>
                <div className="text-2xl font-bold">{summary.segmentation.observe}</div>
                <div className="text-xs text-muted-foreground">PTP 0-49</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-yellow-50/50 to-amber-100/30 dark:from-yellow-950/20 dark:to-amber-900/10 rounded-lg border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-yellow-500" />
                  <div className="text-sm font-medium text-yellow-500">Nurture</div>
                </div>
                <div className="text-2xl font-bold">{summary.segmentation.nurture}</div>
                <div className="text-xs text-muted-foreground">PTP 50-79</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50/50 to-emerald-100/30 dark:from-green-950/20 dark:to-emerald-900/10 rounded-lg border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div className="text-sm font-medium text-green-500">Trigger</div>
                </div>
                <div className="text-2xl font-bold">{summary.segmentation.trigger}</div>
                <div className="text-xs text-muted-foreground">PTP 80-100</div>
              </div>
            </div>

            {/* Deployment Stats */}
            <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10 rounded-lg border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.deploymentsScheduled}</div>
                  <div className="text-sm text-muted-foreground">Campaigns Scheduled</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalProfiles}</div>
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
            
            <Button 
              onClick={deployCatalyst}
              variant="outline"
              className="w-full"
            >
              Deploy Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
