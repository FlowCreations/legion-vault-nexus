import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function TipDialog({ open, onOpenChange, eventId }: TipDialogProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = [5, 10, 20, 50];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tipAmount = parseFloat(amount);
    if (!tipAmount || tipAmount < 1) {
      toast.error("Minimum tip amount is $1.00");
      return;
    }

    setIsLoading(true);
    try {
      // Call the create-tip-payment edge function
      const { data, error } = await supabase.functions.invoke('create-tip-payment', {
        body: {
          amount: Math.round(tipAmount * 100), // Convert to cents
          eventId,
          message: message.trim(),
          tipperName: tipperName.trim() || "Anonymous"
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success("Opening payment page...");
        onOpenChange(false);
        // Reset form
        setAmount("");
        setMessage("");
        setTipperName("");
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Tip payment error:', error);
      toast.error('Failed to process tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          <DialogDescription>
            Support the artist during this live performance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipperName">Your Name (optional)</Label>
            <Input
              id="tipperName"
              value={tipperName}
              onChange={(e) => setTipperName(e.target.value)}
              placeholder="Anonymous"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  className="flex-1"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              maxLength={200}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !amount}
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Send ${amount || "0"} Tip
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
