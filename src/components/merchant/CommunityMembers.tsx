import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CommunityMember {
  id: string;
  user_id: string | null;
  heartbeat_member_id: string | null;
  display_name: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tier: string | null;
  membership_tier: string | null;
  created_at: string;
  last_active_at: string | null;
  total_spend: number;
}

interface CommunityMembersProps {
  selectedUserId?: string | null;
}

export function CommunityMembers({ selectedUserId }: CommunityMembersProps) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, tierFilter, members]);

  // Scroll to selected user if provided
  useEffect(() => {
    if (selectedUserId && members.length > 0) {
      setTimeout(() => {
        const memberRow = document.querySelector(`[data-user-id="${selectedUserId}"]`);
        if (memberRow) {
          memberRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [selectedUserId, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({ title: "Error loading members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tier
    if (tierFilter !== "all") {
      filtered = filtered.filter(member => {
        const memberTier = (member.membership_tier || member.tier || "FREE").toLowerCase();
        return memberTier.includes(tierFilter.toLowerCase());
      });
    }

    setFilteredMembers(filtered);
  };

  const getTierBadge = (tier: string | null) => {
    const tierName = tier || "FREE";
    const colors: Record<string, string> = {
      "Legionnaires": "bg-yellow-500 text-black border-yellow-600",
      "Outlaws": "bg-orange-500 text-white border-orange-600",
      "Rebels": "bg-blue-500 text-white border-blue-600",
      "FREE": "bg-muted text-muted-foreground border-muted-foreground/20",
    };

    return (
      <Badge className={`${colors[tierName] || colors.FREE} font-semibold`}>
        {tierName}
      </Badge>
    );
  };

  const getStatusBadge = (lastActive: string | null) => {
    if (!lastActive) return <Badge variant="outline">Never Active</Badge>;
    
    const lastActiveDate = new Date(lastActive);
    const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) {
      return <Badge className="bg-green-500 text-white">Active Now</Badge>;
    } else if (hoursSinceActive < 24) {
      return <Badge className="bg-green-500/70 text-white">Active Today</Badge>;
    } else if (hoursSinceActive < 168) {
      return <Badge variant="outline">Active This Week</Badge>;
    } else {
      return <Badge variant="outline">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Community Members
              </CardTitle>
              <CardDescription>
                {filteredMembers.length} of {members.length} members
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Legionnaires">Legionnaires</SelectItem>
                <SelectItem value="Outlaws">Outlaws</SelectItem>
                <SelectItem value="Rebels">Rebels</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Table - Optimized with React.memo */}
          <div className="border rounded-lg max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[300px]">Member</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow 
                      key={member.id} 
                      data-user-id={member.user_id}
                      className={member.user_id === selectedUserId ? 'bg-primary/20' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.display_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{member.display_name || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email || member.full_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{member.location || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {getTierBadge(member.membership_tier || member.tier)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(member.last_active_at)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${member.total_spend?.toFixed(2) || "0.00"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
