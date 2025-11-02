import { Users, Award, Calendar, MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Community() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase.functions.invoke('check-subscription');
      setHasAccess(!!data?.subscribed);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-32 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show locked overlay if no access
  if (!hasAccess) {
    return (
      <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8 relative">
        {/* Blurred background content */}
        <div className="max-w-7xl mx-auto blur-sm pointer-events-none select-none">
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
              Join The Community
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your SØL family is waiting to connect with you!
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {communityFeatures.slice(0, 2).map((feature) => (
              <div key={feature.title} className="bg-card rounded-2xl p-8 border border-border">
                <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center max-w-lg mx-auto px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-gold rounded-full mb-6 shadow-glow">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-4xl font-bold mb-4">
              Subscribe to Access Community
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Connect with other fans, earn achievements, join exclusive events, and more. 
              Start your 7-day free trial to unlock the community.
            </p>
            <div className="space-y-4">
              <Button 
                size="lg"
                className="bg-gradient-gold hover:shadow-glow px-8"
                onClick={() => navigate('/subscribe')}
              >
                Start 7-Day Free Trial
              </Button>
              <p className="text-sm text-muted-foreground">
                Already subscribed?{" "}
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Join The Community
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your SØL family is waiting to connect with you!
          </p>
        </div>

        {/* Community Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {communityFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card hover:bg-card-hover rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 shadow-cosmic"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center mb-6 shadow-gold">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              
              <h3 className="font-serif text-2xl font-bold mb-3">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>

              <Button 
                variant="outline" 
                className="border-primary/30 hover:border-primary hover:bg-card/50"
                onClick={() => navigate("/community-hub")}
              >
                {feature.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Member Tiers */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold mb-8 text-center">
            Sons of Legion Private Community Tiers
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {memberTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 border transition-all duration-300 ${
                  tier.featured
                    ? 'bg-gradient-to-br from-card to-card-hover border-primary shadow-glow scale-105'
                    : 'bg-card border-border hover:border-primary/30 shadow-cosmic'
                }`}
              >
                {tier.featured && (
                  <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    Popular
                  </Badge>
                )}
                
                <h3 className="font-serif text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-3xl font-bold mb-1">
                  {tier.price}
                </div>
                <div className="text-sm text-muted-foreground mb-4">per month</div>
                
                <p className="text-sm font-semibold mb-4">{tier.subtitle}</p>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={tier.featured ? 'w-full bg-gradient-gold hover:shadow-glow' : 'w-full'}
                  variant={tier.featured ? 'default' : 'outline'}
                >
                  Subscribe
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="text-center bg-card/50 rounded-2xl p-12 border border-border">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-gold rounded-full mb-6 shadow-gold">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-serif text-3xl font-bold mb-4">More Features Coming Soon</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            We're building an even richer community experience with social feeds, direct messaging, 
            exclusive events, and member only content drops.
          </p>
          <Button variant="outline" className="border-primary/30 hover:border-primary">
            Join Waitlist
          </Button>
        </div>
      </div>
    </div>
  );
}

const communityFeatures = [
  {
    title: "Social Feed",
    description: "Share your experiences, connect with other fans, and stay updated with the latest from Sons of Legion and fellow members.",
    icon: MessageCircle,
    cta: "Explore Feed",
  },
  {
    title: "Achievement System",
    description: "Earn badges and rewards for your engagement. Watch 7 hours? Get a golden badge plus exclusive merch discounts.",
    icon: Award,
    cta: "View Achievements",
  },
  {
    title: "Exclusive Events",
    description: "Get priority access to virtual meet & greets, Q&A sessions, and live listening parties with the artists.",
    icon: Calendar,
    cta: "Upcoming Events",
  },
  {
    title: "Member Profiles",
    description: "Create your profile, showcase your achievements, and connect with fans who share your passion for the music.",
    icon: Users,
    cta: "Create Profile",
  },
];

const memberTiers = [
  {
    name: "Rebels",
    price: "$10",
    subtitle: "For those who've been with us from the beginning.",
    features: [
      "Access behind-the-scenes content & exclusive updates",
      "Join the Heartbeat Community App – connect directly with the band and other fans",
      "Unlimited replays of all private online concerts",
    ],
    featured: true,
  },
  {
    name: "Outlaws",
    price: "$25",
    subtitle: "For the dedicated fans who want more.",
    features: [
      "Includes everything in Rebels",
      "Monthly live video hangout with the band and fellow fans",
      "Two guest passes for friends/family to future online concerts",
      "20% off all limited edition merch drops",
      "Join the Fan Voting Squad – help choose which songs we release next",
    ],
    featured: false,
  },
  {
    name: "Legionnaires",
    price: "$50",
    subtitle: "For the die-hards who want all-access.",
    features: [
      "Includes everything in Outlaws",
      "Early access to unreleased demos – give your feedback before we hit the studio",
      "Exclusive digital song downloads before official release",
      "Four guest passes for future online concerts",
      "Your name featured in the credits of our Day in the Life Vlogs",
      "Monthly access to a virtual studio session with the band",
    ],
    featured: false,
  },
];
