import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NextBestAction } from "@/types/personality";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Globe, Bell, RefreshCw, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const channelIcons = {
  email: Mail,
  dm: MessageSquare,
  site: Globe,
  push: Bell,
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export const NBAQueue = () => {
  const [nbas, setNbas] = useState<NextBestAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fetchNBAs = async () => {
    try {
      const { data, error } = await supabase
        .from("next_best_actions" as any)
        .select(`
          *,
          user_profiles!inner(email, full_name, display_name, heartbeat_member_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNbas((data as any) || []);
    } catch (error) {
      console.error("Error fetching NBAs:", error);
      toast({
        title: "Error",
        description: "Failed to load next best actions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNBA = async (userId?: string) => {
    setIsGenerating(true);
    try {
      // If no userId, get a random user with personality profile but no recent NBA
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: profiles } = await supabase
          .from("personality_profiles")
          .select("user_id")
          .limit(1);
        
        if (profiles && profiles.length > 0) {
          targetUserId = profiles[0].user_id;
        }
      }

      if (!targetUserId) {
        toast({
          title: "No Users Found",
          description: "No users with personality profiles found",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-next-best-action", {
        body: { userId: targetUserId },
      });

      if (error) throw error;

      toast({
        title: "NBA Generated",
        description: "Next best action created successfully",
      });
      
      fetchNBAs();
    } catch (error) {
      console.error("Error generating NBA:", error);
      toast({
        title: "Error",
        description: "Failed to generate next best action",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateNBAStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "sent") {
        updates.sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("next_best_actions" as any)
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `NBA marked as ${status}`,
      });
      
      fetchNBAs();
    } catch (error) {
      console.error("Error updating NBA:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNBAs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("nba-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "next_best_actions",
        },
        () => {
          fetchNBAs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Live NBA Queue
            </CardTitle>
            <CardDescription>
              AI-generated next-best-actions for personalized member engagement
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNBAs()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => generateNBA()}
              disabled={isGenerating}
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate NBA
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading NBAs...
            </div>
          ) : nbas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No next-best-actions yet. Generate one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {nbas.map((nba) => {
                const ChannelIcon = channelIcons[nba.channel as keyof typeof channelIcons] || Globe;
                const recipe = nba.message_recipe as any;
                
                return (
                  <Card key={nba.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {(nba as any).user_profiles?.email || 
                               (nba as any).user_profiles?.display_name || 
                               (nba as any).user_profiles?.heartbeat_member_id?.slice(0, 8) || 
                               "Unknown User"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusColors[nba.status as keyof typeof statusColors]}>
                              {nba.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {nba.offer_id && `Offer: ${nba.offer_id}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {nba.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateNBAStatus(nba.id, "sent")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateNBAStatus(nba.id, "failed")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recipe && (
                        <>
                          <div>
                            <p className="text-sm font-medium mb-1">Subject</p>
                            <p className="text-sm text-muted-foreground">{recipe.subject}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Opener</p>
                            <p className="text-sm text-muted-foreground">{recipe.opener}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Body</p>
                            <p className="text-sm text-muted-foreground">{recipe.body}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Call to Action</p>
                            <p className="text-sm text-primary font-medium">{recipe.cta}</p>
                          </div>
                          {recipe.timing && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Best time: {recipe.timing}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(nba.created_at))} ago
                        </span>
                        {nba.predicted_conversion_rate && (
                          <Badge variant="secondary">
                            {(nba.predicted_conversion_rate * 100).toFixed(1)}% conversion
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
