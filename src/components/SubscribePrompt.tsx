import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SubscribePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function SubscribePrompt({ 
  open, 
  onOpenChange, 
  title = "Subscribe to Continue",
  description = "Get instant access to exclusive content with a 7-day free trial."
}: SubscribePromptProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Button 
            className="w-full bg-gradient-gold hover:shadow-glow"
            onClick={() => {
              onOpenChange(false);
              navigate('/subscribe');
            }}
          >
            Start 7-Day Free Trial
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already subscribed?{" "}
            <button 
              onClick={() => {
                onOpenChange(false);
                navigate('/auth');
              }}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
