import { useState } from "react";
import { Play, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Videos() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Videos
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Dive into exclusive series, music videos, and behind the scenes content
          </p>
        </div>

        {/* Featured Video */}
        <div className="relative rounded-3xl overflow-hidden mb-16 group cursor-pointer shadow-cosmic hover:shadow-glow transition-all duration-500">
          <div className="aspect-[21/9] bg-gradient-to-br from-card to-card-hover flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-overlay opacity-60 group-hover:opacity-40 transition-opacity" />
            
            <div className="relative z-10 text-center px-8">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                Featured Series
              </Badge>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-balance">
                The Making of Legion
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                An intimate documentary series following the creative process behind our latest album
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-gold hover:shadow-glow transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Now
              </Button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div>
          <h2 className="font-serif text-3xl font-bold mb-8">All Videos</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoContent.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative rounded-2xl overflow-hidden mb-4 bg-card shadow-cosmic group-hover:shadow-glow transition-all duration-500">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-card to-card-hover flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-overlay opacity-60 group-hover:opacity-30 transition-opacity" />
                    
                    {/* Play button overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                      hoveredId === video.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}>
                      <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-gold">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-background-dark/90 rounded text-xs font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{video.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Video info */}
                <div className="px-2">
                  <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{video.views}</span>
                    </div>
                    <span>•</span>
                    <span>{video.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const videoContent = [
  {
    id: "1",
    title: "Studio Session: Creating 'Echoes'",
    description: "Watch us craft the hit single from scratch in our home studio",
    duration: "24:15",
    views: "124K",
    date: "2 weeks ago",
  },
  {
    id: "2",
    title: "Live from Red Rocks",
    description: "Full concert recording from our sold-out Colorado show",
    duration: "1:45:30",
    views: "892K",
    date: "1 month ago",
  },
  {
    id: "3",
    title: "The Story Behind the Album",
    description: "Deep dive into the inspiration and meaning behind each track",
    duration: "18:42",
    views: "215K",
    date: "3 weeks ago",
  },
  {
    id: "4",
    title: "Acoustic Sessions Vol. 1",
    description: "Stripped down versions of fan favorites",
    duration: "32:10",
    views: "456K",
    date: "1 week ago",
  },
  {
    id: "5",
    title: "Road Diaries: European Tour",
    description: "Behind the scenes from our biggest tour yet",
    duration: "15:28",
    views: "328K",
    date: "4 days ago",
  },
  {
    id: "6",
    title: "Collaboration: The Producer's Cut",
    description: "Working with legendary producer on our newest sound",
    duration: "27:55",
    views: "167K",
    date: "5 days ago",
  },
];
