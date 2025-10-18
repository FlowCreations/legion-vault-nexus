import { useState } from "react";
import aboutPhoto from "@/assets/about-photo.jpg";
import netflixLogo from "@/assets/brands/netflix.png";
import espnLogo from "@/assets/brands/espn.png";
import paramountLogo from "@/assets/brands/paramount.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const About = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will handle email sending later
    console.log("Form submitted:", { name, email });
    setShowDialog(false);
    setEmail("");
    setName("");
  };
  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Hero Section */}
      <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-16 text-foreground">
              SONS OF LEGION
            </h1>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
                <img 
                  src={aboutPhoto} 
                  alt="Sons of Legion band members"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>

              <div className="order-1 md:order-2 space-y-6">
                <p className="text-lg leading-relaxed text-foreground/90">
                  Just two guys from opposite sides of the country that happened to cross paths and chose to walk down the same road.
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  Sons of Legion is a dynamic band blending the raw energy of rock, the soulful depth of blues, and the timeless appeal of soul music. With a style that marries rugged grit with sophisticated class, they channel a vibe reminiscent of the GREATEST bands of the past.
                </p>

                <p className="text-lg leading-relaxed text-foreground/90">
                  Renowned for their powerful performances and compelling lyrics, Sons of Legion have captivated audiences worldwide. Their music, featuring standout tracks like "Brand New Day," "Power," and "Firestarter," has garnered over 55 million streams and is featured on major platforms like ESPN, Dodge Ram commercials, Netflix, and NBC.
                </p>
              </div>
            </div>

            {/* Featured On Section */}
            <div className="mt-20">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
                AS FEATURED ON
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center max-w-4xl mx-auto">
                <img 
                  src={netflixLogo} 
                  alt="Netflix"
                  className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <img 
                  src={espnLogo} 
                  alt="ESPN"
                  className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <img 
                  src={paramountLogo} 
                  alt="Paramount"
                  className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Free EP CTA Section */}
        <section className="py-16 px-4 bg-card/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Get Our Free Album
            </h2>
            <p className="text-xl text-foreground/80 mb-8">
              Download our exclusive free EP and experience the Sons of Legion sound
            </p>
            <Button
              onClick={() => setShowDialog(true)}
              className="px-8 py-4 text-lg font-semibold"
              size="lg"
            >
              Download Free EP
            </Button>
          </div>
        </section>

        {/* Email Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Get Your Free Album</DialogTitle>
              <DialogDescription>
                Enter your email to receive the download link for our Power album
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="dialog-name">Name</Label>
                <Input
                  id="dialog-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dialog-email">Email</Label>
                <Input
                  id="dialog-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Get Download Link
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default About;
