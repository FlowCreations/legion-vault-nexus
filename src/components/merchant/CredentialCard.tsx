import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConnectionStatus } from "./ConnectionStatus";
import { CredentialSetupDialog } from "./CredentialSetupDialog";
import { Facebook, Instagram, Music2, Twitter } from "lucide-react";

interface CredentialCardProps {
  platform: "meta" | "instagram" | "tiktok" | "twitter";
  platformName: string;
  description: string;
  comingSoon?: boolean;
}

const platformIcons = {
  meta: Facebook,
  instagram: Instagram,
  tiktok: Music2,
  twitter: Twitter,
};

export const CredentialCard = ({ platform, platformName, description, comingSoon }: CredentialCardProps) => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState<"active" | "invalid" | "not_configured">("not_configured");
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [testing, setTesting] = useState(false);

  const Icon = platformIcons[platform];

  useEffect(() => {
    loadCredentialStatus();
  }, [platform]);

  const loadCredentialStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("social_credentials")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", platform);

      if (error) throw error;

      if (data && data.length > 0) {
        const pixelCredential = data.find(c => c.credential_type === "pixel_id");
        const tokenCredential = data.find(c => c.credential_type === "access_token");
        
        const configured = pixelCredential?.is_configured && tokenCredential?.is_configured;
        setIsConfigured(configured);
        
        const credentialStatus = pixelCredential?.status as "active" | "invalid" | "not_configured" | null;
        setStatus(credentialStatus || "not_configured");
        
        if (pixelCredential?.last_verified_at) {
          setLastVerified(new Date(pixelCredential.last_verified_at));
        }
      }
    } catch (error) {
      console.error("Error loading credential status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to test credentials",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-social-credentials", {
        body: { action: "test", platform },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        setStatus("active");
        setLastVerified(new Date());
        await loadCredentialStatus();
        
        toast({
          title: "Connection successful",
          description: `Your ${platformName} credentials are working correctly`,
        });
      } else {
        setStatus("invalid");
        toast({
          title: "Connection failed",
          description: data.error || "Failed to verify credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error testing credentials:", error);
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDialogClose = (success?: boolean) => {
    setShowDialog(false);
    if (success) {
      loadCredentialStatus();
    }
  };

  if (comingSoon) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {platformName}
                  <span className="text-xs font-normal bg-muted px-2 py-1 rounded">Coming Soon</span>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{platformName}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <ConnectionStatus status={status} loading={loading} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastVerified ? (
                <span>Last verified: {lastVerified.toLocaleDateString()}</span>
              ) : (
                <span>Never verified</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
              >
                {isConfigured ? "Update" : "Configure"}
              </Button>
              {isConfigured && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CredentialSetupDialog
        open={showDialog}
        onOpenChange={handleDialogClose}
        platform={platform}
        platformName={platformName}
      />
    </>
  );
};
