import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function FreeEP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create account with email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            phone,
            zip_code: zipCode,
          },
          emailRedirectTo: `${window.location.origin}/music`,
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // Update user profile with additional info
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          display_name: name,
          phone,
          zip_code: zipCode,
          membership_tier: 'free',
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Send the free album welcome email
      const { error: emailError } = await supabase.functions.invoke('send-free-album-email', {
        body: {
          email,
          name,
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
      }
      
      toast({
        title: "Account Created!",
        description: "Check your email to verify your account and unlock your free Power album!",
      });

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setZipCode("");
    } catch (error: any) {
      console.error('Free EP signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
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
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-40 pb-20">
        {/* Two Square Boxes */}
        <div className="flex items-start justify-center gap-8 mb-16">
          {/* Album Cover */}
          <div className="opacity-0 animate-[fade-in_1s_ease-out_0.2s_forwards]">
            <img 
              src="/albums/power-album.jpg" 
              alt="Sons of Legion Power Album" 
              className="w-[450px] h-[450px] rounded-lg shadow-2xl object-cover"
            />
          </div>

          {/* Form Box - Same Size as Album */}
          <div className="w-[450px] h-[450px] bg-card/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 flex flex-col justify-center opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
            <h1 className="text-lg font-bold mb-6 text-balance leading-tight text-center">
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
                <Label htmlFor="password" className="sr-only">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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

        {/* Bio Section - Below the boxes */}
        <div className="max-w-4xl mx-auto px-4 opacity-0 animate-[fade-in_1s_ease-out_1s_forwards]">
          <div className="text-center space-y-6 text-foreground/90">
            <p className="text-lg leading-relaxed">
              Sons of Legion is the raw, soul stirring sound of urban Americana rock. A duo with coast-to-coast roots and a fire forged bond, their music blends rock, blues, and soul with grit and grace. With over 3.5 million followers on social media, they speak to anyone chasing something deeper.
            </p>
            <p className="text-lg leading-relaxed">
              Now you can experience their sound firsthand with the Power album, completely free. This isn&apos;t just four songs. It&apos;s an invitation to join a movement built on boldness, authenticity, and purpose. Music that doesn&apos;t just play in the background, it hits you where it matters, lifts you up, and pushes you forward.
            </p>
            <p className="text-lg leading-relaxed font-semibold">
              Sign up and get the Power album today. Let it be the fuel for your next bold move.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
