import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OracleInsight = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const triggerOracle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-oracle-insight');
      
      if (error) throw error;
      
      setInsight(data.insight);
      toast.success("Oracle insight generated");
    } catch (error: any) {
      console.error('Error generating oracle insight:', error);
      toast.error(error.message || "Failed to generate oracle insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 bg-gradient-to-br from-emerald-500/10 to-background animate-fade-in" style={{ borderColor: '#10b98133' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          Oracle Insight
        </CardTitle>
        <CardDescription>
          Generate strategic revenue predictions to guide your next 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insight && !loading && (
          <Button 
            onClick={triggerOracle}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Oracle Insight
          </Button>
        )}
        
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}
        
        {insight && (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 rounded-lg border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <p className="text-lg font-medium leading-relaxed text-foreground">
                {insight}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Strategic insight designed to change your next 24 hours
            </p>
            <Button 
              onClick={triggerOracle}
              variant="outline"
              className="w-full"
            >
              Generate New Insight
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
