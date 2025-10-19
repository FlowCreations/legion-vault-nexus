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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.avatar_url} />
            <AvatarFallback>{member.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.location}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {member.tier && (
            <Badge className={`${getTierColor(member.tier)} px-4 py-1.5 text-sm h-8 min-w-[120px] flex items-center justify-center`}>
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

        <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Joined</p>
            <p className="font-semibold mt-1">
              {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            <p className="font-semibold mt-1">{member.era_label || 'Member'}</p>
          </div>
        </div>

        <Button onClick={onViewProfile} className="w-full">
          View Full Profile
        </Button>
      </div>
    </div>
  );
};