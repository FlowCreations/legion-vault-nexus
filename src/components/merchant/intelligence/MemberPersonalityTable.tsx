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
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data: profiles } = await supabase
        .from('personality_profiles')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .order('confidence_score', { ascending: false })
        .limit(50);

      if (profiles) {
        const formatted = profiles.map((p: any) => ({
          user_id: p.user_id,
          email: p.user_profiles.email,
          mbti_type: p.mbti_type,
          confidence_score: p.confidence_score,
          p_e: p.p_e,
          p_i: p.p_i,
          p_s: p.p_s,
          p_n: p.p_n,
          p_t: p.p_t,
          p_f: p.p_f,
          p_j: p.p_j,
          p_p: p.p_p,
          assertiveness: p.assertiveness,
        }));
        setMembers(formatted);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load member personalities');
    } finally {
      setLoading(false);
    }
  };

  const computePersonality = async (userId: string) => {
    try {
      toast.loading('Computing personality...', { id: userId });
      
      // First compute features
      await supabase.functions.invoke('compute-personality-features', {
        body: { userId },
      });

      // Then predict personality
      await supabase.functions.invoke('predict-personality', {
        body: { userId },
      });

      toast.success('Personality computed!', { id: userId });
      loadMembers();
    } catch (error) {
      console.error('Error computing personality:', error);
      toast.error('Failed to compute personality', { id: userId });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Member Personalities</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} profiles computed
          </p>
        </div>
        <Button onClick={loadMembers} variant="outline" size="sm">
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
              <TableHead>E/I</TableHead>
              <TableHead>S/N</TableHead>
              <TableHead>T/F</TableHead>
              <TableHead>J/P</TableHead>
              <TableHead>Assertive</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.user_id}>
                <TableCell className="font-medium">{member.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: getPersonalityColor(member.mbti_type),
                      color: getPersonalityColor(member.mbti_type)
                    }}
                  >
                    {member.mbti_type}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getMBTIDescription(member.mbti_type)}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${member.confidence_score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs">{(member.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={member.p_e > 0.5 ? 'font-semibold' : 'text-muted-foreground'}>
                    {member.p_e > 0.5 ? 'E' : 'I'} {(Math.max(member.p_e, member.p_i) * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={member.p_s > 0.5 ? 'font-semibold' : 'text-muted-foreground'}>
                    {member.p_s > 0.5 ? 'S' : 'N'} {(Math.max(member.p_s, member.p_n) * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={member.p_t > 0.5 ? 'font-semibold' : 'text-muted-foreground'}>
                    {member.p_t > 0.5 ? 'T' : 'F'} {(Math.max(member.p_t, member.p_f) * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={member.p_j > 0.5 ? 'font-semibold' : 'text-muted-foreground'}>
                    {member.p_j > 0.5 ? 'J' : 'P'} {(Math.max(member.p_j, member.p_p) * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={member.assertiveness > 0.5 ? 'font-semibold' : 'text-muted-foreground'}>
                    {(member.assertiveness * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    onClick={() => computePersonality(member.user_id)}
                    variant="ghost"
                    size="sm"
                  >
                    Recompute
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
