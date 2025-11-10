import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import solLogo from "@/assets/sol-logo-new.png";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token },
        });

        if (error) throw error;

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          
          toast.success("Email verified! Welcome to Sons of Legion");
          
          // Redirect to auth/login after 3 seconds
          setTimeout(() => {
            navigate("/auth");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "An error occurred during verification");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-background/95">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={solLogo} 
            alt="Sons of Legion Logo" 
            className="w-48 mx-auto"
          />
        </div>

        {/* Status Card */}
        <div className="bg-card border border-border rounded-lg p-8 text-center shadow-elegant">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Verifying Your Email
              </h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Email Verified!
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the home page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Verification Failed
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full"
                  variant="default"
                >
                  Go to Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/")}
                  className="w-full"
                  variant="outline"
                >
                  Return Home
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
