import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  time: string;
  url?: string;
  image?: string;
}

const SongCredits = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const track = location.state?.track as Track | undefined;

  if (!track) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No track information available</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Mock credits data - you can expand this based on your actual data structure
  const credits = [
    {
      name: "Sons of Legion",
      role: "Artist",
      image: track.image,
    },
    {
      name: "Sol",
      role: "Vocals, Lyrics",
      image: track.image,
    },
    {
      name: "Producer Name",
      role: "Producer",
      image: null,
    },
    {
      name: "Engineer Name",
      role: "Mixing Engineer",
      image: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/20 to-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Album Art */}
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-card flex-shrink-0">
              {track.image ? (
                <img
                  src={track.image}
                  alt={track.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                  {track.title[0]}
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {track.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {track.artist}
              </p>
              <p className="text-sm text-muted-foreground">
                {track.album} • {track.time}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold mb-6">Cast & Crew</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {credits.map((credit, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-card mb-3">
                {credit.image ? (
                  <img
                    src={credit.image}
                    alt={credit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground bg-primary/10">
                    {credit.name[0]}
                  </div>
                )}
              </div>
              <p className="font-medium text-sm mb-1">{credit.name}</p>
              <p className="text-xs text-muted-foreground">{credit.role}</p>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-xl font-semibold mb-4">About This Track</h3>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            A powerful track from Sons of Legion, showcasing their unique blend 
            of modern rock with traditional influences. This song features compelling 
            lyrics and masterful production that has resonated with fans worldwide.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SongCredits;
