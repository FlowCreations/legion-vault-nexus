import { Play, Heart, Share2, Pause, ArrowLeft, Lock, ShoppingCart, Link, Facebook, Twitter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { PurchaseModal } from "@/components/PurchaseModal";
import { usePurchases } from "@/hooks/usePurchases";
import { StripeCheckout } from "@/components/StripeCheckout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import acousticAlbum from "@/assets/acoustic-album.jpg";
import strippedAlbum from "@/assets/stripped-album.jpg";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setPlaylist, setCurrentTrack, setIsPlaying, toggleLike, isLiked } = useMusicPlayer();
  const { isPurchased, purchaseAlbum } = usePurchases();
  const { hasAccess } = useSubscription();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Listen to ${album?.title} by Sons of Legion`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  // Album data
  const albumsData = [
    { 
      id: "a1", 
      title: "Power", 
      year: "2024", 
      tracks: 5, 
      image: powerAlbum,
      price: 12,
      forSale: true,
      trackList: [
        { title: "Power", time: "2:43", url: "https://adammac.disco.ac/play/162365030/alias_pv_id/67836118/download2/trackfiles/592c1148-afa2-419c-af96-b5ffd94896d3.mp3?signature=bweI6I_Fd48JRK0HOVen47fAiRQ%3AG8sbnoKx" },
        { title: "Firestarter (Savage Remix)", time: "2:35", url: "https://adammac.disco.ac/play/162365031/alias_pv_id/67836118/download2/trackfiles/fad422fe-889a-4feb-a6ab-afa6c795c03d.mp3?signature=2jyR4puR2S8SE0M6T8RC0e2isT0%3AG8sbnoKx" },
        { title: "Brand New Day", time: "3:03", url: "https://adammac.disco.ac/play/162365027/alias_pv_id/67836118/download2/trackfiles/41c600e3-d127-413f-a12f-2720474ebd79.mp3?signature=-RZrOL2ZuLVk4j_2pAT9gvYexCM%3AG8sbnoKx" },
        { title: "Alive", time: "2:54", url: "https://adammac.disco.ac/play/162365025/alias_pv_id/67836118/download2/trackfiles/781544c2-ea73-44bb-90c9-4cc4e3347e88.mp3?signature=EQK651HbzL6kYV_bdj-Vs3oej3A%3AG8sbnoKx" },
        { title: "In The Air Tonight", time: "3:39", url: "https://adammac.disco.ac/play/162365028/alias_pv_id/67836118/download2/trackfiles/85e09a10-70e4-44cd-8439-701ed352d97a.mp3?signature=qQuWgSRrvsTyT4ogVUhd-q7IZPY%3AG8sbnoKx" },
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
      trackList: [
        { title: "Remember My Name", time: "3:44", url: "https://adammac.disco.ac/play/162200203/alias_pv_id/67836120/download2/trackfiles/de2c9cc6-a372-4ee2-980e-535a2f4a5f61.mp3?signature=Br_kLv18ECT8ZIJjPK9DJNARYto%3AT4ae0JGC" },
        { title: "Carolina", time: "4:31", url: "https://adammac.disco.ac/play/115244079/alias_pv_id/67836120/download2/trackfiles/b6462d0d-e71d-4d43-aa49-dbba3514f862.mp3?signature=uNIfHQIlgHyN0K_4wgN-v_bOMtY%3AT4ae0JGC" },
        { title: "Leave the Light On", time: "2:52", url: "https://adammac.disco.ac/play/162200201/alias_pv_id/67836120/download2/trackfiles/ee52357d-7ec6-40bb-9a55-1f43a6ac2c2b.mp3?signature=EsxgCz-lmftjI79HWKC985brJis%3AT4ae0JGC" },
        { title: "Real Thang", time: "2:25", url: "https://adammac.disco.ac/play/162200215/alias_pv_id/67836120/download2/trackfiles/74baf186-745d-49c2-88a5-5346063f14e8.mp3?signature=dyPzPJS6lDUDqPpuwVg3rcxNp6A%3AT4ae0JGC" },
        { title: "Strange", time: "3:51", url: "https://adammac.disco.ac/play/162200214/alias_pv_id/67836120/download2/trackfiles/25a79ca2-ca98-42dd-948a-871c54b319a8.mp3?signature=qHidiNzMZKSS5wI6mizbSYJzb94%3AT4ae0JGC" },
        { title: "Wild Horse", time: "3:35", url: "https://adammac.disco.ac/play/162200222/alias_pv_id/67836120/download2/trackfiles/6812a269-4c33-400e-b0c5-7b815f2bd26d.mp3?signature=OuIt55T1lWxYJ-0BRiFDUe-i9_M%3AT4ae0JGC" },
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

  const album = albumsData.find(a => a.id === albumId);
  const albumPurchased = album ? isPurchased(album.id) : false;
  
  // Power album (a1) is always free, other albums require premium_albums feature
  const isPowerAlbum = album?.id === 'a1';
  const hasAlbumAccess = isPowerAlbum || hasAccess('premium_albums');
  const isLocked = album?.forSale && !albumPurchased && !hasAlbumAccess;

  const handlePlayTrack = (track: any, trackList?: any[]) => {
    if (isLocked) return;
    if (!track.url) return;
    
    if (trackList) {
      const index = trackList.findIndex(t => t.title === track.title);
      setPlaylist(trackList, index);
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayAll = () => {
    if (isLocked) {
      setShowPurchaseModal(true);
      return;
    }
    if (album?.trackList && album.trackList.length > 0) {
      const tracksWithMetadata = album.trackList.map((track, i) => ({
        ...track,
        id: `${album.id}-${i}`,
        album: album.title,
        artist: "Sons of Legion",
        image: album.image
      }));
      handlePlayTrack(tracksWithMetadata[0], tracksWithMetadata);
    }
  };


  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Album not found</h1>
          <Button onClick={() => navigate('/music')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Music
          </Button>
        </div>
      </div>
    );
  }

  const tracksWithMetadata = album.trackList.map((track, i) => ({
    ...track,
    id: `${album.id}-${i}`,
    album: album.title,
    artist: "Sons of Legion",
    image: album.image
  }));

  return (
    <div className="min-h-screen pb-24">
      
      {/* Album Header */}
      <div className="relative bg-gradient-to-b from-primary/20 to-background pt-20 pb-8">
        <div className="px-4 sm:px-8 lg:px-12">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/music')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Music
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Album Cover */}
            <div className="w-64 h-64 flex-shrink-0 rounded-lg overflow-hidden shadow-glow">
              <img 
                src={album.image} 
                alt={album.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Album Info */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">ALBUM</p>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold mb-2">
                {album.title}
              </h1>
              {album.subtitle && (
                <p className="text-lg text-muted-foreground mb-4">{album.subtitle}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Sons of Legion</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{album.year}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{album.tracks} songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 sm:px-8 lg:px-12 py-6 bg-background/95 backdrop-blur sticky top-16 z-10 border-b border-border">
        <div className="flex items-center gap-4">
          {isLocked ? (
            <StripeCheckout
              albumId={album.id}
              albumTitle={album.title}
              price={album.price}
              onSuccess={() => {
                purchaseAlbum(album.id);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
            />
          ) : (
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
              onClick={handlePlayAll}
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Play
            </Button>
          )}
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
              <DropdownMenuItem onClick={handleShareFacebook}>
                <Facebook className="h-4 w-4 mr-2" />
                Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareTwitter}>
                <Twitter className="h-4 w-4 mr-2" />
                Share on Twitter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-4 sm:px-8 lg:px-12 py-8">
        {isLocked ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">Album Locked</h3>
              <p className="text-muted-foreground mb-6">
                Purchase this album to unlock all {album.tracks} tracks
              </p>
              <div className="space-y-3 mb-6 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Album Price:</span>
                  <span className="font-bold text-xl text-primary">${album.price}</span>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => setShowPurchaseModal(true)}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Purchase Album
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                🎭 Demo Mode - No actual payment required
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-4 px-4 pb-2 text-sm text-muted-foreground border-b border-border">
            <div className="w-10 text-center">#</div>
            <div className="w-10"></div>
            <div>TITLE</div>
            <div>TIME</div>
            <div className="w-10"></div>
          </div>

          {/* Track Rows */}
          {tracksWithMetadata.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track, tracksWithMetadata)}
                className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-4 px-4 py-3 rounded-lg hover:bg-card/50 transition-colors group cursor-pointer"
              >
                <div className="w-10 flex items-center justify-center">
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="w-4 h-4 fill-primary text-primary" />
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground group-hover:opacity-0 transition-opacity">
                        {index + 1}
                      </span>
                      <Play className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity fill-foreground" />
                    </>
                  )}
                </div>
                <div className="w-10 h-10 flex-shrink-0">
                  <img 
                    src={album.image} 
                    alt={album.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="min-w-0">
                  <div className={`font-medium truncate ${isCurrentTrack && isPlaying ? 'text-primary' : ''}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">Sons of Legion</div>
                </div>
                <div className="text-muted-foreground text-sm flex items-center">{track.time}</div>
                <div className="w-10 flex items-center justify-center">
                  <Heart 
                    className={`w-5 h-5 transition-colors cursor-pointer ${
                      isLiked(track.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(track.id);
                      toast({
                        title: isLiked(track.id) ? "Removed from favorites" : "Added to favorites",
                      });
                    }}
                  />
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>


      {album && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={() => {
            purchaseAlbum(album.id);
            setShowPurchaseModal(false);
          }}
          album={album}
        />
      )}
    </div>
  );
}
