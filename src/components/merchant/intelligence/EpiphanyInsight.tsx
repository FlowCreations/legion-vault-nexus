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
    <Card className="border-2 bg-gradient-to-br from-pink-500/10 to-background animate-fade-in" style={{ borderColor: '#ec489933' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Epiphany Insight
        </CardTitle>
        <CardDescription>
          Reveal an emotional breakthrough to deepen your connection with your community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insight && !loading && (
          <Button 
            onClick={triggerEpiphany}
            className="w-full"
            size="lg"
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate Epiphany
          </Button>
        )}
        
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        )}
        
        {insight && (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 rounded-lg border border-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.15)]">
              <p className="text-lg font-medium leading-relaxed italic text-foreground">
                {insight}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              An emotional breakthrough to deepen your connection
            </p>
            <Button 
              onClick={triggerEpiphany}
              variant="outline"
              className="w-full"
            >
              Generate New Epiphany
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
