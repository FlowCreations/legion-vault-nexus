import { useEffect, useRef } from "react";
import { AbandonedCartPopup } from "@/components/AbandonedCartPopup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { initMetaPixel } from "@/lib/metaPixel";
import { setQueryClient } from "@/diagnostics/performanceFixes";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { FloatingChatbot } from "./components/FloatingChatbot";
import { GlobalMusicPlayer } from "./components/GlobalMusicPlayer";
import { useAgent } from "./hooks/useAgent";
import { useDiagnostics } from "./hooks/useDiagnostics";
import { ErrorBoundary } from "./diagnostics/ErrorBoundary";
import { HealthOverlay } from "./components/diagnostics/HealthOverlay";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { TIERS } from "./config/subscriptions";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import VideoManager from "./pages/VideoManager";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Music from "./pages/Music";
import AlbumDetail from "./pages/AlbumDetail";
import Favorites from "./pages/Favorites";
import EPsSingles from "./pages/EPsSingles";
import SongCredits from "./pages/SongCredits";
import Shows from "./pages/Shows";
import Gallery from "./pages/Gallery";
import SalesSheets from "./pages/SalesSheets";
import Community from "./pages/Community";
import Merch from "./pages/Merch";
import Merchant from "./pages/Merchant";
import LiveStudio from "./pages/LiveStudio";
import NotFound from "./pages/NotFound";
import CommunityHub from "./pages/CommunityHub";
import AdminDashboard from "./pages/AdminDashboard";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import FreeEP from "./pages/FreeEP";
import VerifyEmail from "./pages/VerifyEmail";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Subscribe from "./pages/Subscribe";
import Step1LeadCapture from "./pages/funnel/Step1LeadCapture";
import Step2ThankYou from "./pages/funnel/Step2ThankYou";
import Step3SalesPage from "./pages/funnel/Step3SalesPage";
import Step5Upsell from "./pages/funnel/Step5Upsell";
import Step6Downsell1 from "./pages/funnel/Step6Downsell1";
import Step9ThankYouPurchase from "./pages/funnel/Step9ThankYouPurchase";
import Step10PortalOnboarding from "./pages/funnel/Step10PortalOnboarding";
import Step11MerchUpsell from "./pages/funnel/Step11MerchUpsell";
import Step12RewardsLoop from "./pages/funnel/Step12RewardsLoop";

const queryClient = new QueryClient();

// Initialize performance fixes with queryClient
setQueryClient(queryClient);

const App = () => {
  const pixelInitialized = useRef(false);
  
  // Initialize diagnostics monitoring
  useDiagnostics();
  
  // Initialize Agent
  useAgent({ enabled: true, checkInterval: 5 });

  useEffect(() => {
    // Only run once per session using ref
    if (pixelInitialized.current) return;
    pixelInitialized.current = true;

    // Initialize Meta Pixel on app mount
    const initializeTracking = async () => {
      try {
        const { data, error } = await supabase
          .from("social_credentials")
          .select("credential_metadata, browser_events_enabled")
          .eq("platform", "meta")
          .eq("credential_type", "pixel_id")
          .eq("is_configured", true)
          .eq("browser_events_enabled", true)
          .limit(1)
          .maybeSingle();

        if (error || !data) return;

        const metadata = data.credential_metadata as any;
        const pixelId = metadata?.pixel_id;
        
        if (pixelId) {
          initMetaPixel(pixelId);
        }
      } catch (error) {
        console.error("[App] Error initializing Meta Pixel:", error);
      }
    };

    initializeTracking();
  }, []); // Empty deps array - only run on mount


  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProtectedRoute requireAuth><Profile /></ProtectedRoute>} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/manage" element={<ProtectedRoute requireAdmin><VideoManager /></ProtectedRoute>} />
          <Route path="/music" element={<Music />} />
          <Route path="/music/album/:albumId" element={<AlbumDetail />} />
          <Route path="/music/favorites" element={<Favorites />} />
          <Route path="/music/eps-singles" element={<EPsSingles />} />
          <Route path="/song-credits" element={<SongCredits />} />
          <Route path="/music/success" element={<PurchaseSuccess />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/shows/gallery" element={<Gallery />} />
          <Route path="/community" element={<CommunityHub />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merchant" element={<ProtectedRoute requireAdmin><Merchant /></ProtectedRoute>} />
          <Route path="/live-studio" element={<LiveStudio />} />
          <Route path="/community-hub" element={<CommunityHub />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/free-ep" element={<FreeEP />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/funnel/step-1" element={<Step1LeadCapture />} />
          <Route path="/funnel/step-2" element={<Step2ThankYou />} />
          <Route path="/funnel/step-3" element={<Step3SalesPage />} />
          <Route path="/funnel/step-5" element={<Step5Upsell />} />
          <Route path="/funnel/step-6" element={<Step6Downsell1 />} />
          <Route path="/funnel/step-9" element={<Step9ThankYouPurchase />} />
          <Route path="/funnel/step-10" element={<Step10PortalOnboarding />} />
          <Route path="/funnel/step-11" element={<Step11MerchUpsell />} />
          <Route path="/funnel/step-12" element={<Step12RewardsLoop />} />
          <Route path="/sales-sheets" element={<SalesSheets />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <FloatingChatbot />
        <GlobalMusicPlayer />
        <AbandonedCartPopup />
        <HealthOverlay />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
</ErrorBoundary>
  );
};

export default App;
