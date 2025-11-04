import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ERABadge } from "./ERABadge";
import { PTPChip } from "./PTPChip";
import { getTierColor } from "@/lib/tierColors";
import { X } from "lucide-react";

interface MemberCardProps {
  member: any;
  onClose: () => void;
  onViewProfile: () => void;
}

export const MemberCard = ({ member, onClose, onViewProfile }: MemberCardProps) => {
  // Calculate age from birthdate
  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(member.birthdate);
  
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
                <div className="flex gap-2 mt-1">
                  {m.tier && <Badge className={`${getTierColor(m.tier)} text-xs`}>{m.tier}</Badge>}
                  {m.era && m.era_label && <ERABadge era={m.era} label={m.era_label} />}
                </div>
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
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">{member.name}</h3>
              <div className="flex gap-2 flex-wrap items-center">
                {member.tier && (
                  <Badge className={`${getTierColor(member.tier)} px-3 py-0.5 text-xs`}>
                    {member.tier}
                  </Badge>
                )}
                {member.era && member.era_label && (
                  <ERABadge era={member.era} label={member.era_label} />
                )}
                {member.ptp !== undefined && member.ptp_status && (
                  <PTPChip ptp={member.ptp} status={member.ptp_status} />
                )}
              </div>
            </div>
            {member.bio && (
              <p className="text-sm text-muted-foreground mb-2">{member.bio}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{member.location || member.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⏱️</span>
                <span>Watch: {Math.floor((member.watch_time || 0) / 60)}h</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎵</span>
                <span>Listen: {Math.floor((member.listen_time || 0) / 60)}h</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Spend</p>
            <p className="font-semibold">${(member.total_spend || 0).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="font-semibold">${(member.mrr || 0).toFixed(2)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-xs">Last login: </span>
          <span className="font-medium">
            {member.last_login 
              ? new Date(member.last_login).toLocaleDateString()
              : 'Never'
            }
          </span>
        </div>
        <div>
          <span className="text-xs">Joined: </span>
          <span className="font-medium">
            {new Date(member.joined_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onViewProfile} className="flex-1">
          View Profile
        </Button>
      </div>
    </div>
  );
};