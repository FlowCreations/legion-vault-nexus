import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTierColor } from "@/lib/tierColors";
import { X, MapPin, Clock, Music, Calendar } from "lucide-react";

interface MemberCardProps {
  member: any;
  onClose: () => void;
  onViewProfile: () => void;
}

export const MemberCard = ({ member, onClose, onViewProfile }: MemberCardProps) => {
  
  // Handle multiple members at same location
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

  // Single member view
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-16 w-16">
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
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{member.location || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={onViewProfile} className="flex-1 bg-primary hover:bg-primary/90">
          View Full Profile
        </Button>
      </div>
    </div>
  );
};