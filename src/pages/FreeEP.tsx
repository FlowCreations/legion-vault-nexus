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
        <div className="max-w-6xl w-full flex items-center justify-center gap-8">
          {/* Album Cover */}
          <div className="relative z-20 opacity-0 animate-[fade-in_1s_ease-out_0.2s_forwards]">
            <div className="w-[450px] h-[450px] bg-card rounded-lg shadow-2xl overflow-hidden">
              <img 
                src="/albums/power-album.jpg" 
                alt="Sons of Legion Power Album" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Vinyl Record Sliding Out */}
          <div className="relative -ml-32 opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
            {/* Black Vinyl Disc */}
            <div className="relative w-[450px] h-[450px]">
              {/* Outer black vinyl */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-950 shadow-2xl">
                {/* Grooves effect */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-gray-800 via-black to-gray-900"></div>
                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-950"></div>
                
                {/* Center label with form */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-card/98 backdrop-blur-sm shadow-inner flex items-center justify-center p-8">
                    <div className="w-full">
                      <h2 className="text-sm font-bold mb-3 text-center leading-tight">
                        GET YOUR FREE POWER ALBUM
                      </h2>

                      <form onSubmit={handleSubmit} className="space-y-2">
                        <Input
                          id="name"
                          type="text"
                          placeholder="Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="bg-background/50 h-8 text-xs"
                        />

                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-background/50 h-8 text-xs"
                        />

                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-background/50 h-8 text-xs"
                        />

                        <Input
                          id="zipCode"
                          type="text"
                          placeholder="Zip Code"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="bg-background/50 h-8 text-xs"
                        />

                        <Button
                          type="submit"
                          className="w-full bg-gradient-gold hover:shadow-glow text-xs py-4 font-bold"
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
      </div>
    </div>
  );
}
