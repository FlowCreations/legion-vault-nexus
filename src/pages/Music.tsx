import { Play, Shuffle, Heart, Share2, MoreHorizontal, Plus, Pause, Lock, ShoppingCart, Download, Link, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { PurchaseModal } from "@/components/PurchaseModal";
import { usePurchases } from "@/hooks/usePurchases";
import { StripeCheckout } from "@/components/StripeCheckout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { YouMightAlsoLike } from "@/components/YouMightAlsoLike";
import { useEventTracking } from "@/hooks/useEventTracking";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import acousticAlbum from "@/assets/acoustic-album.jpg";
import strippedAlbum from "@/assets/stripped-album.jpg";
import walkingOnTheEdge from "@/assets/walking-on-the-edge.jpg";
import angelsSingle from "@/assets/angels-single.jpg";
import strangeSingle from "@/assets/strange-single.jpg";
import wildHorseSingle from "@/assets/wild-horse-single.jpg";
import carolinaSingle from "@/assets/carolina-single.jpg";
import realThangSingle from "@/assets/real-thang-single.jpg";
import musicHero from "@/assets/music-hero.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Music() {
  const { trackEvent } = useEventTracking();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setPlaylist, setCurrentTrack, setIsPlaying, togglePlayPause, toggleLike, isLiked, likedTracks } = useMusicPlayer();
  const { isPurchased, purchaseAlbum, purchasedAlbums } = usePurchases();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const { toast } = useToast();

  const handleShuffle = () => {
    const allTracks = [...topTracks, ...albums.filter(a => a.url)];
    const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled, 0);
    if (shuffled.length > 0) {
      setIsPlaying(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    } catch (err) {
      toast({ 
        title: "Unable to copy", 
        description: "Please copy the link manually",
        variant: "destructive" 
      });
    }
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(`Check out Sons of Legion music! ${window.location.href}`);
    window.location.href = `sms:?&body=${text}`;
  };


  const handlePlayTrack = (track: any, trackList?: any[]) => {
    if (!track.url) {
      console.warn('Track has no URL:', track);
      return;
    }
    
    trackEvent('music_play', {
      title: track.title,
      artist: track.artist,
      album: track.album
    });
    
    if (trackList) {
      const index = trackList.findIndex(t => t.id === track.id);
      setPlaylist(trackList, index);
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
  };


  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={musicHero} 
            alt="Sons of Legion"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-12 pb-8">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            Sons of Legion
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 rounded-full px-8"
              onClick={() => {
                const firstTrack = topTracks[0];
                handlePlayTrack(firstTrack, topTracks);
              }}
            >
              <Play className="w-5 h-5 mr-2 fill-black" />
              Play
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-full px-6"
              onClick={handleShuffle}
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Shuffle
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/music/favorites')}
              className="rounded-full"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({likedTracks.size})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="rounded-full"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareSMS}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send via Messages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 lg:px-12 pb-16">
        {/* Top Tracks */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Tracks</h2>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              View all
            </Button>
          </div>

          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] md:grid-cols-[auto_auto_1fr_1fr_1fr_auto_auto_auto] gap-4 px-4 pb-2 text-sm text-muted-foreground border-b border-border">
              <div className="w-10"></div>
              <div className="w-10"></div>
              <div>TITLE</div>
              <div className="hidden md:block">ARTIST</div>
              <div className="hidden md:block">ALBUM</div>
              <div>TIME</div>
              <div className="w-10"></div>
              <div className="w-10"></div>
            </div>

            {/* Track Rows */}
            {topTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const trackLiked = isLiked(track.id);
              return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track, topTracks)}
                className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] md:grid-cols-[auto_auto_1fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 rounded-lg hover:bg-card/50 transition-colors group cursor-pointer items-center"
              >
                <div className="w-10 h-10 flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-card to-card-hover rounded flex items-center justify-center relative overflow-hidden">
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-4 h-4 fill-primary text-primary" />
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity">
                          {index + 1}
                        </span>
                        <Play className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity fill-foreground" />
                      </>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 flex-shrink-0">
                  {track.image ? (
                    <img 
                      src={track.image} 
                      alt={track.album}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-card to-card-hover rounded" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`font-medium truncate ${isCurrentTrack && isPlaying ? 'text-primary' : ''}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-muted-foreground md:hidden truncate">{track.artist}</div>
                </div>
                <div className="hidden md:block text-muted-foreground truncate">{track.artist}</div>
                <div className="hidden md:block text-muted-foreground truncate">{track.album}</div>
                <div className="text-muted-foreground text-sm flex items-center">{track.time}</div>
                <div className="w-10 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Create invisible anchor for download without navigation
                      const link = document.createElement('a');
                      link.href = track.url;
                      link.download = `${track.title} - ${track.artist}.mp3`;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
                <div className="w-10 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${trackLiked ? 'fill-red-500 text-red-500 opacity-100' : 'text-muted-foreground hover:text-foreground'}`} />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* EP & Singles */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">EP & Singles</h2>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/music/eps-singles")}
            >
              View all
            </Button>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {albums.map((album) => {
                const isCurrentTrack = currentTrack?.id === album.id;
                return (
                <CarouselItem key={album.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <div 
                    className="group cursor-pointer"
                    onClick={() => album.url && handlePlayTrack(album, albums.filter(a => a.url))}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-card shadow-sm group-hover:shadow-glow transition-all duration-500 relative">
                      {album.image ? (
                        <img 
                          src={album.image} 
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center">
                          {/* Placeholder */}
                          <div className="text-center text-muted-foreground">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="font-serif text-2xl">{album.title[0]}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="w-6 h-6 text-black fill-black" />
                          ) : (
                            <Play className="w-6 h-6 text-black ml-1 fill-black" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{album.year}</p>
                    </div>
                  </div>
                </CarouselItem>
              );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>

        {/* Albums */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Albums</h2>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              View all
            </Button>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {moreAlbums.map((album) => {
                const firstTrack = album.trackList?.[0];
                const isCurrentAlbum = currentTrack?.id === `${album.id}-0`;
                const albumPurchased = isPurchased(album.id);
                const isLocked = album.forSale && !albumPurchased;
                
                const handleAlbumClick = () => {
                  if (isLocked) {
                    setSelectedAlbum(album);
                    setShowPurchaseModal(true);
                  } else {
                    navigate(`/music/album/${album.id}`);
                  }
                };
                
                return (
                <CarouselItem key={album.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <div 
                    className="group cursor-pointer relative"
                    onClick={handleAlbumClick}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-card shadow-cinematic group-hover:shadow-gold transition-all duration-200 relative">
                      {album.image ? (
                        <img 
                          src={album.image} 
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="font-sans text-2xl">{album.title[0]}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Purchased badge */}
                      {albumPurchased && (
                        <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                          UNLOCKED
                        </div>
                      )}
                      
                      {/* Lock overlay for locked albums */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      {!isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform">
                            {isCurrentAlbum && isPlaying ? (
                              <Pause className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                            ) : (
                              <Play className="w-6 h-6 text-primary-foreground ml-1 fill-primary-foreground" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {album.title}
                        </h3>
                        {isLocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                      </div>
                      {album.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{album.subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {album.year} • {album.tracks} tracks
                      </p>
                      {isLocked && (
                        <div className="flex items-center gap-2 mt-2">
                          <StripeCheckout
                            albumId={album.id}
                            albumTitle={album.title}
                            price={album.price}
                            onSuccess={() => {
                              purchaseAlbum(album.id);
                            }}
                            className="h-7 text-xs px-3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>

        {/* You Might Also Like */}
        <YouMightAlsoLike contentType="music" limit={5} />
      </div>


      {selectedAlbum && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={() => purchaseAlbum(selectedAlbum.id)}
          album={selectedAlbum}
        />
      )}
    </div>
  );
}

// Top tracks based on Spotify popularity
const topTracks = [
  { id: "1", title: "In The Air Tonight", artist: "Sons of Legion", album: "Power", time: "3:42", url: "https://s.disco.ac/xpokdtzwgtpy", image: powerAlbum },
  { id: "2", title: "Fire Starter", artist: "Sons of Legion", album: "Power", time: "2:28", url: "https://s.disco.ac/gihjknbnqoio", image: powerAlbum },
  { id: "3", title: "Strange", artist: "Sons of Legion", album: "Outlaw", time: "3:51", url: "https://s.disco.ac/wkkrjkmhrlja", image: outlawAlbum },
  { id: "4", title: "Power", artist: "Sons of Legion", album: "Power", time: "2:43", url: "https://s.disco.ac/ujlhdevhkqjd", image: powerAlbum },
  { id: "5", title: "Carolina", artist: "Sons of Legion", album: "Outlaw", time: "4:31", url: "https://s.disco.ac/euvpwesrokvn", image: carolinaSingle },
  { id: "6", title: "Walking On The Edge", artist: "Sons of Legion", album: "Singles", time: "4:27", url: "https://s.disco.ac/bmjenhxmtbkm", image: walkingOnTheEdge },
  { id: "7", title: "Remember My Name", artist: "Sons of Legion", album: "Outlaw", time: "3:44", url: "https://s.disco.ac/dwwnvhlcprqx", image: outlawAlbum },
  { id: "8", title: "Leave the Light On", artist: "Sons of Legion", album: "Outlaw", time: "2:52", url: "https://s.disco.ac/njbhbmqnaggo", image: outlawAlbum },
];

// EP & Singles
const albums = [
  { id: "1", title: "Walking On The Edge", artist: "Sons of Legion", album: "Walking On The Edge", year: "2024", time: "4:27", url: "https://s.disco.ac/bmjenhxmtbkm", image: walkingOnTheEdge, discoUrl: "https://adammac.disco.ac/playlist-new/23076836?date=20251016&user_id=106301&signature=nCPHIMkw2dpaw5jPYMEvngK_y_4%3AojJ1YOQp" },
  { id: "2", title: "Angels", artist: "Sons of Legion", album: "Angels", year: "2024", time: "3:17", url: "https://s.disco.ac/lpdfkmyunhee", image: angelsSingle, discoUrl: "https://adammac.disco.ac/track-new/145967537?user_id=106301&signature=TNasBvrvRq-ZxCX0EnGbUOdKMEA%3AloK3GCDD" },
  { id: "3", title: "Strange", artist: "Sons of Legion", album: "Strange", year: "2024", time: "3:51", url: "https://s.disco.ac/wkkrjkmhrlja", image: strangeSingle, discoUrl: "https://adammac.disco.ac/track-new/21205805?user_id=106301&signature=lZKqw6EG0PMI0yM9Q6NDNj6Ytr0%3AojJ1YOQp" },
  { id: "4", title: "Wild Horse", artist: "Sons of Legion", album: "Wild Horse", year: "2024", time: "3:35", url: "https://s.disco.ac/hqmyxiorexxy", image: wildHorseSingle, discoUrl: "https://adammac.disco.ac/track-new/162200222?user_id=106301&signature=idXzBggi1hJutONL8y2TIebUVAE%3AlycuhXaN" },
  { id: "5", title: "Carolina", artist: "Sons of Legion", album: "Carolina", year: "2024", time: "4:31", url: "https://s.disco.ac/euvpwesrokvn", image: carolinaSingle, discoUrl: "https://adammac.disco.ac/track-new/115244079?user_id=106301&signature=svrlD1mmWktva9FS8lUm4T19wQQ%3Acd2gyInx" },
  { id: "6", title: "REAL THANG", artist: "Sons of Legion", album: "REAL THANG", year: "2024", time: "2:25", url: "https://s.disco.ac/dditjyzahhbp", image: realThangSingle, discoUrl: "https://adammac.disco.ac/track-new/26434311?user_id=106301&signature=e4SOiwX5toE7wVhyhO9KrmUhTjE%3A4bkLaONY" },
  { id: "7", title: "Leave the Light On", artist: "Sons of Legion", album: "Leave the Light On", year: "2023", time: "2:52", url: "https://s.disco.ac/njbhbmqnaggo", image: outlawAlbum },
  { id: "8", title: "In The Air Tonight", artist: "Sons of Legion", album: "In The Air Tonight", year: "2023", time: "3:39", url: "https://s.disco.ac/xpokdtzwgtpy", image: powerAlbum },
];

const moreAlbums = [
  { 
    id: "a1", 
    title: "Power", 
    year: "2024", 
    tracks: 5, 
    image: powerAlbum,
    price: 12,
    forSale: true,
    discoUrl: "https://s.disco.ac/docvmkfmfdlv",
    trackList: [
      { title: "Power", time: "2:43", url: "https://s.disco.ac/ujlhdevhkqjd" },
      { title: "Firestarter (Savage Remix)", time: "2:35", url: "https://s.disco.ac/gihjknbnqoio" },
      { title: "Brand New Day", time: "3:03", url: "https://s.disco.ac/ysjsererpezj" },
      { title: "Alive", time: "2:54", url: "https://s.disco.ac/xpawhmjtbqeu" },
      { title: "In The Air Tonight", time: "3:39", url: "https://s.disco.ac/xpokdtzwgtpy" },
    ]
  },
  { 
    id: "a2", 
    title: "Outlaw", 
    year: "2024", 
    tracks: 8, 
    image: outlawAlbum,
    price: 12,
    forSale: true,
    discoUrl: "https://s.disco.ac/oqixhqdabaqb",
    trackList: [
      { title: "Remember My Name", time: "3:44", url: "https://s.disco.ac/dwwnvhlcprqx" },
      { title: "Carolina", time: "4:31", url: "https://s.disco.ac/euvpwesrokvn" },
      { title: "Leave the Light On", time: "2:52", url: "https://s.disco.ac/njbhbmqnaggo" },
      { title: "Real Thang", time: "2:25", url: "https://s.disco.ac/dditjyzahhbp" },
      { title: "Strange", time: "3:51", url: "https://s.disco.ac/wkkrjkmhrlja" },
      { title: "Wild Horse", time: "3:35", url: "https://s.disco.ac/hqmyxiorexxy" },
      { title: "Outlaw", time: "3:23", url: "https://adammac.disco.ac/play/162200207/alias_pv_id/67836120/download2/trackfiles/b92d1ab5-205f-43df-95e4-b23f906929ce.mp3?signature=GS_ZLIC4t2qHvu7ILvH_VgRNt58%3AT4ae0JGC" },
      { title: "Runnin'", time: "2:16", url: "https://adammac.disco.ac/play/162200211/alias_pv_id/67836120/download2/trackfiles/c90f4ef9-2618-4aa2-b03c-3af6b98083ad.mp3?signature=qNewXqY3byqmnjp-aQRkSsyFFwc%3AT4ae0JGC" },
    ]
  },
  { 
    id: "a3", 
    title: "Live from the Barn", 
    subtitle: "Acoustic Sessions - Nashville, TN", 
    year: "2023", 
    tracks: 8, 
    image: acousticAlbum,
    price: 15,
    forSale: true,
    discoUrl: "https://s.disco.ac/ksoaykgawuro",
    trackList: [
      { title: "Outlaw", time: "3:04", url: "https://adammac.disco.ac/play/162974091/alias_pv_id/67836113/download2/trackfiles/d6eefac5-ba37-4aac-b4a5-dd79c5d8d1fa.mp3?signature=wU5LzTKfYLyXuRco56rQWBxEGG8%3AXKvIltzO" },
      { title: "Carolina", time: "4:27", url: "https://adammac.disco.ac/play/162974101/alias_pv_id/67836113/download2/trackfiles/53e37644-b0fb-4445-b2af-f42c4b406219.mp3?signature=vmoyFd9YkzBeH2wqGCENgmfl0P8%3AXKvIltzO" },
      { title: "Angels", time: "3:17", url: "https://adammac.disco.ac/play/162974097/alias_pv_id/67836113/download2/trackfiles/80ac6ce5-0bdb-46ff-a0a5-f176d6ec9649.mp3?signature=6Zbu55JNBOALMsW09Nq3tmtgTLQ%3AXKvIltzO" },
      { title: "In the Air Tonight", time: "3:24", url: "https://adammac.disco.ac/play/162974093/alias_pv_id/67836113/download2/trackfiles/accf855b-fe96-41d5-94ce-79fa334bf62c.mp3?signature=rRRDYsjavIeme7t3i97up5YbhB4%3AXKvIltzO" },
      { title: "Wild Horse", time: "3:26", url: "https://adammac.disco.ac/play/162974095/alias_pv_id/67836113/download2/trackfiles/6035f37d-e196-4a5f-bdb0-3731f3ab8c31.mp3?signature=zpqtkrSiphf-TWgAjknKbo9JQH0%3AXKvIltzO" },
      { title: "Strange", time: "3:10", url: "https://adammac.disco.ac/play/162974094/alias_pv_id/67836113/download2/trackfiles/27f33198-0b22-44c3-bdbd-7c9b6bff47b1.mp3?signature=uNVSpzimzWeEbn5JF2_9GVw6L8c%3AXKvIltzO" },
      { title: "Sweet Dreams", time: "2:54", url: "https://adammac.disco.ac/play/162974092/alias_pv_id/67836113/download2/trackfiles/03147c2c-db9b-483e-9c45-b056549bb73e.mp3?signature=lAndjKEjKgYkHD_83U_D_ohkNt4%3AXKvIltzO" },
      { title: "Brand New Day", time: "3:09", url: "https://adammac.disco.ac/play/162974096/alias_pv_id/67836113/download2/trackfiles/759560f4-44d6-4069-bb5d-1a2cdad48273.mp3?signature=KMRwkezM4fiXUuwyKiKaspWABy4%3AXKvIltzO" },
    ]
  },
  { 
    id: "a4", 
    title: "Stripped", 
    subtitle: "Intimate Performances", 
    year: "2023", 
    tracks: 8, 
    image: strippedAlbum,
    price: 12,
    forSale: true,
    discoUrl: "https://s.disco.ac/vmgbpqtmvdtu",
    trackList: [
      { title: "Carry Me Home (Stripped)", time: "2:25", url: "https://adammac.disco.ac/play/163224609/alias_pv_id/67836117/download2/trackfiles/730f5670-d9d3-413d-8fd7-64449f49953b.mp3?signature=EJ3P4dMKRSLg4v4QJeTZScCzndw%3A9rXnXUXm" },
      { title: "Fall From Grace (Stripped)", time: "3:58", url: "https://adammac.disco.ac/play/163224610/alias_pv_id/67836117/download2/trackfiles/d000279c-4158-4e81-a41a-db14a4c880a4.mp3?signature=_Eb1bX4lViaXMT1oSeOsOYN-dkw%3A9rXnXUXm" },
      { title: "Firestarter (Stripped)", time: "2:25", url: "https://adammac.disco.ac/play/163224607/alias_pv_id/67836117/download2/trackfiles/9cd2cc3c-b6ce-4148-bebc-7f3385aaa9ff.mp3?signature=pgkJbgC_1O8gxXL5zBKoNDmW4rQ%3A9rXnXUXm" },
      { title: "Hallelujah (Stripped)", time: "4:04", url: "https://adammac.disco.ac/play/163224611/alias_pv_id/67836117/download2/trackfiles/2ea8fcf0-8eb6-4e9a-8f84-ab88bd7388de.mp3?signature=6r4VqVWW19xsHIrfaq1Ar4qx9wU%3A9rXnXUXm" },
      { title: "Leave the Light On (Stripped)", time: "2:31", url: "https://adammac.disco.ac/play/163224613/alias_pv_id/67836117/download2/trackfiles/64f33bda-1143-42a5-b768-a96604baba58.mp3?signature=J6bAinkAHkBtKfyBZtZu0Qb49hM%3A9rXnXUXm" },
      { title: "Power (Stripped)", time: "2:28", url: "https://adammac.disco.ac/play/163224612/alias_pv_id/67836117/download2/trackfiles/9f1378e1-2e14-4c13-b820-17d61c22f43b.mp3?signature=CjQxo10y1txSKZWhiGZ8COGn76o%3A9rXnXUXm" },
      { title: "Remember My Name (Stripped)", time: "3:33", url: "https://adammac.disco.ac/play/163224614/alias_pv_id/67836117/download2/trackfiles/cf215367-c3f5-4cdb-a8f7-cecf09ca814e.mp3?signature=WIit85VDb1tlEc4CmG1wf769Ths%3A9rXnXUXm" },
      { title: "Wishing Well (Stripped)", time: "2:40", url: "https://adammac.disco.ac/play/163224615/alias_pv_id/67836117/download2/trackfiles/c26802a7-8933-4a78-9aec-ff3e52668683.mp3?signature=DfQPcSP_BGeQDcq2tKQVvrAcLCo%3A9rXnXUXm" },
    ]
  },
];
