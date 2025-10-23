import { Cameo } from "@/types/cameo";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Video, FileText, Clock } from "lucide-react";
import { formatCameoDate, getCameoStatusColor, getCameoStatusLabel, truncateText } from "@/utils/cameoHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CameoHistoryProps {
  cameos: Cameo[];
  onRefresh: () => void;
}

export const CameoHistory = ({ cameos, onRefresh }: CameoHistoryProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cameo?")) return;

    try {
      const { error } = await supabase
        .from('cameos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cameo deleted",
        description: "The cameo has been removed successfully",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cameo",
        variant: "destructive",
      });
    }
  };

  if (cameos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No cameos found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cameos.map((cameo) => (
            <TableRow key={cameo.id}>
              <TableCell className="font-medium">
                {cameo.recipient_manual_name || "User"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1">
                  {cameo.message_type === "video" ? (
                    <Video className="w-3 h-3" />
                  ) : cameo.message_type === "scheduled" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  {cameo.message_type}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                {cameo.message_text && (
                  <p className="text-sm text-muted-foreground">
                    {truncateText(cameo.message_text, 50)}
                  </p>
                )}
                {cameo.video_url && (
                  <div className="flex items-center gap-2">
                    {cameo.video_thumbnail_url && (
                      <img
                        src={cameo.video_thumbnail_url}
                        alt="Video thumbnail"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <span className="text-sm text-muted-foreground">Video message</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getCameoStatusColor(cameo.status)}>
                  {getCameoStatusLabel(cameo.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span>{cameo.view_count}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatCameoDate(cameo.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cameo.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
