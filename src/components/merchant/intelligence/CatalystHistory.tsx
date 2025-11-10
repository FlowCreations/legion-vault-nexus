import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Bell, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface CatalystExecution {
  id: string;
  campaign_id: string;
  user_id: string;
  ptp_score: number;
  segment: string;
  channel: string;
  scheduled_for: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  converted_at: string | null;
  conversion_value: number;
}

export const CatalystHistory = () => {
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<CatalystExecution[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('catalyst_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'trigger': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'nurture': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'observe': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (execution: CatalystExecution) => {
    if (execution.converted_at) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Converted</Badge>;
    } else if (execution.clicked_at) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Clicked</Badge>;
    } else if (execution.opened_at) {
      return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Opened</Badge>;
    } else if (execution.sent_at) {
      return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Sent</Badge>;
    } else {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Scheduled</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campaign Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {executions.map((execution) => (
            <div key={execution.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChannelIcon(execution.channel)}
                  <Badge className={getSegmentColor(execution.segment)}>
                    {execution.segment}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    PTP: {execution.ptp_score}
                  </span>
                </div>
                {getStatusBadge(execution)}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Scheduled: {format(new Date(execution.scheduled_for), 'MMM d, yyyy h:mm a')}</div>
                {execution.sent_at && (
                  <div>Sent: {format(new Date(execution.sent_at), 'MMM d, yyyy h:mm a')}</div>
                )}
                {execution.conversion_value > 0 && (
                  <div className="text-emerald-500 font-medium">
                    Revenue: ${execution.conversion_value.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {executions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No campaign executions yet. Deploy Catalyst to start!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
