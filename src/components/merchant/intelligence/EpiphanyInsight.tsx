import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const EpiphanyInsight = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const triggerEpiphany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-epiphany-insight');
      
      if (error) throw error;
      
      setInsight(data.insight);
      toast.success("Epiphany revealed");
    } catch (error: any) {
      console.error('Error generating epiphany insight:', error);
      toast.error(error.message || "Failed to generate epiphany insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Epiphany
            </CardTitle>
            <CardDescription className="mt-2">
              Turn emotion into revelation.
            </CardDescription>
          </div>
          <Button
            onClick={triggerEpiphany}
            disabled={loading}
            size="lg"
            style={{
              background: loading ? undefined : 'linear-gradient(to right, #ec4899, #db2777)',
            }}
            className="text-white hover:brightness-110 shadow-lg w-48"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reflecting...
              </>
            ) : (
              <>
                <span className="mr-2 text-lg">💡</span>
                Epiphany
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {insight && (
        <CardContent>
          <div className="p-6 bg-background/50 rounded-lg border border-amber-500/20 animate-pulse-subtle">
            <p className="text-lg font-medium leading-relaxed italic">
              {insight}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            An emotional breakthrough to deepen your connection
          </p>
        </CardContent>
      )}
    </Card>
  );
};
