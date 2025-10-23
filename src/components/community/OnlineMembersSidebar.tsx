import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTierColor } from "@/lib/tierColors";
import { Users } from "lucide-react";

interface OnlineMember {
  user_id: string;
  display_name: string;
  avatar_url: string;
  tier: string;
  last_active_at: string;
}

export const OnlineMembersSidebar = () => {
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializePresence();
    fetchOnlineMembers();

    // Update own presence every 30 seconds
    const presenceInterval = setInterval(updatePresence, 30000);

    // Fetch online members every 60 seconds
    const fetchInterval = setInterval(fetchOnlineMembers, 60000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('online-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: 'is_online=eq.true'
        },
        () => fetchOnlineMembers()
      )
      .subscribe();

    return () => {
      clearInterval(presenceInterval);
      clearInterval(fetchInterval);
      supabase.removeChannel(channel);
      setOffline();
    };
  }, []);

  const initializePresence = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      await updatePresence();
    }
  };

  const updatePresence = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_profiles')
      .update({
        is_online: true,
        last_active_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
  };

  const setOffline = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_profiles')
      .update({ is_online: false })
      .eq('user_id', user.id);
  };

  const fetchOnlineMembers = async () => {
    // Consider users online if active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, tier, last_active_at')
      .eq('is_online', true)
      .gte('last_active_at', fiveMinutesAgo)
      .order('last_active_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setOnlineMembers(data as OnlineMember[]);
    }
  };

  const handleMemberClick = (memberId: string) => {
    console.log('Open DM with:', memberId);
    // TODO: Implement direct message functionality
  };

  if (onlineMembers.length === 0) {
    return null;
  }

  return (
    <div className="hidden xl:block fixed right-4 top-24 w-16 bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-2 shadow-lg z-40">
      <div className="flex flex-col items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-primary" />
        <Badge variant="secondary" className="text-xs">
          {onlineMembers.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="flex flex-col gap-2">
          <TooltipProvider>
            {onlineMembers.map((member) => (
              <Tooltip key={member.user_id}>
                <TooltipTrigger asChild>
                  <div
                    className="relative cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleMemberClick(member.user_id)}
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary/30">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.display_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="flex flex-col gap-1">
                  <p className="font-semibold">{member.display_name}</p>
                  <Badge
                    className={`${getTierColor(member.tier)} text-xs`}
                  >
                    {member.tier || 'Free Member'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Click to message</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  );
};
