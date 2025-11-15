import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTierColor } from "@/lib/tierColors";
import { X, MapPin, Calendar, Clock, TrendingUp, Zap, Activity, DollarSign, Target, Award, Heart } from "lucide-react";

interface MemberCardProps {
  member: any;
  onClose: () => void;
  onViewProfile: () => void;
}

export const MemberCard = ({ member, onClose, onViewProfile }: MemberCardProps) => {
  
  // Handle multiple members at same location (legacy support)
  if (member._multiple) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{member.location}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {member._multiple.length} members at this location
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {member._multiple.map((m: any) => (
            <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
              <Avatar className="h-10 w-10">
                <AvatarImage src={m.avatar_url} />
                <AvatarFallback>{m.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{m.name}</p>
                <Badge className={`${getTierColor(m.tier)} text-xs mt-1`}>
                  {m.tier}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Format time in hours and minutes
  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  // Single member view with comprehensive data
  return (
    <div style={{ 
      position: "relative", 
      width: "100%", 
      minHeight: "200px",
      background: "hsl(var(--card))",
      borderRadius: "16px",
      border: "1px solid hsl(var(--border))",
      padding: "60px 20px 20px 20px"
    }}>
      {/* MASSIVE UNMISSABLE CLOSE BUTTON */}
      <div
        onClick={(e) => {
          console.log('🔴🔴🔴 CLOSE BUTTON CLICKED!!!');
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "#ff0000",
          color: "#ffffff",
          border: "5px solid #ffffff",
          fontWeight: "900",
          fontSize: "32px",
          cursor: "pointer",
          zIndex: 999999,
          boxShadow: "0 0 20px rgba(255, 0, 0, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        role="button"
        aria-label="Close profile"
      >
        ✕
      </div>
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={member.avatar_url} />
          <AvatarFallback>{member.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
            {member.tier && (
              <Badge className={`${getTierColor(member.tier)} px-3 py-0.5 text-xs`}>
                {member.tier}
              </Badge>
            )}
            {member.is_super_fan && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 text-xs">
                <Heart className="w-3 h-3 mr-1 inline" />
                Super Fan
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {member.city}, {member.country}
          </div>
          {member.joined_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Watch Time
            </span>
          </div>
          <p className="text-2xl font-bold">{formatTime(member.watch_time_seconds)}</p>
        </Card>
        
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Listen Time
            </span>
          </div>
          <p className="text-2xl font-bold">{formatTime(member.listen_time_seconds)}</p>
        </Card>
      </div>

      {/* Engagement Row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="p-3 bg-muted/20 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{member.engagement_score || 0}</p>
          <p className="text-xs text-muted-foreground">Engagement</p>
        </Card>
        
        <Card className="p-3 bg-muted/20 text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-lg font-bold">{member.activity_score || 0}</p>
          <p className="text-xs text-muted-foreground">Activity</p>
        </Card>

        <Card className="p-3 bg-muted/20 text-center">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-lg font-bold">{formatCurrency(member.total_revenue || 0)}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </Card>
      </div>

      {/* Financial Stats */}
      {(member.total_spend || member.monthly_recurring_revenue) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {member.total_spend > 0 && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Spend</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(member.total_spend)}</p>
            </Card>
          )}
          
          {member.monthly_recurring_revenue > 0 && (
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">MRR</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(member.monthly_recurring_revenue)}</p>
            </Card>
          )}
        </div>
      )}

      {/* Behavioral Intelligence */}
      {(member.era_score || member.ptp_status) && (
        <Card className="p-4 bg-muted/20 mb-6">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Behavioral Intelligence
          </h4>
          <div className="flex gap-2 flex-wrap">
            {member.era_score && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                ERA: {member.era_score}
              </Badge>
            )}
            {member.ptp_status && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                PTP Active
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Last Active */}
      {member.last_active_at && (
        <p className="text-sm text-muted-foreground mb-6">
          Last active: {new Date(member.last_active_at).toLocaleString()}
        </p>
      )}

      {/* Action Button */}
      <div className="flex gap-2">
        <Button onClick={onViewProfile} className="flex-1 bg-primary hover:bg-primary/90">
          View Full Profile
        </Button>
      </div>
    </div>
  );
};
