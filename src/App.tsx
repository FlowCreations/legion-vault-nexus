import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { FloatingChatbot } from "./components/FloatingChatbot";
import { GlobalMusicPlayer } from "./components/GlobalMusicPlayer";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import VideoManager from "./pages/VideoManager";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Music from "./pages/Music";
import AlbumDetail from "./pages/AlbumDetail";
import SongCredits from "./pages/SongCredits";
import Shows from "./pages/Shows";
import Gallery from "./pages/Gallery";
import Community from "./pages/Community";
import Merch from "./pages/Merch";
import Merchant from "./pages/Merchant";
import LiveStudio from "./pages/LiveStudio";
import NotFound from "./pages/NotFound";
import CommunityHub from "./pages/CommunityHub";
import AdminDashboard from "./pages/AdminDashboard";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import FreeEP from "./pages/FreeEP";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/manage" element={<VideoManager />} />
          <Route path="/music" element={<Music />} />
          <Route path="/music/album/:albumId" element={<AlbumDetail />} />
          <Route path="/song-credits" element={<SongCredits />} />
          <Route path="/music/success" element={<PurchaseSuccess />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/shows/gallery" element={<Gallery />} />
          <Route path="/community" element={<CommunityHub />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merchant" element={<Merchant />} />
          <Route path="/live" element={<LiveStudio />} />
          <Route path="/community-hub" element={<CommunityHub />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/free-ep" element={<FreeEP />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <FloatingChatbot />
        <GlobalMusicPlayer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
