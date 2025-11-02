import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventTracking } from "@/hooks/useEventTracking";

// Mapping of tier names to Stripe price IDs
const TIER_PRICE_IDS: Record<string, string> = {
  "Rebels": "price_rebels_monthly", // Replace with actual Stripe price ID
  "Outlaws": "price_outlaws_monthly", // Replace with actual Stripe price ID
  "Legionnaires": "price_legionnaires_monthly", // Replace with actual Stripe price ID
};

export default function Subscribe() {
  const { trackEvent } = useEventTracking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleSubscribe = async (tierName: string) => {
    // Check if user is logged in
    if (!user) {
      navigate("/auth");
      return;
    }

    const tier = memberTiers.find(t => t.name === tierName);
    trackEvent('initiate_checkout', {
      tier: tierName,
      price: tier?.price,
      type: 'subscription'
    });

    setLoadingTier(tierName);
    try {
      const priceId = TIER_PRICE_IDS[tierName];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create checkout session",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const memberTiers = [
    {
      name: "Rebels",
      price: "$10",
      subtitle: "For those who've been with us from the beginning.",
      features: [
        "Behind-the-scenes content and exclusive updates",
        "Entry to The Legion community — connect with the band and other fans",
        "Unlimited replays of all private online concerts",
      ],
      featured: false,
    },
    {
      name: "Outlaws",
      price: "$25",
      subtitle: "For the dedicated fans who want more.",
      features: [
        "Everything in Rebels",
        "Monthly live video hangout with the band",
        "Full streaming access to all songs in the vault",
        "Join the Fan Voting Squad — help choose what we release next",
      ],
      featured: true,
    },
    {
      name: "Legionnaires",
      price: "$50",
      subtitle: "For the die-hards who want all-access.",
      features: [
        "Everything in Outlaws",
        "Monthly virtual studio session with the band",
        "Full streaming access to all songs",
        "Free LEGION. shirt (ships after 3 months)",
        "15% off all merch",
      ],
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-40 pb-12">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            Join the Legion
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the membership tier that's right for you and get exclusive access to content, 
            community, and experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {memberTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`p-8 transition-all duration-300 ${
                tier.featured
                  ? 'bg-gradient-to-br from-card to-card-hover border-primary shadow-glow scale-105 relative'
                  : 'bg-card border-border hover:border-primary/30 shadow-cosmic'
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-primary text-primary-foreground border border-primary rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                </div>
              )}
              
              <h3 className="font-serif text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="text-4xl font-bold mb-1">
                {tier.price}
              </div>
              <div className="text-sm text-muted-foreground font-medium mb-1">per month</div>
              <div className="text-xs text-primary font-semibold mb-4">7-day free trial</div>
              
              <p className="text-sm font-semibold text-muted-foreground mb-6">{tier.subtitle}</p>
              
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={tier.featured ? 'w-full bg-gradient-gold hover:shadow-glow' : 'w-full'}
                variant={tier.featured ? 'default' : 'outline'}
                onClick={() => handleSubscribe(tier.name)}
                disabled={loadingTier === tier.name}
              >
                {loadingTier === tier.name ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : user ? (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                ) : (
                  "Sign In to Subscribe"
                )}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Already a member? <Link to="/profile" className="text-primary hover:underline">Manage your subscription</Link>
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            All plans include access to exclusive content, the Legion community, and special perks. 
            Cancel anytime with no hassle.
          </p>
        </div>
      </div>
    </div>
  );
}