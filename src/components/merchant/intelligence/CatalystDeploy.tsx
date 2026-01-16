import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, Rocket, Users, Mail, TrendingUp, RefreshCw } from "lucide-react";
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

const CACHE_KEY = 'catalyst_deploy_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedSummary {
  summary: DeploymentSummary;
  timestamp: number;
}

const getCachedSummary = (): DeploymentSummary | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedSummary = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.summary;
  } catch {
    return null;
  }
};

const setCachedSummary = (summary: DeploymentSummary) => {
  try {
    const cacheData: CachedSummary = { summary, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore storage errors
  }
};

export const CatalystDeploy = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DeploymentSummary | null>(null);

  // Load cached summary on mount
  useEffect(() => {
    const cached = getCachedSummary();
    if (cached) {
      setSummary(cached);
    }
  }, []);

  const deployCatalyst = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('catalyst-deploy');
      
      if (error) throw error;
      
      setSummary(data.summary);
      setCachedSummary(data.summary);
      toast.success(`🚀 Catalyst deployed! ${data.summary.deploymentsScheduled} campaigns scheduled`);
    } catch (error: any) {
      console.error('Error deploying catalyst:', error);
      // Keep existing summary on error
      if (!summary) {
        toast.error(error.message || "Failed to deploy catalyst");
      } else {
        toast.error("Failed to redeploy - showing last deployment");
      }
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
        
        {summary && !loading && (
          <div className="space-y-6">
            {/* Segmentation Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-600 rounded-lg border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-white" />
                  <div className="text-sm font-medium text-white">Observe</div>
                </div>
                <div className="text-2xl font-bold text-white">{summary.segmentation.observe}</div>
                <div className="text-xs text-white/80">PTP 0-49</div>
              </div>
              
              <div className="p-4 bg-blue-600 rounded-lg border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-white" />
                  <div className="text-sm font-medium text-white">Nurture</div>
                </div>
                <div className="text-2xl font-bold text-white">{summary.segmentation.nurture}</div>
                <div className="text-xs text-white/80">PTP 50-79</div>
              </div>
              
              <div className="p-4 bg-blue-600 rounded-lg border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                  <div className="text-sm font-medium text-white">Trigger</div>
                </div>
                <div className="text-2xl font-bold text-white">{summary.segmentation.trigger}</div>
                <div className="text-xs text-white/80">PTP 80-100</div>
              </div>
            </div>

            {/* Deployment Stats */}
            <div className="p-6 bg-blue-600 rounded-lg border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white">{summary.deploymentsScheduled}</div>
                  <div className="text-sm text-white/80">Campaigns Scheduled</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{summary.totalProfiles}</div>
                  <div className="text-sm text-white/80">Members Analyzed</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-sm text-white/80">
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
              <RefreshCw className="mr-2 h-4 w-4" />
              Deploy Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
