import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

const TIER_PRICE_IDS: Record<string, string> = {
  "Rebels": "price_1QhunoAkEokk90mfkxLQJgI8",
  "Outlaws": "price_1QhunvAkEokk90mfb7CqjJjq",
  "Legionnaires": "price_1Qhuo2AkEokk90mfnhOBiSJQ",
};

const TIER_DETAILS = {
  "Rebels": {
    price: "$10",
    subtitle: "For those who've been with us from the beginning.",
    features: [
      "Behind-the-scenes content and exclusive updates",
      "Entry to The Legion community — connect with the band and other fans",
      "Unlimited replays of all private online concerts",
    ],
  },
  "Outlaws": {
    price: "$25",
    subtitle: "For the dedicated fans who want more.",
    features: [
      "Everything in Rebels",
      "Monthly live video hangout with the band",
      "Full streaming access to all songs in the vault",
      "Join the Fan Voting Squad — help choose what we release next",
    ],
  },
  "Legionnaires": {
    price: "$50",
    subtitle: "For the die-hards who want all-access.",
    features: [
      "Everything in Outlaws",
      "Monthly virtual studio session with the band",
      "Full streaming access to all songs",
      "Free LEGION. shirt (ships after 3 months)",
      "15% off all merch",
    ],
  },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier') || 'Outlaws';
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      // User already logged in, go straight to Stripe
      proceedToStripe();
    }
  };

  const proceedToStripe = async () => {
    const priceId = TIER_PRICE_IDS[tier];
    if (!priceId) {
      sonnerToast.error("Invalid subscription tier");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      sonnerToast.error('Failed to start checkout process');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      sonnerToast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Create account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      if (data.user) {
        sonnerToast.success("Account created! Redirecting to checkout...");
        // Wait a moment for auth to settle, then proceed to Stripe
        setTimeout(() => {
          proceedToStripe();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      sonnerToast.error(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const tierDetails = TIER_DETAILS[tier as keyof typeof TIER_DETAILS];

  return (
    <div className="min-h-screen bg-background pt-40 pb-12">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            Complete Your Subscription
          </h1>
          <p className="text-muted-foreground text-lg">
            Create your account to start your 7-day free trial
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Selected Tier Details */}
          <Card className="p-8 bg-gradient-to-br from-card to-card-hover border-primary shadow-glow">
            <h3 className="font-serif text-2xl font-bold mb-2">{tier}</h3>
            <div className="text-4xl font-bold mb-1">{tierDetails.price}</div>
            <div className="text-sm text-muted-foreground font-medium mb-1">per month</div>
            <div className="text-xs text-primary font-semibold mb-4">7-day free trial</div>
            
            <p className="text-sm font-semibold text-muted-foreground mb-6">{tierDetails.subtitle}</p>
            
            <ul className="space-y-3">
              {tierDetails.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Account Creation Form */}
          <Card className="p-8">
            {user ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Redirecting to checkout...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold mb-6">Create Your Account</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-gold hover:shadow-glow"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Continue to Checkout"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
