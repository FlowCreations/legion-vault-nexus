import { useState } from "react";
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
    <Card className="border-2 bg-gradient-to-br from-emerald-500/10 to-background" style={{ borderColor: '#10b98133' }}>
      <CardHeader>
        <div className="flex items-center justify-end">
          <Button
            onClick={triggerOracle}
            disabled={loading}
            size="lg"
            style={{
              background: loading ? undefined : 'linear-gradient(to right, #10b981, #059669)',
            }}
            className="text-white hover:brightness-110 shadow-lg w-48"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reading...
              </>
            ) : (
              <>
                <span className="mr-2 text-lg">✨</span>
                Oracle
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {insight && (
        <CardContent>
          <div className="p-6 bg-background/50 rounded-lg border border-primary/20">
            <p className="text-lg font-medium leading-relaxed">
              {insight}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Strategic insight designed to change your next 24 hours
          </p>
        </CardContent>
      )}
    </Card>
  );
};
