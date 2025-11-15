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
    <div className="relative">
      {/* Close Button - Top Right Corner */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="absolute -top-2 -right-2 z-10 bg-card/90 hover:bg-destructive/90 hover:text-white border border-border hover:border-destructive rounded-full w-8 h-8"
        title="Close profile"
      >
        <X className="w-5 h-5" />
      </Button>

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
            <MapPin className="w-4 h-4" />
            <span>{member.location || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Engagement Metrics */}
        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Watch Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(member.watch_time || 0)}</p>
        </Card>

        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Listen Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(member.listen_time || 0)}</p>
        </Card>

        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Livestream Score</span>
          </div>
          <p className="text-2xl font-bold">{member.livestream_engagement_score || 0}</p>
          {member.livestream_reaction_count > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {member.livestream_reaction_count} reactions
            </p>
          )}
        </Card>

        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Community Score</span>
          </div>
          <p className="text-2xl font-bold">{member.community_engagement_score || 0}</p>
        </Card>

        {/* Activity Stats */}
        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Login Streak</span>
          </div>
          <p className="text-2xl font-bold">{member.login_streak || 0} days</p>
        </Card>

        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Sessions</span>
          </div>
          <p className="text-2xl font-bold">{member.total_sessions || 0}</p>
        </Card>

        {/* Revenue Metrics */}
        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">Total Spend</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(member.total_spend || 0)}</p>
        </Card>

        <Card className="p-4 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">MRR</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(member.mrr || 0)}</p>
        </Card>
      </div>

      {/* Behavioral Intelligence */}
      {(member.era_label || member.ptp_status) && (
        <Card className="p-4 bg-card/50 border-border/50 mb-6">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Behavioral Intelligence</h4>
          <div className="flex flex-wrap gap-2">
            {member.era_label && (
              <Badge variant="outline" className="text-xs">
                ERA: {member.era_label}
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
