import { Play, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Music() {
  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Music
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Stream our complete discography with exclusive content and collaborator credits
          </p>
        </div>

        {/* Latest Release - Featured */}
        <div className="bg-gradient-to-br from-card to-card-hover rounded-3xl p-8 md:p-12 mb-16 shadow-cosmic border border-border">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            Latest Release
          </Badge>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Album Art */}
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 shadow-gold flex items-center justify-center group hover:shadow-glow transition-all duration-500">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Play className="w-12 h-12 text-primary-foreground ml-1" />
                </div>
                <p className="text-muted-foreground font-medium">Album Cover</p>
              </div>
            </div>

            {/* Album Info */}
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Cosmic Echoes
              </h2>
              <p className="text-muted-foreground mb-6 text-lg">
                Our most ambitious project yet, blending orchestral elements with modern production
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all">
                  <Play className="w-5 h-5 mr-2" />
                  Play Album
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary">
                  <Heart className="w-5 h-5 mr-2" />
                  Save
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Playlist
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Released:</span>
                  <span className="font-medium">January 2025</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Tracks:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">48:32</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        <div>
          <h2 className="font-serif text-3xl font-bold mb-8">All Albums</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group cursor-pointer"
              >
                {/* Album Cover */}
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-card to-card-hover mb-4 shadow-cosmic group-hover:shadow-glow transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-gold">
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </div>
                  </div>

                  {/* Placeholder content */}
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-serif text-2xl">{album.title[0]}</span>
                      </div>
                      <p className="text-xs opacity-50">Album Art</p>
                    </div>
                  </div>
                </div>

                {/* Album Info */}
                <div className="px-2">
                  <h3 className="font-serif text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {album.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-1">{album.year}</p>
                  <p className="text-muted-foreground text-xs">{album.tracks} tracks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const albums = [
  { id: "1", title: "Cosmic Echoes", year: "2025", tracks: 12 },
  { id: "2", title: "Dawn of Legends", year: "2024", tracks: 10 },
  { id: "3", title: "Midnight Chronicles", year: "2023", tracks: 14 },
  { id: "4", title: "Stellar Dreams", year: "2023", tracks: 8 },
  { id: "5", title: "Horizon's Edge", year: "2022", tracks: 11 },
  { id: "6", title: "Ember & Ash", year: "2022", tracks: 9 },
  { id: "7", title: "The First Legion", year: "2021", tracks: 13 },
  { id: "8", title: "Origins", year: "2021", tracks: 7 },
];
