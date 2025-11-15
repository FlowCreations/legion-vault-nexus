import { useState, useEffect } from "react";
import { Play, Lock, Shuffle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventTracking } from "@/hooks/useEventTracking";
import { Switch } from "@/components/ui/switch";
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
import { YouMightAlsoLike } from "@/components/YouMightAlsoLike";
import { useTranslation } from "react-i18next";
import { useVideos, useHeroVideo, useFavoriteVideos } from "@/hooks/useVideos";
import { usePagePerformance } from "@/hooks/usePagePerformance";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_premium: boolean;
  storage_path: string;
  category?: string;
}

export default function Videos() {
  usePagePerformance('Videos');
  const { trackEvent } = useEventTracking();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // Use React Query hooks for data fetching with caching
  const { data: heroVideoUrl = '', isLoading: heroLoading } = useHeroVideo();
  const { data: videoCategories, isLoading: videosLoading, refetch: refetchVideos } = useVideos();
  const { data: favoriteVideos = [], refetch: refetchFavorites } = useFavoriteVideos(userId);

  const [musicVideos, setMusicVideos] = useState<VideoItem[]>([]);
  const [behindTheScenes, setBehindTheScenes] = useState<VideoItem[]>([]);
  const [performances, setPerformances] = useState<VideoItem[]>([]);
  const [documentary, setDocumentary] = useState<VideoItem[]>([]);

  // Update local state when React Query data changes
  useEffect(() => {
    if (videoCategories) {
      const favoriteIds = new Set(favoriteVideos.map(v => v.id));
      
      if (showLikedOnly) {
        // Filter to show only liked videos
        setMusicVideos((videoCategories.musicVideos as VideoItem[]).filter(v => favoriteIds.has(v.id)));
        setBehindTheScenes((videoCategories.behindTheScenes as VideoItem[]).filter(v => favoriteIds.has(v.id)));
        setPerformances((videoCategories.performances as VideoItem[]).filter(v => favoriteIds.has(v.id)));
        setDocumentary((videoCategories.documentary as VideoItem[]).filter(v => favoriteIds.has(v.id)));
      } else {
        // Show all videos
        setMusicVideos(videoCategories.musicVideos as VideoItem[]);
        setBehindTheScenes(videoCategories.behindTheScenes as VideoItem[]);
        setPerformances(videoCategories.performances as VideoItem[]);
        setDocumentary(videoCategories.documentary as VideoItem[]);
      }
    }
  }, [videoCategories, favoriteVideos, showLikedOnly]);

  useEffect(() => {
    checkAuth();

    // Set up realtime subscription to invalidate cache when videos update
    const videosChannel = supabase
      .channel('videos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
        refetchVideos();
      })
      .subscribe();

    const favoritesChannel = supabase
      .channel('favorites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_favorites' }, () => {
        refetchFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(favoritesChannel);
    };
  }, [refetchVideos, refetchFavorites]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setUserId(session?.user?.id);
  };


  const handleVideoClick = async (video: VideoItem) => {
    console.log('Video clicked, authenticated:', isAuthenticated);
    
    trackEvent('video_view', {
      id: video.id,
      title: video.title,
      category: video.category,
      is_premium: video.is_premium
    });

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    // Check if user has active subscription
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: subscriptionData } = await supabase.functions.invoke('check-subscription');
      
      if (!subscriptionData?.subscribed) {
        // User is logged in but not subscribed - show subscribe prompt
        setShowAuthDialog(true);
        return;
      }
    }

    // Get the video URL from storage
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(video.storage_path);
    
    setSelectedVideo(video);
    setSelectedVideoUrl(publicUrl);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleShuffleToggle = () => {
    setIsShuffling(true);
    
    setTimeout(() => {
      if (!isShuffled && videoCategories) {
        setMusicVideos(shuffleArray(videoCategories.musicVideos as VideoItem[]));
        setBehindTheScenes(shuffleArray(videoCategories.behindTheScenes as VideoItem[]));
        setPerformances(shuffleArray(videoCategories.performances as VideoItem[]));
        setDocumentary(shuffleArray(videoCategories.documentary as VideoItem[]));
      } else if (videoCategories) {
        setMusicVideos(videoCategories.musicVideos as VideoItem[]);
        setBehindTheScenes(videoCategories.behindTheScenes as VideoItem[]);
        setPerformances(videoCategories.performances as VideoItem[]);
        setDocumentary(videoCategories.documentary as VideoItem[]);
      }
      setIsShuffled(!isShuffled);
      
      setTimeout(() => {
        setIsShuffling(false);
      }, 600);
    }, 300);
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
            {isAuthenticated ? (
              <>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight">
                  {t('videos.hero.welcome')}
                </h1>
                <p className="text-sm sm:text-base text-gray-200 mb-6 max-w-md">
                  {t('videos.hero.subtitle')}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight">
                  {t('videos.hero.enter')}
                </h1>
                <p className="text-sm sm:text-base text-gray-200 mb-6 max-w-md">
                  {t('videos.hero.subtitle')}
                </p>
                <div className="flex flex-col items-start gap-3">
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 text-sm rounded-lg shadow-lg gold-glow transition-all"
                    onClick={() => navigate('/subscribe')}
                  >
                    {t('videos.hero.acceptFreeTrial')}
                  </Button>
                  <p className="text-xs text-gray-300">
                    {t('videos.hero.freeTrialNote')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      {/* Auth/Subscribe Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {t('videos.dialog.title')}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {t('videos.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gold-glow"
              onClick={() => navigate('/subscribe')}
            >
              {t('videos.dialog.startFreeTrial')}
            </Button>
            <p className="text-center text-sm text-gray-400">
              {t('videos.dialog.alreadySubscribed')}{" "}
              <button 
                onClick={() => navigate('/auth')}
                className="text-primary hover:underline font-medium"
              >
                {t('videos.dialog.signIn')}
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
          category={selectedVideo.category}
        />
      )}

      {/* Content Rows */}
      <div className="px-4 sm:px-8 lg:px-12 pt-20 pb-16 space-y-12">
        {/* Filter Controls */}
        <div className="flex items-center justify-end gap-6 pb-4">
          {/* Liked Videos Filter */}
          <div className="flex items-center gap-3">
            <Heart className={`w-4 h-4 transition-all duration-300 ${showLikedOnly ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Liked Only</span>
            <Switch 
              checked={showLikedOnly} 
              onCheckedChange={setShowLikedOnly}
            />
          </div>

          {/* Shuffle Toggle */}
          <div className="flex items-center gap-3">
            <Shuffle className={`w-4 h-4 transition-all duration-300 ${isShuffled ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Shuffle</span>
            <Switch 
              checked={isShuffled} 
              onCheckedChange={handleShuffleToggle}
              disabled={isShuffling}
            />
          </div>
        </div>

        {/* Music Videos Row - FREE */}
        <ContentRow
          title={showLikedOnly ? t('videos.rows.likedMusicVideos') : t('videos.rows.musicVideos')}
          items={musicVideos}
          aspectRatio="landscape"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* Performances Row */}
        <ContentRow
          title={showLikedOnly ? t('videos.rows.likedPerformances') : t('videos.rows.performances')}
          items={performances}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* BTS Row */}
        <ContentRow
          title={showLikedOnly ? t('videos.rows.likedBehindTheScenes') : t('videos.rows.behindTheScenes')}
          items={behindTheScenes}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onVideoClick={handleVideoClick}
        />

        {/* Documentary Row */}
        <ContentRow
          title={showLikedOnly ? t('videos.rows.likedDocumentary') : t('videos.rows.documentary')}
          items={documentary}
          aspectRatio="landscape"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          isPremium
          onVideoClick={handleVideoClick}
        />

        {/* You Might Also Like */}
        <YouMightAlsoLike contentType="video" limit={5} />
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
  const [isShuffling, setIsShuffling] = useState(false);
  
  // Determine scroll threshold based on aspect ratio (approximate items visible on large screens)
  const scrollThreshold = aspectRatio === "portrait" ? 8 : aspectRatio === "landscape-large" ? 4 : 5;
  const showScrollButtons = items.length > scrollThreshold;

  useEffect(() => {
    setIsShuffling(true);
    const timer = setTimeout(() => setIsShuffling(false), 600);
    return () => clearTimeout(timer);
  }, [items]);
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
                className={`group cursor-pointer transition-all duration-500 ${
                  isShuffling ? 'animate-[scale-in_0.6s_ease-out]' : ''
                }`}
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
                      <div className="w-12 h-12 bg-primary/95 rounded-full flex items-center justify-center gold-glow">
                        <Play className="w-6 h-6 text-primary-foreground ml-1 fill-primary-foreground" />
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
        {showScrollButtons && (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        )}
      </Carousel>
    </div>
  );
}
