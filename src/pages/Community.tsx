import { Users, Award, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Community() {
  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Join The Community
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your SOL family is waiting to connect with you!
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

              <Button variant="outline" className="border-primary/30 hover:border-primary hover:bg-card/50">
                {feature.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Member Tiers */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl font-bold mb-8 text-center">
            🔥 Sons of Legion Private Community Tiers 🔥
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
