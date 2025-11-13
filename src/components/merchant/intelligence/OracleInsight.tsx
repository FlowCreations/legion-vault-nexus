import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OracleInsight = () => {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
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

    triggerOracle();
  }, []);

  return (
    <Card className="border-2 bg-gradient-to-br from-emerald-500/10 to-background" style={{ borderColor: '#10b98133' }}>
      {loading ? (
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
            <p className="text-lg font-medium text-muted-foreground">Reading...</p>
          </div>
        </CardContent>
      ) : insight ? (
        <CardContent className="animate-fade-in py-8">
          <div className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 rounded-lg border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {insight}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Strategic insight designed to change your next 24 hours
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
};
