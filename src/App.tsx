import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { AbandonedCartPopup } from "@/components/AbandonedCartPopup";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { initMetaPixel } from "@/lib/metaPixel";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { LiveChat } from "./components/LiveChat";
import { GlobalMusicPlayer } from "./components/GlobalMusicPlayer";
import { useAgent } from "./hooks/useAgent";
import { useDiagnostics } from "./hooks/useDiagnostics";
import { ErrorBoundary } from "./diagnostics/ErrorBoundary";
import { HealthOverlay } from "./components/diagnostics/HealthOverlay";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Videos = lazy(() => import("./pages/Videos"));
const VideoManager = lazy(() => import("./pages/VideoManager"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Music = lazy(() => import("./pages/Music"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const EPsSingles = lazy(() => import("./pages/EPsSingles"));
const SongCredits = lazy(() => import("./pages/SongCredits"));
const Shows = lazy(() => import("./pages/Shows"));
const Gallery = lazy(() => import("./pages/Gallery"));
const SalesSheets = lazy(() => import("./pages/SalesSheets"));
const Merch = lazy(() => import("./pages/Merch"));
const Merchant = lazy(() => import("./pages/Merchant"));
const LiveStudio = lazy(() => import("./pages/LiveStudio"));
const VODPage = lazy(() => import("./pages/VODPage"));
const StreamAnalyticsPage = lazy(() => import("./pages/StreamAnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CommunityHub = lazy(() => import("./pages/CommunityHub"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const FreeEP = lazy(() => import("./pages/FreeEP"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Step1LeadCapture = lazy(() => import("./pages/funnel/Step1LeadCapture"));
const Step2ThankYou = lazy(() => import("./pages/funnel/Step2ThankYou"));
const Step3SalesPage = lazy(() => import("./pages/funnel/Step3SalesPage"));
const Step5Upsell = lazy(() => import("./pages/funnel/Step5Upsell"));
const Step6Downsell1 = lazy(() => import("./pages/funnel/Step6Downsell1"));
const Step9ThankYouPurchase = lazy(() => import("./pages/funnel/Step9ThankYouPurchase"));
const Step10PortalOnboarding = lazy(() => import("./pages/funnel/Step10PortalOnboarding"));
const Step11MerchUpsell = lazy(() => import("./pages/funnel/Step11MerchUpsell"));
const Step12RewardsLoop = lazy(() => import("./pages/funnel/Step12RewardsLoop"));
const SmartCampaignBuilder = lazy(() => import("./pages/SmartCampaignBuilder"));


// Optimized loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  const pixelInitialized = useRef(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home onIntroChange={setShowIntro} />} />
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
              <Route path="/merchant/smart-campaigns" element={<ProtectedRoute requireAdmin><SmartCampaignBuilder /></ProtectedRoute>} />
              <Route path="/live-studio" element={<LiveStudio />} />
              <Route path="/vod" element={<VODPage />} />
              <Route path="/stream-analytics/:eventId" element={<StreamAnalyticsPage />} />
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
          </Suspense>
          {!showIntro && (
            <Footer 
              showDiagnostics={showDiagnostics} 
              setShowDiagnostics={setShowDiagnostics}
              isLiveChatOpen={isLiveChatOpen}
              setIsLiveChatOpen={setIsLiveChatOpen}
              hideChat={false}
            />
          )}
          <LiveChat isOpen={isLiveChatOpen} setIsOpen={setIsLiveChatOpen} />
          <GlobalMusicPlayer />
          <AbandonedCartPopup />
          <HealthOverlay showDiagnostics={showDiagnostics} />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
