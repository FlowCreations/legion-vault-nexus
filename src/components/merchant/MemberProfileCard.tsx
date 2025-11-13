import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { 
  Clock, Play, Headphones, Heart, ShoppingBag, 
  MapPin, Calendar, Activity, Star, Crown, Zap
} from "lucide-react";
import { Member } from "./GlobalReachMap";

interface MemberProfileCardProps {
  member: Member & {
    totalSpend?: number;
    purchaseCount?: number;
    favoriteCount?: number;
    lastActive?: string;
    joinedDate?: string;
    engagementScore?: number;
    isVIP?: boolean;
    topGenres?: string[];
  };
  onClose?: () => void;
}

export function MemberProfileCard({ member, onClose }: MemberProfileCardProps) {
  const formatTime = (minutes: number = 0) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'legionnaire': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'outlaw': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'rebel': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gradient-to-r from-muted to-muted-foreground';
    }
  };

  const getPTPColor = (ptpScore?: number) => {
    if (!ptpScore) return 'bg-gray-500';
    if (ptpScore >= 67) return 'bg-green-500'; // Green (67-100)
    if (ptpScore >= 34) return 'bg-yellow-500'; // Yellow (34-66)
    return 'bg-red-500'; // Red (0-33)
  };

  const getTierIcon = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'legionnaire': return Crown;
      case 'outlaw': return Star;
      case 'rebel': return Zap;
      default: return Activity;
    }
  };

  const TierIcon = getTierIcon(member.tier);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto"
    >
      <Card className="w-80 bg-card/95 backdrop-blur-lg border-border/50 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {member.name?.charAt(0)?.toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg truncate">{member.name || 'Member'}</h3>
                {member.isVIP && (
                  <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">
                  {[member.city, member.country].filter(Boolean).join(', ') || 'Location unknown'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white ${getTierColor(member.tier)}`}>
                  <TierIcon className="h-3 w-3" />
                  {member.tier || 'Free'}
                </div>
                <div 
                  className={`w-3 h-3 rounded-full ${getPTPColor(member.ptpScore)}`}
                  title={`PTP Score: ${member.ptpScore || 0}`}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-6">
          {/* Engagement Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Play className="h-4 w-4" />
                <span className="text-xs font-medium">Watch Time</span>
              </div>
              <p className="text-lg font-bold">{formatTime(member.watchTime)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Headphones className="h-4 w-4" />
                <span className="text-xs font-medium">Listen Time</span>
              </div>
              <p className="text-lg font-bold">{formatTime(member.listenTime)}</p>
            </div>
          </div>

          {/* Purchase & Activity Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold">{member.purchaseCount || 0}</p>
              <p className="text-xs text-muted-foreground">Purchases</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold">{member.favoriteCount || 0}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold">{member.engagementScore || 0}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>

          {/* Total Spend */}
          {member.totalSpend !== undefined && member.totalSpend > 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Spend</span>
                <span className="text-xl font-bold text-primary">
                  ${member.totalSpend.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Top Genres */}
          {member.topGenres && member.topGenres.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Favorite Genres</p>
              <div className="flex flex-wrap gap-1">
                {member.topGenres.map((genre, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activity Info */}
          <div className="pt-3 border-t border-border space-y-2">
            {member.lastActive && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last active: {member.lastActive}</span>
              </div>
            )}
            {member.joinedDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Joined: {member.joinedDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
