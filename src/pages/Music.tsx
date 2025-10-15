import { Play, Shuffle, Heart, Share2, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import powerAlbum from "@/assets/power-album.jpg";
import outlawAlbum from "@/assets/outlaw-album.jpg";
import acousticAlbum from "@/assets/acoustic-album.jpg";
import strippedAlbum from "@/assets/stripped-album.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Music() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background-dark">
          {/* Background pattern or album art would go here */}
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-12 pb-8">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            Sons of Legion
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-8">
              <Play className="w-5 h-5 mr-2 fill-black" />
              Play
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-6">
              <Shuffle className="w-5 h-5 mr-2" />
              Shuffle
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full">
              <Plus className="w-5 h-5 mr-2" />
              Follow
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full">
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full w-12 h-12 p-0">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
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
            <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-4 pb-2 text-sm text-muted-foreground border-b border-border">
              <div className="w-10"></div>
              <div>TITLE</div>
              <div className="hidden md:block">ARTIST</div>
              <div className="hidden md:block">ALBUM</div>
              <div>TIME</div>
              <div className="w-10"></div>
            </div>

            {/* Track Rows */}
            {topTracks.map((track, index) => (
              <div
                key={track.id}
                className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 px-4 py-3 rounded-lg hover:bg-card/50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-card to-card-hover rounded flex items-center justify-center relative overflow-hidden">
                    <span className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity">
                      {index + 1}
                    </span>
                    <Play className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity fill-foreground" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{track.title}</div>
                  <div className="text-sm text-muted-foreground md:hidden truncate">{track.artist}</div>
                </div>
                <div className="hidden md:block text-muted-foreground truncate">{track.artist}</div>
                <div className="hidden md:block text-muted-foreground truncate">{track.album}</div>
                <div className="text-muted-foreground text-sm">{track.time}</div>
                <div className="w-10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EP & Singles */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">EP & Singles</h2>
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
              {albums.map((album) => (
                <CarouselItem key={album.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <div className="group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-card shadow-sm group-hover:shadow-glow transition-all duration-500 relative">
                      <div className="w-full h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center">
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-black ml-1 fill-black" />
                          </div>
                        </div>
                        
                        {/* Placeholder */}
                        <div className="text-center text-muted-foreground">
                          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="font-serif text-2xl">{album.title[0]}</span>
                          </div>
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
              ))}
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
              {moreAlbums.map((album) => (
                <CarouselItem key={album.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <div className="group cursor-pointer">
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
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform">
                          <Play className="w-6 h-6 text-primary-foreground ml-1 fill-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>
                      {album.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{album.subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{album.year} • {album.tracks} tracks</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      </div>
    </div>
  );
}

const topTracks = [
  { id: "1", title: "In The Air Tonight", artist: "Sons of Legion", album: "In The Air Tonight", time: "3:42" },
  { id: "2", title: "Fire Starter", artist: "Sons of Legion", album: "Fire Starter", time: "2:28" },
  { id: "3", title: "Power", artist: "Sons of Legion", album: "Power", time: "2:44" },
  { id: "4", title: "Carolina", artist: "Sons of Legion", album: "Carolina", time: "4:32" },
  { id: "5", title: "Echoes", artist: "Sons of Legion", album: "Cosmic Echoes", time: "3:58" },
  { id: "6", title: "Northern Lights", artist: "Sons of Legion", album: "Stellar Dreams", time: "4:15" },
];

const albums = [
  { id: "1", title: "Walking On The Edge", year: "2024" },
  { id: "2", title: "Angels", year: "2024" },
  { id: "3", title: "Strange", year: "2024" },
  { id: "4", title: "Wild Horse", year: "2024" },
  { id: "5", title: "Carolina", year: "2024" },
  { id: "6", title: "REAL THANG", year: "2024" },
  { id: "7", title: "Leave The Light On", year: "2023" },
  { id: "8", title: "In The Air Tonight", year: "2023" },
];

const moreAlbums = [
  { id: "a1", title: "Power", year: "2024", tracks: 12, image: powerAlbum },
  { id: "a2", title: "Outlaw", year: "2024", tracks: 10, image: outlawAlbum },
  { id: "a3", title: "Acoustic Album", subtitle: "Live from the Barn - Nashville, TN", year: "2023", tracks: 14, image: acousticAlbum },
  { id: "a4", title: "Stripped Album", subtitle: "Recorded in Nashville, TN", year: "2023", tracks: 11, image: strippedAlbum },
];
