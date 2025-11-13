import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, MousePointer, ShoppingCart, UserX, AlertTriangle } from "lucide-react";

interface CampaignStats {
  campaignName: string;
  status: string;
  dayOfCampaign: number;
  totalDays: number;
  sends: {
    sequenceNumber: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    unsubscribed: number;
    spamReports: number;
    scheduledFor?: string;
    subject?: string;
  }[];
  segments: {
    notOpened: number;
    openedNotClicked: number;
    clickedNotPurchased: number;
    converted: number;
    suppressed: number;
  };
}

interface Props {
  campaignId: string;
  stats: CampaignStats;
}

export const CampaignPerformanceDashboard = ({ stats }: Props) => {
  const currentSend = stats.sends.find(s => s.sequenceNumber === 1) || stats.sends[0];
  const nextSend = stats.sends.find(s => !s.delivered && s.scheduledFor);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return "0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{stats.campaignName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={stats.status === "active" ? "default" : "secondary"}>
                {stats.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Day {stats.dayOfCampaign} of {stats.totalDays}
              </span>
            </div>
          </div>
        </div>

        {/* First Send Stats */}
        {currentSend && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">First Send</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Delivered</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(currentSend.delivered)}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Opened</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(currentSend.opened)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(currentSend.opened, currentSend.delivered)}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointer className="h-4 w-4" />
                  <span>Clicked</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(currentSend.clicked)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(currentSend.clicked, currentSend.opened)} of opens
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Converted</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(currentSend.converted)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(currentSend.converted, currentSend.clicked)} of clicks
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Send Preview */}
        {nextSend && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-2">
              Send #{nextSend.sequenceNumber} 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Scheduled for {new Date(nextSend.scheduledFor!).toLocaleDateString()})
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-medium">Subject:</span> {nextSend.subject}
            </p>
            <p className="text-sm">
              Target: {formatNumber(stats.segments.notOpened + stats.segments.openedNotClicked)} recipients
            </p>
          </div>
        )}

        {/* Segment Breakdown */}
        <div className="border-t pt-4">
          <h4 className="text-lg font-semibold mb-3">Segment Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Not Opened</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatNumber(stats.segments.notOpened)}</span>
                <Badge variant="outline">Will receive Send #2</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Opened, No Click</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatNumber(stats.segments.openedNotClicked)}</span>
                <Badge variant="outline">Will receive Send #2</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Clicked, No Purchase</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatNumber(stats.segments.clickedNotPurchased)}</span>
                <Badge variant="outline">Will receive Send #3</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <span className="text-sm font-medium">Converted</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">{formatNumber(stats.segments.converted)}</span>
                <Badge variant="outline" className="border-green-600 text-green-600">Suppressed ✓</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Unsubscribed</span>
              </div>
              <span className="font-semibold">{formatNumber(currentSend?.unsubscribed || 0)}</span>
            </div>
            
            {currentSend?.spamReports > 0 && (
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Spam Reports</span>
                </div>
                <span className="font-semibold text-destructive">{formatNumber(currentSend.spamReports)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
