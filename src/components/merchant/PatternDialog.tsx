import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  pattern: {
    name: string;
    emoji: string;
    description: string;
    signal: string;
    action: string;
  };
}

export const PatternDialog = ({ isOpen, onClose, memberName, pattern }: PatternDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-3xl">{pattern.emoji}</span>
            {memberName}'s Behavioral Pattern
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Badge variant="outline" className="mb-3 text-base px-3 py-1">
              {pattern.name}
            </Badge>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Pattern:</strong> {pattern.description}
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-foreground">Signal:</strong> {pattern.signal}
            </p>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm">
              <strong className="text-foreground">Recommended Action:</strong> {pattern.action}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
