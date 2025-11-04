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
              <div className="relative">
                <Heart className="h-6 w-6 text-amber-500" />
                <Zap className="h-3 w-3 text-amber-300 absolute -top-1 -right-1" />
              </div>
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
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Channeling...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Trigger Epiphany
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
