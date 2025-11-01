import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PersonalityProfile } from "@/types/personality";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getMBTIDescription, getPersonalityColor } from "@/lib/personalityRules";

interface MemberPersonality {
  user_id: string;
  email: string;
  mbti_type: string;
  confidence_score: number;
  p_e: number;
  p_i: number;
  p_s: number;
  p_n: number;
  p_t: number;
  p_f: number;
  p_j: number;
  p_p: number;
  assertiveness: number;
}

export const MemberPersonalityTable = () => {
  const [members, setMembers] = useState<MemberPersonality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personality_profiles')
        .select(`
          user_id,
          mbti_type,
          confidence_score,
          p_e, p_i, p_s, p_n, p_t, p_f, p_j, p_p,
          assertiveness
        `)
        .not('mbti_type', 'is', null)
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users via RPC or direct query
      const userIds = data?.map(p => p.user_id) || [];
      
      // Query user_profiles for any available user info
      const emailMap = new Map<string, string>();
      for (const userId of userIds) {
        const { data: authData } = await supabase.auth.admin.getUserById(userId);
        if (authData?.user?.email) {
          emailMap.set(userId, authData.user.email);
        }
      }

      const membersData = data?.map(p => ({
        ...p,
        email: emailMap.get(p.user_id) || 'Unknown'
      })) || [];

      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching personalities:', error);
      toast.error('Failed to load personality data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Member Personalities</h3>
            <p className="text-sm text-muted-foreground">
              MBTI profiles computed from surveys and behavior
            </p>
          </div>
          <Button onClick={fetchMembers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No personality profiles yet. Encourage members to complete the survey!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Member Personalities</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} with personality profiles
          </p>
        </div>
        <Button onClick={fetchMembers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>MBTI Type</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-center">E/I</TableHead>
              <TableHead className="text-center">S/N</TableHead>
              <TableHead className="text-center">T/F</TableHead>
              <TableHead className="text-center">J/P</TableHead>
              <TableHead className="text-center">Assertiveness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.user_id}>
                <TableCell className="font-medium">{member.email}</TableCell>
                <TableCell>
                  <Badge 
                    style={{ 
                      backgroundColor: getPersonalityColor(member.mbti_type),
                      color: 'white'
                    }}
                  >
                    {member.mbti_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={member.confidence_score >= 0.7 ? 'default' : 'secondary'}>
                    {Math.round(member.confidence_score * 100)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm">
                  {Math.round(member.p_e * 100)}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {Math.round(member.p_s * 100)}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {Math.round(member.p_t * 100)}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {Math.round(member.p_j * 100)}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {Math.round(member.assertiveness * 100)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

