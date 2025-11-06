import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Loader2 } from "lucide-react";
import solLogo from "@/assets/sol-logo-new.png";
import LogoIntro from "@/components/LogoIntro";
import { CameoDisplay } from "@/components/CameoDisplay";
import { useEventTracking } from "@/hooks/useEventTracking";
import { PersonalitySurvey } from "@/components/PersonalitySurvey";
import { useSurveyTrigger } from "@/hooks/useSurveyTrigger";
import { JRNYProgressBar } from "@/components/JRNYProgressBar";
import { useMilestoneProgress } from "@/hooks/useMilestoneProgress";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickSignupDialog } from "@/components/QuickSignupDialog";
import { useTranslation } from "react-i18next";

// Mapping of tier names to Stripe price IDs
const TIER_PRICE_IDS: Record<string, string> = {
  "Rebels": "price_1SP6a3FTZjyeQ8pZKLtwqtTg",
  "Outlaws": "price_1SP6aOFTZjyeQ8pZDGwBCUqf",
  "Legionnaires": "price_1SP6aeFTZjyeQ8pZFmmOX1Uc",
};

export default function Home() {
  const { t } = useTranslation();
  const { trackEvent } = useEventTracking();
  const { showSurvey, handleSurveyClose } = useSurveyTrigger('other');
  const { progress, loading } = useMilestoneProgress();
  const { loading: subLoading } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Listen to auth state changes immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setAuthChecked(true);
      
      // Only show intro if user is NOT authenticated AND intro hasn't been shown
      if (!authenticated && !sessionStorage.getItem('introShown')) {
        setShowIntro(true);
      } else {
        setShowIntro(false);
      }
    });

    // Also check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setAuthChecked(true);
      
      if (!authenticated && !sessionStorage.getItem('introShown')) {
        setShowIntro(true);
      } else {
        setShowIntro(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('introShown', 'true');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSubscribe = async (tierName: string) => {
    trackEvent('subscribe', { tier: tierName, source: 'home_tiers' });
    
    // Check if user is logged in using current state
    if (!isAuthenticated) {
      // Show signup dialog instead of redirecting
      setSelectedTier(tierName);
      setShowSignupDialog(true);
      return;
    }

    // User is logged in, proceed directly to checkout
    proceedToCheckout(tierName);
  };

  const proceedToCheckout = async (tierName: string) => {
    setLoadingTier(tierName);
    try {
      const priceId = TIER_PRICE_IDS[tierName];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, embedded: false }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect directly to Stripe hosted checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('[Home] Checkout error:', error);
      toast.error(error.message || "Failed to start checkout process");
      setLoadingTier(null);
    }
  };

  const handleSignupSuccess = () => {
    // After successful signup, proceed to checkout with the selected tier
    if (selectedTier) {
      proceedToCheckout(selectedTier);
    }
  };

  if (showIntro) {
    return <LogoIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Quick Signup Dialog */}
      <QuickSignupDialog 
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        onSignupSuccess={handleSignupSuccess}
      />

      {/* Personality Survey - TEST MODE */}
      <PersonalitySurvey isOpen={showSurvey} onClose={handleSurveyClose} />
      
      {/* Cameo Display - Shows at top if user has active cameos */}
      <div className="container mx-auto px-4 pt-24">
        <CameoDisplay />
      </div>

      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      >
        {/* Animated background glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute inset-0 bg-gradient-cosmic"
        >
          <motion.div 
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.25, 0.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" 
          />
          <motion.div 
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 4,
              delay: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl -translate-y-1/2" 
          />
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Logo */}
          <div className="mb-3 mt-64">
            <img 
              src={solLogo} 
              alt="Sons of Legion" 
              className="h-[18.5rem] sm:h-[20.5rem] md:h-[23rem] lg:h-[27.5rem] xl:h-[32rem] w-auto mx-auto object-contain drop-shadow-[0_0_30px_rgba(247,201,70,0.5)]"
            />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t('home.hero.poweredBy')}</span>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in text-balance">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in mb-12">
            <Button 
              size="lg" 
              className="group bg-gradient-gold hover:shadow-glow transition-all duration-300 text-primary-foreground"
              asChild
              onClick={() => trackEvent('view_video', { source: 'hero_cta' })}
            >
              <Link to="/videos">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {t('home.hero.startWatching')}
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="hover:shadow-glow transition-all duration-300"
              asChild
              onClick={() => trackEvent('view_album', { name: 'Free EP', source: 'hero_cta' })}
            >
              <Link to="/free-ep">
                <Sparkles className="w-5 h-5 mr-2" />
                {t('home.hero.getFreeAlbum')}
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/30 hover:border-primary hover:bg-card/50"
              asChild
              onClick={() => trackEvent('view_product', { category: 'music', source: 'hero_cta' })}
            >
              <Link to="/music">
                {t('home.hero.exploreMusic')}
              </Link>
            </Button>
          </div>
        </motion.div>

      </motion.section>

      {/* Featured Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={feature.titleKey}
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
                    {t(feature.titleKey)}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {t(feature.descriptionKey)}
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
            {t('home.tiers.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {memberTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 border transition-all duration-300 ${
                  tier.featured
                    ? 'bg-gradient-to-br from-card to-card-hover border-primary shadow-glow scale-105'
                    : 'bg-card border-border hover:border-primary/30 shadow-cosmic'
                }`}
              >
                {tier.featured && (
                  <div className="mb-4 inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-semibold">
                    {t('home.tiers.popular')}
                  </div>
                )}
                
                <h3 className="font-serif text-2xl font-bold mb-2">{t(tier.nameKey)}</h3>
                <div className="text-3xl font-bold mb-1">
                  {t(tier.priceKey)}
                </div>
                <div className="text-sm text-foreground/70 font-medium mb-1">{t('home.tiers.perMonth')}</div>
                <div className="text-xs text-primary font-semibold mb-4">{t('home.tiers.freeTrial')}</div>
                
                <p className="text-sm font-semibold mb-4">{t(tier.subtitleKey)}</p>
                
                <ul className="space-y-3 mb-8">
                  {tier.featureKeys.map((featureKey, idx) => (
                    <li key={idx} className="text-sm text-foreground/80 font-medium">
                      {t(featureKey)}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={tier.featured ? 'w-full bg-gradient-gold hover:shadow-glow' : 'w-full'}
                  variant={tier.featured ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(t(tier.nameKey))}
                  disabled={loadingTier === t(tier.nameKey)}
                >
                  {loadingTier === t(tier.nameKey) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('common.subscribe')
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Features are now translated dynamically in the component
const features = [
  {
    titleKey: "home.features.premiumVideos.title",
    descriptionKey: "home.features.premiumVideos.description",
    icon: Play,
    link: "/videos",
  },
  {
    titleKey: "home.features.fullAlbums.title",
    descriptionKey: "home.features.fullAlbums.description",
    icon: Sparkles,
    link: "/music",
  },
  {
    titleKey: "home.features.vipCommunity.title",
    descriptionKey: "home.features.vipCommunity.description",
    icon: Sparkles,
    link: "/community",
  },
];

const memberTiers = [
  {
    nameKey: "home.tiers.rebels.name",
    price: "$10",
    priceKey: "home.tiers.rebels.price",
    subtitleKey: "home.tiers.rebels.subtitle",
    featureKeys: [
      "home.tiers.rebels.feature1",
      "home.tiers.rebels.feature2",
      "home.tiers.rebels.feature3",
    ],
    featured: false,
  },
  {
    nameKey: "home.tiers.outlaws.name",
    price: "$25",
    priceKey: "home.tiers.outlaws.price",
    subtitleKey: "home.tiers.outlaws.subtitle",
    featureKeys: [
      "home.tiers.outlaws.feature1",
      "home.tiers.outlaws.feature2",
      "home.tiers.outlaws.feature3",
      "home.tiers.outlaws.feature4",
    ],
    featured: true,
  },
  {
    nameKey: "home.tiers.legionnaires.name",
    price: "$50",
    priceKey: "home.tiers.legionnaires.price",
    subtitleKey: "home.tiers.legionnaires.subtitle",
    featureKeys: [
      "home.tiers.legionnaires.feature1",
      "home.tiers.legionnaires.feature2",
      "home.tiers.legionnaires.feature3",
      "home.tiers.legionnaires.feature4",
      "home.tiers.legionnaires.feature5",
    ],
    featured: false,
  },
];
