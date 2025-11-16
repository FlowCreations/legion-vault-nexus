import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

interface QuickSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupSuccess: () => void;
}

export function QuickSignupDialog({ open, onOpenChange, onSignupSuccess }: QuickSignupDialogProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const validation = signupSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        // Handle "user already exists" error
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please log in instead.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Wait for the session to be fully established
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          toast.success("Account created! Redirecting to checkout...");
          onOpenChange(false);
          onSignupSuccess();
        } else {
          // Session not ready, wait a bit and try again
          setTimeout(async () => {
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession.session) {
              toast.success("Account created! Redirecting to checkout...");
              onOpenChange(false);
              onSignupSuccess();
            } else {
              toast.error("Session setup failed. Please try logging in.");
              setLoading(false);
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("[QuickSignup] Error:", error);
      toast.error("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>
            Sign up to continue to checkout and start your 7-day free trial
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-gold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Continue to Checkout"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate('/auth');
              }}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
