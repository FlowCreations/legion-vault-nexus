import { Heart, Play, Pause, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import acousticAlbum from "@/assets/acoustic-album.jpg";
import strippedAlbum from "@/assets/stripped-album.jpg";
import angelsSingle from "@/assets/angels-single.jpg";
import carolinaSingle from "@/assets/carolina-single.jpg";
import strangeSingle from "@/assets/strange-single.jpg";
import wildHorseSingle from "@/assets/wild-horse-single.jpg";
import realThangSingle from "@/assets/real-thang-single.jpg";
import walkingOnTheEdge from "@/assets/walking-on-the-edge.jpg";

export default function Favorites() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setPlaylist, setCurrentTrack, setIsPlaying, toggleLike, isLiked, likedTracks } = useMusicPlayer();

  // All available tracks across all albums
  const allTracks = [
    // Power Album
    { id: "a1-0", title: "Power", artist: "Sons of Legion", album: "Power", time: "2:43", url: "https://adammac.disco.ac/play/162365030/alias_pv_id/67836118/download2/trackfiles/592c1148-afa2-419c-af96-b5ffd94896d3.mp3?signature=bweI6I_Fd48JRK0HOVen47fAiRQ%3AG8sbnoKx", image: powerAlbum },
    { id: "a1-1", title: "Firestarter (Savage Remix)", artist: "Sons of Legion", album: "Power", time: "2:35", url: "https://adammac.disco.ac/play/162365031/alias_pv_id/67836118/download2/trackfiles/fad422fe-889a-4feb-a6ab-afa6c795c03d.mp3?signature=2jyR4puR2S8SE0M6T8RC0e2isT0%3AG8sbnoKx", image: powerAlbum },
    { id: "a1-2", title: "Brand New Day", artist: "Sons of Legion", album: "Power", time: "3:03", url: "https://adammac.disco.ac/play/162365027/alias_pv_id/67836118/download2/trackfiles/41c600e3-d127-413f-a12f-2720474ebd79.mp3?signature=-RZrOL2ZuLVk4j_2pAT9gvYexCM%3AG8sbnoKx", image: powerAlbum },
    { id: "a1-3", title: "Alive", artist: "Sons of Legion", album: "Power", time: "2:54", url: "https://adammac.disco.ac/play/162365025/alias_pv_id/67836118/download2/trackfiles/781544c2-ea73-44bb-90c9-4cc4e3347e88.mp3?signature=EQK651HbzL6kYV_bdj-Vs3oej3A%3AG8sbnoKx", image: powerAlbum },
    { id: "a1-4", title: "In The Air Tonight", artist: "Sons of Legion", album: "Power", time: "3:39", url: "https://adammac.disco.ac/play/162365028/alias_pv_id/67836118/download2/trackfiles/85e09a10-70e4-44cd-8439-701ed352d97a.mp3?signature=qQuWgSRrvsTyT4ogVUhd-q7IZPY%3AG8sbnoKx", image: powerAlbum },
    
    // Outlaw Album
    { id: "a2-0", title: "Remember My Name", artist: "Sons of Legion", album: "Outlaw", time: "3:44", url: "https://adammac.disco.ac/play/162200203/alias_pv_id/67836120/download2/trackfiles/de2c9cc6-a372-4ee2-980e-535a2f4a5f61.mp3?signature=Br_kLv18ECT8ZIJjPK9DJNARYto%3AT4ae0JGC", image: outlawAlbum },
    { id: "a2-1", title: "Carolina", artist: "Sons of Legion", album: "Outlaw", time: "4:31", url: "https://adammac.disco.ac/play/115244079/alias_pv_id/67836120/download2/trackfiles/b6462d0d-e71d-4d43-aa49-dbba3514f862.mp3?signature=uNIfHQIlgHyN0K_4wgN-v_bOMtY%3AT4ae0JGC", image: carolinaSingle },
    { id: "a2-2", title: "Leave the Light On", artist: "Sons of Legion", album: "Outlaw", time: "2:52", url: "https://adammac.disco.ac/play/162200201/alias_pv_id/67836120/download2/trackfiles/ee52357d-7ec6-40bb-9a55-1f43a6ac2c2b.mp3?signature=EsxgCz-lmftjI79HWKC985brJis%3AT4ae0JGC", image: outlawAlbum },
    { id: "a2-3", title: "Real Thang", artist: "Sons of Legion", album: "Outlaw", time: "2:25", url: "https://adammac.disco.ac/play/162200215/alias_pv_id/67836120/download2/trackfiles/74baf186-745d-49c2-88a5-5346063f14e8.mp3?signature=dyPzPJS6lDUDqPpuwVg3rcxNp6A%3AT4ae0JGC", image: realThangSingle },
    { id: "a2-4", title: "Strange", artist: "Sons of Legion", album: "Outlaw", time: "3:51", url: "https://adammac.disco.ac/play/162200214/alias_pv_id/67836120/download2/trackfiles/25a79ca2-ca98-42dd-948a-871c54b319a8.mp3?signature=qHidiNzMZKSS5wI6mizbSYJzb94%3AT4ae0JGC", image: strangeSingle },
    { id: "a2-5", title: "Wild Horse", artist: "Sons of Legion", album: "Outlaw", time: "3:35", url: "https://adammac.disco.ac/play/162200222/alias_pv_id/67836120/download2/trackfiles/6812a269-4c33-400e-b0c5-7b815f2bd26d.mp3?signature=OuIt55T1lWxYJ-0BRiFDUe-i9_M%3AT4ae0JGC", image: wildHorseSingle },
    { id: "a2-6", title: "Outlaw", artist: "Sons of Legion", album: "Outlaw", time: "3:23", url: "https://adammac.disco.ac/play/162200207/alias_pv_id/67836120/download2/trackfiles/b92d1ab5-205f-43df-95e4-b23f906929ce.mp3?signature=GS_ZLIC4t2qHvu7ILvH_VgRNt58%3AT4ae0JGC", image: outlawAlbum },
    { id: "a2-7", title: "Runnin'", artist: "Sons of Legion", album: "Outlaw", time: "2:16", url: "https://adammac.disco.ac/play/162200211/alias_pv_id/67836120/download2/trackfiles/c90f4ef9-2618-4aa2-b03c-3af6b98083ad.mp3?signature=qNewXqY3byqmnjp-aQRkSsyFFwc%3AT4ae0JGC", image: outlawAlbum },

    // Singles from Music page
    { id: "1", title: "In The Air Tonight", artist: "Sons of Legion", album: "Power", time: "3:42", url: "https://adammac.disco.ac/play/162365028/alias_pv_id/67836118/download2/trackfiles/85e09a10-70e4-44cd-8439-701ed352d97a.mp3?signature=qQuWgSRrvsTyT4ogVUhd-q7IZPY%3AG8sbnoKx", image: powerAlbum },
    { id: "2", title: "Fire Starter", artist: "Sons of Legion", album: "Power", time: "2:28", url: "https://adammac.disco.ac/play/162365031/alias_pv_id/67836118/download2/trackfiles/fad422fe-889a-4feb-a6ab-afa6c795c03d.mp3?signature=2jyR4puR2S8SE0M6T8RC0e2isT0%3AG8sbnoKx", image: powerAlbum },
    { id: "3", title: "Strange", artist: "Sons of Legion", album: "Outlaw", time: "3:51", url: "https://adammac.disco.ac/play/162200214/alias_pv_id/67836120/download2/trackfiles/25a79ca2-ca98-42dd-948a-871c54b319a8.mp3?signature=qHidiNzMZKSS5wI6mizbSYJzb94%3AT4ae0JGC", image: outlawAlbum },
    { id: "4", title: "Power", artist: "Sons of Legion", album: "Power", time: "2:43", url: "https://adammac.disco.ac/play/162365030/alias_pv_id/67836118/download2/trackfiles/592c1148-afa2-419c-af96-b5ffd94896d3.mp3?signature=bweI6I_Fd48JRK0HOVen47fAiRQ%3AG8sbnoKx", image: powerAlbum },
    { id: "5", title: "Carolina", artist: "Sons of Legion", album: "Outlaw", time: "4:31", url: "https://adammac.disco.ac/play/115244079/alias_pv_id/67836120/download2/trackfiles/b6462d0d-e71d-4d43-aa49-dbba3514f862.mp3?signature=uNIfHQIlgHyN0K_4wgN-v_bOMtY%3AT4ae0JGC", image: carolinaSingle },
    { id: "6", title: "Walking On The Edge", artist: "Sons of Legion", album: "Singles", time: "4:27", url: "https://adammac.disco.ac/play/162200218/alias_pv_id/67836120/download2/trackfiles/4c2a9d4c-4a67-4a0e-b35c-2ef31bd8e9be.mp3?signature=K-TYpA8GqiVpwSaOx0aS-pUV2lw%3AT4ae0JGC", image: walkingOnTheEdge },
    { id: "7", title: "Remember My Name", artist: "Sons of Legion", album: "Outlaw", time: "3:44", url: "https://adammac.disco.ac/play/162200203/alias_pv_id/67836120/download2/trackfiles/de2c9cc6-a372-4ee2-980e-535a2f4a5f61.mp3?signature=Br_kLv18ECT8ZIJjPK9DJNARYto%3AT4ae0JGC", image: outlawAlbum },
    { id: "8", title: "Leave the Light On", artist: "Sons of Legion", album: "Outlaw", time: "2:52", url: "https://adammac.disco.ac/play/162200201/alias_pv_id/67836120/download2/trackfiles/ee52357d-7ec6-40bb-9a55-1f43a6ac2c2b.mp3?signature=EsxgCz-lmftjI79HWKC985brJis%3AT4ae0JGC", image: outlawAlbum },
  ];

  // Filter to only show liked tracks
  const likedTracksList = allTracks.filter(track => isLiked(track.id));

  const handlePlayTrack = (track: any, trackList: any[]) => {
    const index = trackList.findIndex(t => t.id === track.id);
    setPlaylist(trackList, index);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen pb-24 pt-20">
      <div className="px-4 sm:px-8 lg:px-12">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/music')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Music
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold mb-4">
            Favorites
          </h1>
          <p className="text-muted-foreground">
            {likedTracksList.length} {likedTracksList.length === 1 ? 'song' : 'songs'}
          </p>
        </div>

        {likedTracksList.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start liking songs to build your favorites collection
            </p>
            <Button onClick={() => navigate('/music')}>
              Browse Music
            </Button>
          </div>
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
            {likedTracksList.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track, likedTracksList)}
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
                      src={track.image} 
                      alt={track.album}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className={`font-medium truncate ${isCurrentTrack && isPlaying ? 'text-primary' : ''}`}>
                      {track.title}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{track.artist} • {track.album}</div>
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center">{track.time}</div>
                  <div className="w-10 flex items-center justify-center">
                    <Heart 
                      className="w-5 h-5 fill-red-500 text-red-500 cursor-pointer hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track.id);
                        toast({ title: "Removed from favorites" });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
