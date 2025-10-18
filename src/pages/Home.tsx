import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";
import solLogo from "@/assets/sol-logo.png";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-cosmic">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl animate-glow-pulse delay-1000" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 sm:pt-40">
          {/* Logo as Header */}
          <div className="mb-0 mt-8 animate-fade-in">
            <img 
              src={solLogo} 
              alt="Sons of Legion" 
              className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 w-auto mx-auto object-contain drop-shadow-[0_0_30px_rgba(247,201,70,0.5)]"
            />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by JRNY</span>
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in text-balance">
            A powerhouse blend of rock, soul, and blues delivering raw energy and unforgettable music. 
            Experience it all in one artist owned platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button 
              size="lg" 
              className="group bg-gradient-gold hover:shadow-glow transition-all duration-300 text-primary-foreground"
              asChild
            >
              <Link to="/videos">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Watching
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="hover:shadow-glow transition-all duration-300"
              asChild
            >
              <Link to="/free-ep">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Our Free Album
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/30 hover:border-primary hover:bg-card/50"
              asChild
            >
              <Link to="/music">
                Explore Music
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
              What Awaits You
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Immerse yourself in a complete ecosystem designed for true fans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="group relative bg-card hover:bg-card-hover rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-cosmic overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-gold">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  
                  <h3 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Member Tiers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-8 text-center">
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
                  <div className="mb-4 inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                    Popular
                  </div>
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
                  asChild
                >
                  <Link to="/community">Subscribe</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "Premium Videos",
    description: "Watch exclusive series, music videos, and documentaries in stunning quality with an Apple TV-inspired experience.",
    icon: Play,
    link: "/videos",
  },
  {
    title: "Full Albums & Singles",
    description: "Stream complete albums with detailed credits, lyrics, and collaborator stories in a beautiful interface.",
    icon: Sparkles,
    link: "/music",
  },
  {
    title: "VIP Community",
    description: "Connect with fellow fans, earn badges, and get exclusive access to artist conversations and events.",
    icon: Sparkles,
    link: "/community",
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
