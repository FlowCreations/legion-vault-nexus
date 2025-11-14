import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LyricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  artist: string;
  lyrics?: string;
}

export const LyricsDialog = ({ isOpen, onClose, trackTitle, artist, lyrics }: LyricsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black/95 border-primary/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {trackTitle}
          </DialogTitle>
          <p className="text-muted-foreground">{artist}</p>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {lyrics ? (
            <div className="space-y-4">
              <pre className="font-sans text-foreground whitespace-pre-wrap leading-relaxed text-base">
                {lyrics}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                No lyrics available yet
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
