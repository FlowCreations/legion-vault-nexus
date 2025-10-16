import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import Music from "./pages/Music";
import AlbumDetail from "./pages/AlbumDetail";
import Shows from "./pages/Shows";
import Community from "./pages/Community";
import Merch from "./pages/Merch";
import Merchant from "./pages/Merchant";
import LiveStudio from "./pages/LiveStudio";
import NotFound from "./pages/NotFound";
import PurchaseSuccess from "./pages/PurchaseSuccess";

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
          <Route path="/videos" element={<Videos />} />
          <Route path="/music" element={<Music />} />
          <Route path="/music/album/:albumId" element={<AlbumDetail />} />
          <Route path="/music/success" element={<PurchaseSuccess />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/community" element={<Community />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merchant" element={<Merchant />} />
          <Route path="/live" element={<LiveStudio />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
