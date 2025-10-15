import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  album: {
    id: string;
    title: string;
    subtitle?: string;
    price: number;
    image: string;
  };
}

export function PurchaseModal({ isOpen, onClose, onPurchase, album }: PurchaseModalProps) {
  const handlePurchase = () => {
    // Simulate purchase
    onPurchase();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Purchase Album</DialogTitle>
          <DialogDescription>
            This is a demo purchase system. No actual payment will be processed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Album Info */}
          <div className="flex gap-4">
            <img 
              src={album.image} 
              alt={album.title}
              className="w-24 h-24 rounded-lg object-cover shadow-md"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg">{album.title}</h3>
              {album.subtitle && (
                <p className="text-sm text-muted-foreground">{album.subtitle}</p>
              )}
              <p className="text-2xl font-bold text-primary mt-2">
                ${album.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold text-sm">What you'll get:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                Full album streaming access
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                High quality audio
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                All tracks included
              </li>
            </ul>
          </div>

          {/* Demo Notice */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground text-center">
              🎭 Demo Mode: Click "Purchase" to unlock this album instantly
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handlePurchase}
            >
              <Lock className="w-4 h-4 mr-2" />
              Purchase Album
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
