import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail_url: string;
  is_premium: boolean;
}

export default function Videos() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("");
  const [musicVideos, setMusicVideos] = useState<VideoItem[]>([]);
  const [behindTheScenes, setBehindTheScenes] = useState<VideoItem[]>([]);
  const [performances, setPerformances] = useState<VideoItem[]>([]);
  const [documentary, setDocumentary] = useState<VideoItem[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadVideos();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const loadVideos = async () => {
    // Load hero video
    const { data: heroData } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('category', 'hero')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (heroData) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(heroData.storage_path);
      setHeroVideoUrl(publicUrl);
    }

    // Load all other videos (excluding hero)
    const { data } = await supabase
      .from('videos')
      .select('id, title, subtitle, category, thumbnail_url, is_premium')
      .neq('category', 'hero')
      .order('created_at', { ascending: false });

    if (data) {
      setMusicVideos(data.filter(v => v.category === 'music_videos').map(v => ({
        id: v.id,
        title: v.title,
        subtitle: v.subtitle || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false
      })));
      
      setBehindTheScenes(data.filter(v => v.category === 'behind_the_scenes').map(v => ({
        id: v.id,
        title: v.title,
        subtitle: v.subtitle || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false
      })));
      
      setPerformances(data.filter(v => v.category === 'performances').map(v => ({
        id: v.id,
        title: v.title,
        subtitle: v.subtitle || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false
      })));
      
      setDocumentary(data.filter(v => v.category === 'documentary').map(v => ({
        id: v.id,
        title: v.title,
        subtitle: v.subtitle || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false
      })));
    }
  };

  const handleVideoClick = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Trailer Section - Apple TV Style */}
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <video
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover scale-[1.38]"
            src={heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        
        {/* Gradient Overlay - Subtle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Hero Content - Bottom left like Apple TV */}
        <div className="absolute inset-0 flex items-end justify-start p-8 sm:p-12 lg:p-16 pb-16 sm:pb-20 lg:pb-24">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight">
              Enter the Sol Portal...
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-md">
              Stream exclusive content and experience the music like never before.
            </p>
            <div className="flex flex-col items-start gap-3">
              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-100 text-black font-semibold px-8 py-4 text-base rounded-lg shadow-lg transition-all"
              >
                Accept Free Trial
              </Button>
              <p className="text-sm text-gray-300">
                7 days free, then $12.99/month.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Start Watching
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Sign up to access exclusive content and start watching.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button 
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold"
              onClick={() => navigate('/auth')}
            >
              Sign Up
            </Button>
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <button 
                onClick={() => navigate('/auth')}
                className="text-white hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Rows */}
      <div className="px-4 sm:px-8 lg:px-12 pb-16 space-y-12">
        {/* Performances Row */}
        <ContentRow
          title="Performances"
          items={performances}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* BTS Row */}
        <ContentRow
          title="Behind The Scenes"
          items={behindTheScenes}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* Music Videos Row */}
        <ContentRow
          title="Music Videos"
          items={musicVideos}
          aspectRatio="landscape-large"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* Documentary Row */}
        <ContentRow
          title="Documentary"
          items={documentary}
          aspectRatio="landscape"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          isPremium
          onVideoClick={handleVideoClick}
        />
      </div>
    </div>
  );
}

interface ContentRowProps {
  title: string;
  items: VideoItem[];
  aspectRatio: "portrait" | "landscape" | "landscape-large";
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  isPremium?: boolean;
  onVideoClick: () => void;
}

function ContentRow({ title, items, aspectRatio, hoveredId, setHoveredId, isPremium, onVideoClick }: ContentRowProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6">{title}</h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {items.map((item) => (
            <CarouselItem 
              key={item.id} 
              className={`pl-4 ${
                aspectRatio === "portrait" 
                  ? "basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-[12.5%]" 
                  : aspectRatio === "landscape-large"
                  ? "basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                  : "basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              }`}
            >
              <div
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={onVideoClick}
              >
                <div className="relative rounded-lg overflow-hidden mb-3 bg-card shadow-sm group-hover:shadow-glow transition-all duration-500 transform group-hover:scale-105">
                  <div className={`${
                    aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-video"
                   } bg-gradient-to-br from-card to-card-hover flex items-center justify-center relative`}>
                    {item.thumbnail_url && (
                      <img 
                        src={item.thumbnail_url} 
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-overlay opacity-60 group-hover:opacity-30 transition-opacity" />
                    
                    {/* Play button overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                      hoveredId === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}>
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-black ml-1" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Video info */}
                <div className="space-y-1">
                  <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
}
