import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function FreeEP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For demo purposes, just show success message
      // In production, you would integrate with email service
      
      toast({
        title: "Success!",
        description: "Check your email for the download link to your free Power album!",
      });

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setZipCode("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://content.app-sources.com/s/374628496604644011/uploads/Downloaded/sons-of-legion-6171542.jpg?format=webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-5xl w-full flex items-center justify-center">
          {/* Album Cover with Vinyl Sliding Out */}
          <div className="relative flex items-center">
            {/* Album Cover */}
            <div className="relative z-20 opacity-0 animate-[fade-in_1s_ease-out_0.2s_forwards]">
              <img 
                src="/albums/power-album.jpg" 
                alt="Sons of Legion Power Album" 
                className="w-[400px] h-[400px] rounded-lg shadow-2xl object-cover"
              />
            </div>

            {/* Vinyl Record with Form */}
            <div className="relative -ml-32 opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
              {/* Vinyl Circle Background */}
              <div className="w-[500px] h-[400px] bg-gradient-to-r from-card/95 to-card/98 backdrop-blur-sm rounded-r-full shadow-2xl flex items-center pr-12 pl-40">
                <div className="w-full">
                  <h1 className="text-2xl font-bold mb-6 text-balance leading-tight">
                    TURN UP THE VOLUME, HIT THE OPEN ROAD, AND GRAB A FREE DOWNLOAD OF SONS OF LEGION&apos;S RAW AND SOULFUL &quot;POWER&quot; ALBUM...
                  </h1>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="sr-only">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="sr-only">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="sr-only">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode" className="sr-only">Zip / Postal Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="Zip / Postal Code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-gold hover:shadow-glow text-lg py-6 font-bold"
                      disabled={loading}
                    >
                      {loading ? "DOWNLOADING..." : "DOWNLOAD NOW"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
