import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Videos() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Trailer Section */}
      <div className="relative h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/GXP2FEoBlIg?autoplay=1&mute=1&controls=0&loop=1&playlist=GXP2FEoBlIg&rel=0&modestbranding=1&showinfo=0"
            title="Sons of Legion - Hero Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Carolina
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Experience the power of Sons of Legion's latest release
            </p>
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Now
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="px-4 sm:px-8 lg:px-12 pb-16 space-y-12">
        {/* Performances Row */}
        <ContentRow
          title="Performances"
          items={performances}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />

        {/* BTS Row */}
        <ContentRow
          title="Behind The Scenes"
          items={behindTheScenes}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />

        {/* Music Videos Row */}
        <ContentRow
          title="Music Videos"
          items={musicVideos}
          aspectRatio="portrait"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />

        {/* Documentary Row */}
        <ContentRow
          title="Documentary"
          items={documentary}
          aspectRatio="landscape"
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          isPremium
        />
      </div>
    </div>
  );
}

interface ContentRowProps {
  title: string;
  items: VideoItem[];
  aspectRatio: "portrait" | "landscape";
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  isPremium?: boolean;
}

function ContentRow({ title, items, aspectRatio, hoveredId, setHoveredId, isPremium }: ContentRowProps) {
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
                  : "basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              }`}
            >
              <div
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative rounded-lg overflow-hidden mb-3 bg-card shadow-sm group-hover:shadow-glow transition-all duration-500 transform group-hover:scale-105">
                  <div className={`${
                    aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-video"
                  } bg-gradient-to-br from-card to-card-hover flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-gradient-overlay opacity-60 group-hover:opacity-30 transition-opacity" />
                    
                    {/* Play button overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                      hoveredId === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}>
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-black ml-1" />
                      </div>
                    </div>

                    {/* Premium Badge */}
                    {isPremium && (
                      <div className="absolute top-3 right-3">
                        <Button 
                          size="sm" 
                          className="bg-primary/90 hover:bg-primary text-xs"
                        >
                          Start Free Trial
                        </Button>
                      </div>
                    )}
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

interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
}

const musicVideos: VideoItem[] = [
  { id: "mv1", title: "Carolina", subtitle: "Official Music Video" },
  { id: "mv2", title: "Echoes", subtitle: "Official Music Video" },
  { id: "mv3", title: "In The Air Tonight", subtitle: "Cover" },
  { id: "mv4", title: "Legion Rising", subtitle: "Official Music Video" },
  { id: "mv5", title: "Northern Lights", subtitle: "Official Music Video" },
  { id: "mv6", title: "Thunder Road", subtitle: "Official Music Video" },
  { id: "mv7", title: "Wildfire", subtitle: "Official Music Video" },
  { id: "mv8", title: "Horizon", subtitle: "Official Music Video" },
];

const performances: VideoItem[] = [
  { id: "p1", title: "Live from Red Rocks", subtitle: "Full Concert" },
  { id: "p2", title: "Austin City Limits", subtitle: "Festival Performance" },
  { id: "p3", title: "Acoustic Sessions Vol. 1", subtitle: "Intimate Set" },
  { id: "p4", title: "Madison Square Garden", subtitle: "Sold Out Show" },
  { id: "p5", title: "BBC Live Lounge", subtitle: "Exclusive Performance" },
  { id: "p6", title: "Coachella 2024", subtitle: "Main Stage" },
  { id: "p7", title: "Glastonbury Festival", subtitle: "Headline Set" },
  { id: "p8", title: "Late Night TV Special", subtitle: "Studio Performance" },
];

const behindTheScenes: VideoItem[] = [
  { id: "bts1", title: "Studio Session: Creating 'Echoes'", subtitle: "24:15" },
  { id: "bts2", title: "Road Diaries: European Tour", subtitle: "15:28" },
  { id: "bts3", title: "The Producer's Cut", subtitle: "27:55" },
  { id: "bts4", title: "Sound Check Rituals", subtitle: "12:40" },
  { id: "bts5", title: "Life on the Tour Bus", subtitle: "18:22" },
  { id: "bts6", title: "Merch Design Process", subtitle: "9:15" },
  { id: "bts7", title: "Writing Camp Sessions", subtitle: "20:33" },
  { id: "bts8", title: "Meet & Greet Moments", subtitle: "14:50" },
];

const documentary: VideoItem[] = [
  { id: "doc1", title: "The Making of Legion", subtitle: "Limited Series • 6 Episodes" },
  { id: "doc2", title: "Origins: The Early Years", subtitle: "Documentary Feature" },
  { id: "doc3", title: "The Story Behind the Album", subtitle: "Deep Dive • 45 min" },
  { id: "doc4", title: "Brothers in Music", subtitle: "Band Documentary" },
  { id: "doc5", title: "From Garage to Glory", subtitle: "Career Retrospective" },
  { id: "doc6", title: "The Creative Process", subtitle: "Songwriting Series" },
];

