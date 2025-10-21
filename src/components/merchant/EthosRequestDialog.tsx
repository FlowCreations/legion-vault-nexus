import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EthosRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
}

export function EthosRequestDialog({ open, onOpenChange, recipientEmail }: EthosRequestDialogProps) {
  const [ethos, setEthos] = useState("");
  const [nonNegotiable, setNonNegotiable] = useState("");
  const [nonNegotiables, setNonNegotiables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addNonNegotiable = () => {
    if (nonNegotiable.trim()) {
      setNonNegotiables([...nonNegotiables, nonNegotiable.trim()]);
      setNonNegotiable("");
    }
  };

  const removeNonNegotiable = (index: number) => {
    setNonNegotiables(nonNegotiables.filter((_, i) => i !== index));
  };

  const sendEthosRequest = async () => {
    if (!ethos.trim()) {
      toast.error("Please enter your ethos");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      setLoading(false);
      return;
    }

    // Find recipient by email
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("real_name", recipientEmail)
      .maybeSingle();

    if (profileError || !profile) {
      toast.error("Recipient not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("ethos_requests")
      .insert({
        from_artist_id: user.id,
        to_artist_id: profile.user_id,
        ethos: ethos.trim(),
        non_negotiables: nonNegotiables,
        status: "pending"
      });

    if (error) {
      toast.error("Failed to send ethos request");
    } else {
      toast.success("Ethos request sent");
      setEthos("");
      setNonNegotiables([]);
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Ethos</DialogTitle>
          <DialogDescription>
            Share your ethos and non-negotiables with {recipientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ethos">Our Ethos (2 sentences)</Label>
            <Textarea
              id="ethos"
              placeholder="What does your brand stand for? Sum it up in two sentences..."
              value={ethos}
              onChange={(e) => setEthos(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {ethos.split('.').filter(s => s.trim()).length}/2 sentences
            </p>
          </div>

          <div>
            <Label htmlFor="non-negotiable">Non-Negotiables</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="non-negotiable"
                placeholder="e.g., No gun violence, No hate speech"
                value={nonNegotiable}
                onChange={(e) => setNonNegotiable(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNonNegotiable())}
              />
              <Button onClick={addNonNegotiable} type="button">Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Things that don't align with your brand
            </p>
          </div>

          {nonNegotiables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nonNegotiables.map((item, idx) => (
                <Badge key={idx} variant="destructive" className="gap-1">
                  {item}
                  <button onClick={() => removeNonNegotiable(idx)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={sendEthosRequest} disabled={loading}>Send Ethos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
