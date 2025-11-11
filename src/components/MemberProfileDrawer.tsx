import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemberProfileDrawerProps {
  member: {
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
  } | null;
  onClose: () => void;
}

export default function MemberProfileDrawer({ member, onClose }: MemberProfileDrawerProps) {
  if (!member) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-background border-l border-border shadow-xl z-50 flex flex-col animate-slide-in backdrop-blur-xl">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">{member.name}</h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6 space-y-4 text-foreground">
        <div>
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Location</div>
          <div className="text-lg font-medium">{member.location || "Not specified"}</div>
        </div>

        <div>
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Coordinates</div>
          <div className="text-md font-mono">
            {member.latitude?.toFixed(3)}, {member.longitude?.toFixed(3)}
          </div>
        </div>

        <hr className="border-border" />

        <div className="text-sm text-muted-foreground">
          Additional profile data (engagement score, tier, avatar, revenue, etc.) can be shown here.
          This drawer is expandable.
        </div>
      </div>
    </div>
  );
}
