import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";
import solLogo from "@/assets/sol-logo-new.png";
import LogoIntro from "@/components/LogoIntro";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [introSeen, setIntroSeen] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (hasSeenIntro) {
      setShowIntro(false);
      setIntroSeen(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setShowIntro(false);
    setIntroSeen(true);
  };

  if (showIntro && !introSeen) {
    return <LogoIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-cosmic">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse -translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl animate-glow-pulse delay-1000 -translate-y-1/2" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo with dramatic entrance animation */}
          <div className="mb-3 mt-64 animate-logo-dramatic">
            <img 
              src={solLogo} 
              alt="Sons of Legion" 
              className="h-[18.5rem] sm:h-[20.5rem] md:h-[23rem] lg:h-[27.5rem] xl:h-[32rem] w-auto mx-auto object-contain drop-shadow-[0_0_30px_rgba(247,201,70,0.5)]"
            />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by JRNY</span>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in text-balance">
            A powerhouse blend of rock, soul, and blues delivering raw energy and unforgettable music. 
            Experience it all in one artist owned platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in mb-12">
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
            Join the Legion
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
                <div className="text-sm text-foreground/70 font-medium mb-4">per month</div>
                
                <p className="text-sm font-semibold mb-4">{tier.subtitle}</p>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-foreground/80 font-medium">
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
