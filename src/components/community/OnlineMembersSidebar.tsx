import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTierColor } from "@/lib/tierColors";
import { Users } from "lucide-react";

interface OnlineMember {
  id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string;
  tier: string;
  last_active_at: string;
  is_online: boolean;
}

interface OnlineMembersSidebarProps {
  onMemberClick: (member: { id: string; name: string; avatar: string }) => void;
}

export const OnlineMembersSidebar = ({ onMemberClick }: OnlineMembersSidebarProps) => {
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [allMembers, setAllMembers] = useState<OnlineMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializePresence();
    fetchOnlineMembers();

    // Update own presence every 60 seconds (reduced from 30s)
    const presenceInterval = setInterval(updatePresence, 60000);

    // Fetch online members every 2 minutes (reduced from 60s)
    const fetchInterval = setInterval(fetchOnlineMembers, 120000);

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
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name, avatar_url, tier, last_active_at, is_online')
      .eq('is_online', true)
      .not('display_name', 'is', null)
      .not('avatar_url', 'is', null)
      .order('last_active_at', { ascending: false })
      .limit(25);

    let members = (data || []) as OnlineMember[];
    
    // Filter out current user if they have a user_id
    if (user) {
      members = members.filter(m => m.user_id !== user.id);
    }
    
    setOnlineMembers(members);
    setAllMembers(members);
  };

  const handleMemberClick = (member: OnlineMember) => {
    onMemberClick({
      id: member.user_id || member.id,
      name: member.display_name,
      avatar: member.avatar_url
    });
  };

  return (
    <div className="hidden xl:block fixed right-4 top-[172px] w-20 bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-3 shadow-lg z-40">
      <div className="flex flex-col items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-primary" />
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {onlineMembers.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="flex flex-col gap-3">
          <TooltipProvider>
            {/* Online Members */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wide">
                Online
              </p>
              {onlineMembers.map((member) => (
                <Tooltip key={member.user_id}>
                  <TooltipTrigger asChild>
                    <div
                      className="relative cursor-pointer hover:scale-110 transition-transform mx-auto"
                      onClick={() => handleMemberClick(member)}
                    >
                      <Avatar className="w-11 h-11 border-2 border-primary/30">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.display_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="flex flex-col gap-1">
                    <p className="font-semibold">{member.display_name}</p>
                    <Badge className={`${getTierColor(member.tier)} text-xs`}>
                      {member.tier || 'Free'}
                    </Badge>
                    <p className="text-xs text-green-500">● Online</p>
                    <p className="text-xs text-muted-foreground">Click to message</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Offline Members */}
            {allMembers.filter(m => !m.is_online).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wide">
                  Offline
                </p>
                {allMembers.filter(m => !m.is_online).slice(0, 5).map((member) => (
                  <Tooltip key={member.user_id}>
                    <TooltipTrigger asChild>
                      <div
                        className="relative cursor-pointer hover:scale-110 transition-transform mx-auto opacity-60 hover:opacity-100"
                        onClick={() => handleMemberClick(member)}
                      >
                        <Avatar className="w-11 h-11 border-2 border-muted/30">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.display_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-muted-foreground rounded-full border-2 border-background" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="flex flex-col gap-1">
                      <p className="font-semibold">{member.display_name}</p>
                      <Badge className={`${getTierColor(member.tier)} text-xs`}>
                        {member.tier || 'Free'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">● Offline</p>
                      <p className="text-xs text-muted-foreground">Click to message</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </TooltipProvider>
        </div>
      </ScrollArea>
    </div>
  );
};
