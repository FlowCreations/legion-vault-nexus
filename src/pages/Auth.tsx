import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventTracking } from "@/hooks/useEventTracking";
import { toast as sonnerToast } from "sonner";

const TIER_PRICE_IDS: { [key: string]: string } = {
  "Rebels": "price_1QhunoAkEokk90mfkxLQJgI8",
  "Outlaws": "price_1QhunvAkEokk90mfb7CqjJjq",
  "Legionnaires": "price_1Qhuo2AkEokk90mfnhOBiSJQ",
};

export default function Auth() {
  const { trackEvent } = useEventTracking();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  
  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Profile fields - Public
  const [displayName, setDisplayName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  
  
  // Profile fields - Private
  const [realName, setRealName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [pendingTier, setPendingTier] = useState<string | null>(null);

  useEffect(() => {
    // Check for pending tier on mount
    const savedTier = localStorage.getItem('pendingSubscriptionTier');
    if (savedTier) {
      setPendingTier(savedTier);
    }

    // Check if already logged in on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('User already logged in, redirecting...');
        // User is already logged in, redirect to home
        navigate("/");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Has session:', !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in successfully');
        // User just signed in - check for pending subscription
        const tierToSubscribe = localStorage.getItem('pendingSubscriptionTier');
        if (tierToSubscribe) {
          console.log('Has pending tier:', tierToSubscribe);
          handlePendingSubscription();
        } else {
          console.log('No pending tier, redirecting to home');
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePendingSubscription = async () => {
    const tierToSubscribe = localStorage.getItem('pendingSubscriptionTier');
    if (!tierToSubscribe) {
      // No pending subscription, just go home
      navigate("/");
      return;
    }

    const priceId = TIER_PRICE_IDS[tierToSubscribe];
    if (!priceId) {
      console.error('Invalid tier:', tierToSubscribe);
      localStorage.removeItem('pendingSubscriptionTier');
      navigate("/");
      return;
    }

    sonnerToast("Completing your subscription...", {
      description: "Please wait while we redirect you to checkout"
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        localStorage.removeItem('pendingSubscriptionTier');
        window.open(data.url, '_blank');
        sonnerToast.success("Checkout ready!", {
          description: "Complete your subscription in the new tab"
        });
        navigate('/subscribe');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      sonnerToast.error('Failed to create checkout', {
        description: 'Please try subscribing again from the subscription page'
      });
      localStorage.removeItem('pendingSubscriptionTier');
      navigate('/subscribe');
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // Show questionnaire instead of completing signup
        setShowQuestionnaire(true);
        setLoading(false);
        return;
      } else {
        // Sign in
        console.log('Attempting sign in for:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }

        console.log('Sign in successful, session:', !!data.session);
        
        toast({
          title: "Success",
          description: "Welcome back!",
        });

        // Navigation will be handled by onAuthStateChange
        // But keep loading state until redirect happens
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !userLocation || !bio) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      setLoading(true);

      // Create account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        let avatarUrl = null;

        // Upload profile picture if provided
        if (profilePicture) {
          const fileExt = profilePicture.name.split('.').pop();
          const fileName = `${authData.user.id}/avatar.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, profilePicture, {
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading profile picture:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(fileName);
            avatarUrl = publicUrl;
          }
        }

        // Create profile with both public and private data
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            display_name: displayName,
            location: userLocation,
            bio: bio,
            avatar_url: avatarUrl,
            real_name: realName || null,
            birthdate: birthdate || null,
            gender: gender || null,
          }]);

        if (profileError) throw profileError;

        trackEvent('signup', {
          location: userLocation,
          hasProfilePicture: !!profilePicture
        });

        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              userId: authData.user.id,
              email: authData.user.email,
              firstName: displayName,
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block signup if email fails
        }

        sonnerToast.success("Account created!", {
          description: "Welcome to the Legion community"
        });

        // Don't navigate here - let the auth state change handler deal with pending subscription
        if (!localStorage.getItem('pendingSubscriptionTier')) {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setLoading(false);
    }
  };

  if (showQuestionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-24">
        <Card className="w-full max-w-2xl p-8 my-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to the Community!</h1>
            <p className="text-muted-foreground">
              Tell us about yourself. Some info is private (just for us), some will be public.
            </p>
          </div>

          <form onSubmit={handleCompleteSignup} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Public Profile</h2>
              <p className="text-sm text-muted-foreground">This info will be visible to other community members</p>
              
              <div>
                <Label htmlFor="displayName">Username / Display Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you want to be known"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="e.g., Nashville, TN"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bio">About You * (1-2 sentences)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g., Country music fanatic from Nashville"
                  rows={3}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
              </div>

              <div>
                <Label htmlFor="profilePicture">Profile Picture</Label>
                <div className="mt-2 flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex flex-col items-center">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted border-4 border-dashed border-primary/50 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-1">📸</span>
                        <span className="text-xs text-muted-foreground">Your photo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <div className="relative">
                      <label 
                        htmlFor="profilePictureInput" 
                        className="block w-full cursor-pointer"
                      >
                        <div className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg text-center transition-colors border-2 border-yellow-500">
                          Choose File
                        </div>
                      </label>
                      <input
                        id="profilePictureInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    {profilePicture && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {profilePicture.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      👆 Click "Choose File" to upload your profile picture
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-primary">Private Info</h2>
              <p className="text-sm text-muted-foreground">
                Not for public use - helps us understand our community & send birthday cards
              </p>
              
              <div>
                <Label htmlFor="realName">Real Name (optional)</Label>
                <Input
                  id="realName"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="Your actual name"
                />
              </div>

              <div>
                <Label htmlFor="birthdate">Date of Birth (optional)</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">We send birthday cards!</p>
              </div>

              <div>
                <Label htmlFor="gender">Gender (optional - helps demographics)</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuestionnaire(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Signup
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Join the Legion community" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Continue" : "Sign In"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
          className="w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
