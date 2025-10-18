import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import adamMcinnisImg from "@/assets/artists/adam-mcinnis.jpg";
import daddyJackImg from "@/assets/artists/daddy-jack.jpg";

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

  const credits = [
    {
      name: "Adam McInnis",
      role: "Songwriter, Producer",
      image: adamMcinnisImg,
      bio: `Adam McInnis is an artist, songwriter, and producer from Manhattan, NY most known for his work with world-renowned DJs such as Fedde Le Grande and his many placements in the sync world. His voice has been heard on many TV shows networks such as Vh1, MTV, HBO, ESPN, FOX, ABC, CMT, E!, NCAA, and The Golf Channel. As well as being heard by hundreds of thousands at festivals such as EDC, Tomorrowland, and Ultra.

Most recently as a Songwriter/Producer, he's landed tracks on film, TV and ads such as Fast and Furious: Hobbs & Shaw, Beyond the Lights, Batwoman, Xbox, Oculus, HBO's The Flight Attendant, Watch Dogs Legion, BMW, and Unfriended. As well as penning the song "Rainbow," in the movie LEAP! which has gained over 70 million views online.

Beyond his solo work, he has joined forces with Platinum Songwriter/Producer Mario Marchetti to form the Soul/Rock band Sons of Legion.

His ability to blend styles of soul, rock, reggae, country, pop, and blues has led to co-writes and cuts with hitmaking songwriters Kara DioGuardi, Cutfather, Chantal Krezuviak, Helen Darling, J-Rock, Mario Jimmy Robbins, Autumn Rowe, Greg Curtis, Adam Zelkind and more.

The song "Next Level" co-written and produced by McInnis with Mario Marchetti, performed by A$ton Wyld was featured on the Universal Pictures in the film and OST of Fast & Furious Presents: Hobbs & Shaw in 2019 and in 2021 was sampled/interpolated in all female Korean act AESPA's platinum global K-Pop hit single of the same name "Next Level".`,
    },
    {
      name: "Daddy Jack",
      role: "Songwriter, Producer",
      image: daddyJackImg,
      bio: `Los Angeles, CA based songwriter/producer Daddy Jack quickly emerged as a go-to collaborator in a diverse range of contemporary pop music circles and genres. A classically trained pianist and guitarist, Daddy Jack merged his musical talents with his recording and engineering prowess to craft and develop the unique sound and identity that has led him to work with innumerable talented and notable artists and songwriters, as well as the undiscovered talent he has been developing. Daddy Jack's songwriting credits include Jojo's hit single "Disaster" (Interscope) and Hollywood Records artist Demi Lovato's Billboard Top 10 Platinum hit single "Neon Lights", after which Lovato named her successful world tour.

Internationally, Daddy Jack's hit song credits include co-writes and production with Sony Australia artists Jess Mauboy ("Pop A Bottle"), Samantha Jade ("Up!"), Guy Sebastian ("Come Home To Me"), as well as K-Pop artist Super Junior's hit single "Tuxedo" and Universal Canada artist Shawn Hook's "Million Ways".

The song "Next Level" co-written and produced by Daddy Jack with Adam McInnis, performed by A$ton Wyld was featured on the Universal Pictures in the film and OST of Fast & Furious Presents: Hobbs & Shaw in 2019 and in 2021 was sampled/interpolated in all female Korean act AESPA's platinum global K-Pop hit single of the same name "Next Level".`,
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
        <h2 className="text-2xl font-semibold mb-8">Cast & Crew</h2>
        
        <div className="space-y-12">
          {credits.map((credit, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-6 pb-12 border-b border-border last:border-0">
              <div className="w-48 h-48 rounded-lg overflow-hidden bg-card flex-shrink-0">
                {credit.image ? (
                  <img
                    src={credit.image}
                    alt={credit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground bg-primary/10">
                    {credit.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{credit.name}</h3>
                <p className="text-muted-foreground mb-4">{credit.role}</p>
                {credit.bio && (
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    {credit.bio.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongCredits;
