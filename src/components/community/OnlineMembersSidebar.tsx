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
  is_online: boolean;
}

interface OnlineMembersSidebarProps {
  onMemberClick: (member: { id: string; name: string; avatar: string }) => void;
}

// Mock online/offline members for demo
const mockMembers: OnlineMember[] = [
  {
    user_id: "mock_1",
    display_name: "Sarah Johnson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    tier: "Legion Elite",
    last_active_at: new Date().toISOString(),
    is_online: true
  },
  {
    user_id: "mock_2",
    display_name: "Mike Chen",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    tier: "Legion Member",
    last_active_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    is_online: false
  },
  {
    user_id: "mock_3",
    display_name: "Emily Rodriguez",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    tier: "Legion Elite",
    last_active_at: new Date().toISOString(),
    is_online: true
  },
  {
    user_id: "mock_4",
    display_name: "David Kim",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    tier: "Legion VIP",
    last_active_at: new Date().toISOString(),
    is_online: true
  },
  {
    user_id: "mock_5",
    display_name: "Jessica Martinez",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
    tier: "Free Member",
    last_active_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    is_online: false
  },
  {
    user_id: "mock_6",
    display_name: "Robert Taylor",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
    tier: "Legion Member",
    last_active_at: new Date().toISOString(),
    is_online: true
  },
  {
    user_id: "mock_7",
    display_name: "Amanda White",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda",
    tier: "Legion VIP",
    last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_online: false
  },
  {
    user_id: "mock_8",
    display_name: "Chris Anderson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
    tier: "Legion Elite",
    last_active_at: new Date().toISOString(),
    is_online: true
  }
];

export const OnlineMembersSidebar = ({ onMemberClick }: OnlineMembersSidebarProps) => {
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [allMembers, setAllMembers] = useState<OnlineMember[]>([]);
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
      .select('user_id, display_name, avatar_url, tier, last_active_at, is_online')
      .eq('is_online', true)
      .gte('last_active_at', fiveMinutesAgo)
      .order('last_active_at', { ascending: false })
      .limit(50);

    const realMembers = (data || []) as OnlineMember[];
    
    // Combine real members with mock members
    const combined = [...realMembers, ...mockMembers];
    
    // Split into online and offline
    const online = combined.filter(m => m.is_online);
    const offline = combined.filter(m => !m.is_online);
    
    setOnlineMembers(online);
    setAllMembers(combined);
  };

  const handleMemberClick = (member: OnlineMember) => {
    onMemberClick({
      id: member.user_id,
      name: member.display_name,
      avatar: member.avatar_url
    });
  };

  return (
    <div className="hidden xl:block fixed right-4 top-[136px] w-20 bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-3 shadow-lg z-40">
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
                      {member.tier || 'Free Member'}
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
                        {member.tier || 'Free Member'}
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
