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
import { VideoPlayer } from "@/components/VideoPlayer";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_premium: boolean;
  storage_path: string;
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
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadVideos();

    // Set up realtime subscription to reload videos when they're updated
    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos'
        },
        (payload) => {
          console.log('Video change detected:', payload);
          // Reload videos whenever any change happens
          loadVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const loadVideos = async () => {
    console.log('Loading videos...');
    
    // Load hero video
    const { data: heroData, error: heroError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('category', 'hero')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (heroError) {
      console.error('Error loading hero video:', heroError);
    } else if (heroData) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(heroData.storage_path);
      setHeroVideoUrl(publicUrl);
    }

    // Load all other videos (excluding hero)
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, description, category, thumbnail_url, is_premium, storage_path')
      .neq('category', 'hero')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading videos:', error);
      return;
    }

    if (data) {
      console.log('Loaded videos:', data);
      
      setMusicVideos(data.filter(v => v.category === 'music_videos').map(v => ({
        id: v.id,
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false,
        storage_path: v.storage_path
      })));
      
      setBehindTheScenes(data.filter(v => v.category === 'behind_the_scenes').map(v => ({
        id: v.id,
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false,
        storage_path: v.storage_path
      })));
      
      setPerformances(data.filter(v => v.category === 'performances').map(v => ({
        id: v.id,
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false,
        storage_path: v.storage_path
      })));
      
      setDocumentary(data.filter(v => v.category === 'documentary').map(v => ({
        id: v.id,
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        is_premium: v.is_premium || false,
        storage_path: v.storage_path
      })));
    }
  };

  const handleVideoClick = async (video: VideoItem) => {
    console.log('Video clicked, authenticated:', isAuthenticated);
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    // Get the video URL from storage
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(video.storage_path);
    
    setSelectedVideo(video);
    setSelectedVideoUrl(publicUrl);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Trailer Section - Apple TV Style */}
      <div className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <video
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
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
        <div className="absolute inset-0 flex items-end justify-start pl-4 sm:pl-6 lg:pl-8 pr-8 pb-8 sm:pb-10 lg:pb-12">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight">
              Enter the SØL Portal
            </h1>
            <p className="text-sm sm:text-base text-gray-200 mb-6 max-w-md">
              Stream exclusive content and experience the{" "}
              <br className="hidden sm:inline" />
              music like never before.
            </p>
            <div className="flex flex-col items-start gap-3">
              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-100 text-black font-semibold px-8 py-4 text-sm rounded-lg shadow-lg transition-all"
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthDialog(true);
                  }
                }}
              >
                Accept Free Trial
              </Button>
              <p className="text-xs text-gray-300">
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

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.id}
          videoUrl={selectedVideoUrl}
          title={selectedVideo.title}
          description={selectedVideo.description}
          thumbnailUrl={selectedVideo.thumbnail_url}
          isOpen={!!selectedVideo}
          onClose={() => {
            setSelectedVideo(null);
            setSelectedVideoUrl("");
          }}
        />
      )}

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
  onVideoClick: (video: VideoItem) => void;
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
                onClick={() => onVideoClick(item)}
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
                    {item.description}
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
