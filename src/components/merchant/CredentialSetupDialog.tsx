import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface CredentialSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: "meta" | "instagram" | "tiktok" | "twitter";
  platformName: string;
}

export const CredentialSetupDialog = ({
  open,
  onOpenChange,
  platform,
  platformName,
}: CredentialSetupDialogProps) => {
  const { toast } = useToast();
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);

  const validatePixelId = (value: string) => {
    // Meta Pixel IDs are typically 15-16 digits
    return /^\d{15,16}$/.test(value);
  };

  const handleSave = async () => {
    // Validate inputs
    if (!pixelId.trim()) {
      toast({
        title: "Pixel ID required",
        description: "Please enter your Meta Pixel ID",
        variant: "destructive",
      });
      return;
    }

    if (!validatePixelId(pixelId)) {
      toast({
        title: "Invalid Pixel ID",
        description: "Meta Pixel ID must be 15-16 digits",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken.trim()) {
      toast({
        title: "Access Token required",
        description: "Please enter your Conversions API Access Token",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to save credentials",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-social-credentials", {
        body: {
          action: "save",
          platform,
          credentials: {
            pixel_id: pixelId,
            access_token: accessToken,
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Credentials saved",
          description: `Your ${platformName} credentials have been saved successfully`,
        });
        
        // Clear form and close dialog
        setPixelId("");
        setAccessToken("");
        onOpenChange(true); // Pass true to indicate success
      } else {
        throw new Error(data.error || "Failed to save credentials");
      }
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPixelId("");
    setAccessToken("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure {platformName} Credentials</DialogTitle>
          <DialogDescription>
            Enter your {platformName} credentials to enable social tracking and attribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pixel-id">Meta Pixel ID *</Label>
            <Input
              id="pixel-id"
              placeholder="123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              maxLength={16}
            />
            <p className="text-sm text-muted-foreground">
              Find this in Meta Events Manager → Data Sources → Your Pixel
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open("https://business.facebook.com/events_manager", "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Meta Events Manager
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-token">Conversions API Access Token *</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Enter your access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Generate this in Meta Events Manager → Settings → Conversions API
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open("https://developers.facebook.com/docs/marketing-api/conversions-api/get-started", "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Setup Guide
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save & Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
