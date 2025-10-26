import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ListPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterRules: any;
}

export const ListPreview = ({ open, onOpenChange, filterRules }: ListPreviewProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, filterRules]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('query-list-members', {
        body: { filterRules, limit: 50 }
      });
      if (error) throw error;
      setMembers(data.members || []);
    } catch (error: any) {
      toast.error("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List Preview (First 50 Members)</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No members match these filters
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>PTP</TableHead>
                <TableHead>ERA</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">{member.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={member.ptp_status === 'Hot' ? 'default' : 'secondary'}>
                      {member.ptp_current || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.era_label || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>${(member.total_spend || 0).toFixed(2)}</TableCell>
                  <TableCell>{member.subscription_tier || 'Free'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
