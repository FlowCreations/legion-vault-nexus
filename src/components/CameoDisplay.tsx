import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cameo } from "@/types/cameo";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { X, Gift, Sparkles } from "lucide-react";
import { formatCameoDate } from "@/utils/cameoHelpers";

export const CameoDisplay = () => {
  const [cameo, setCameo] = useState<Cameo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveCameo();
  }, []);

  const fetchActiveCameo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('cameos')
        .select('*')
        .eq('status', 'active')
        .or(`recipient_user_id.eq.${user?.id || ''},recipient_manual_name.not.is.null`)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching cameo:', error);
        return;
      }

      if (data) {
        setCameo(data as Cameo);
        // Track view
        await trackView(data.id, data.display_duration);
      }
    } catch (error) {
      console.error('Error in fetchActiveCameo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackView = async (cameoId: string, displayDuration: string) => {
    try {
      // Get current view count
      const { data: currentCameo } = await supabase
        .from('cameos')
        .select('view_count')
        .eq('id', cameoId)
        .single();

      // Increment view count
      await supabase
        .from('cameos')
        .update({ 
          view_count: (currentCameo?.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
          ...(displayDuration === 'show_once' && { status: 'viewed' })
        })
        .eq('id', cameoId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (cameo?.id) {
      sessionStorage.setItem(`cameo_dismissed_${cameo.id}`, 'true');
    }
  };

  if (isLoading || !cameo || isDismissed) {
    return null;
  }

  // Check if dismissed in session
  if (sessionStorage.getItem(`cameo_dismissed_${cameo.id}`)) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in mb-8">
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                You have a special message!
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {cameo.message_type === 'video' && cameo.video_url && (
              <div className="rounded-lg overflow-hidden aspect-video bg-muted">
                <video
                  src={cameo.video_url}
                  poster={cameo.video_thumbnail_url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {cameo.message_text && (
              <div className="prose prose-sm max-w-none">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                  {cameo.message_text}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                From <span className="font-semibold text-foreground">Sons of Legion</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCameoDate(cameo.created_at)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
