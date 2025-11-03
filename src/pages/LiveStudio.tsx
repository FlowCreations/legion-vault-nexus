import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Calendar, Clock, Users, Ticket, Mail, Download, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import liveAcousticSession from "@/assets/live-acoustic-session.png";
import { useCartStore } from "@/stores/cartStore";
import { ShopifyProduct } from "@/lib/shopify";
import { ExpandableLiveViewer } from "@/components/livestream/ExpandableLiveViewer";
import { StreamCountdown } from "@/components/livestream/StreamCountdown";
import { StreamIntro } from "@/components/livestream/StreamIntro";
import { SubscribePrompt } from "@/components/SubscribePrompt";

export default function LiveStudio() {
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [albumEmail, setAlbumEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    zipCode: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReminderLoading, setIsReminderLoading] = useState(false);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const [countdown, setCountdown] = useState({
    days: "03",
    hours: "14",
    minutes: "27",
    seconds: "60"
  });
  const [liveEventId, setLiveEventId] = useState<string | null>(null);
  const [isViewingLive, setIsViewingLive] = useState(false);
  const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);

  useEffect(() => {
    checkAuth();
    checkLiveStream();
    
    // Target date: December 23, 2025 8:00 PM EST
    const targetDate = new Date('2025-12-23T20:00:00-05:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setCountdown({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0')
        });
      } else {
        setCountdown({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00"
        });
      }
    };
    
    // Update immediately and then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    // Subscribe to real-time livestream events
    const channel = supabase
      .channel('livestream-events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'livestream_events'
      }, (payload) => {
        console.log('[LiveStudio] Realtime event received:', payload);
        
        // Check if the event is live
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const eventData = payload.new as any;
          if (eventData.status === 'live') {
            console.log('[LiveStudio] Setting live event ID:', eventData.id);
            setLiveEventId(eventData.id);
          } else {
            console.log('[LiveStudio] Event status changed to non-live, clearing');
            setLiveEventId(null);
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('[LiveStudio] Event deleted, clearing live event ID');
          setLiveEventId(null);
        }
      })
      .subscribe((status) => {
        console.log('[LiveStudio] Realtime subscription status:', status);
      });
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset viewing state when stream ends
  useEffect(() => {
    if (!liveEventId) {
      setIsViewingLive(false);
    }
  }, [liveEventId]);

  const checkLiveStream = async () => {
    console.log('[LiveStudio] Checking for live streams...');
    const { data, error } = await supabase
      .from('livestream_events')
      .select('id, status, title')
      .eq('status', 'live')
      .maybeSingle();
    
    console.log('[LiveStudio] Live stream check result:', { data, error });
    
    if (data) {
      console.log('[LiveStudio] Found live event:', data);
      setLiveEventId(data.id);
    } else {
      console.log('[LiveStudio] No live events found');
      setLiveEventId(null);
    }
  };


  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const handleGetAccess = () => {
    setShowEmailDialog(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_events')
        .insert({
          session_id: crypto.randomUUID(),
          event_type: 'live_studio_signup',
          event_data: {
            name: formData.name,
            email: formData.email,
            country: formData.country,
            zipCode: formData.zipCode,
            phone: formData.phone,
            event_name: 'Acoustic Sessions Live'
          }
        });

      if (error) throw error;

      toast.success("Access granted!", {
        description: "We'll send you the stream link before it starts."
      });
      
      setShowEmailDialog(false);
      setFormData({
        name: "",
        email: "",
        country: "",
        zipCode: "",
        phone: ""
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetReminder = () => {
    setShowReminderDialog(true);
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderEmail) return;

    setIsReminderLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-calendar-invite', {
        body: {
          email: reminderEmail,
          eventDetails: {
            title: 'Acoustic Sessions Live',
            description: 'Join us for an intimate acoustic performance featuring stripped down versions of your favorite tracks and unreleased material.',
            location: 'Online - Live Stream',
            startDate: '2025-12-23T20:00:00-05:00',
            endDate: '2025-12-23T22:00:00-05:00'
          }
        }
      });

      if (error) throw error;

      toast.success("Calendar invite sent!", {
        description: "Check your email for the calendar invite."
      });

      setShowReminderDialog(false);
      setReminderEmail("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to send calendar invite. Please try again.");
    } finally {
      setIsReminderLoading(false);
    }
  };

  const handleAlbumRegistration = () => {
    setShowAlbumDialog(true);
  };

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumEmail) return;

    setIsAlbumLoading(true);
    try {
      const { error } = await supabase
        .from('user_events')
        .insert({
          session_id: crypto.randomUUID(),
          event_type: 'album_listening_party_signup',
          event_data: {
            email: albumEmail,
            event_name: 'Album Listening Party'
          }
        });

      if (error) throw error;

      toast.success("Registered successfully!", {
        description: "We'll send you the event details before it starts."
      });
      
      setShowAlbumDialog(false);
      setAlbumEmail("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAlbumLoading(false);
    }
  };

  const handleAddToCart = () => {
    // Create a Shopify-compatible product for the tour finale ticket
    const mockShopifyProduct: ShopifyProduct = {
      node: {
        id: 'world-tour-finale',
        title: 'Virtual World Tour Finale Ticket',
        description: 'The grand finale of our virtual tour featuring special guests and never before performed tracks',
        handle: 'virtual-world-tour-finale',
        priceRange: {
          minVariantPrice: {
            amount: '19.99',
            currencyCode: 'USD'
          }
        },
        images: {
          edges: [{
            node: {
              url: liveAcousticSession,
              altText: 'Virtual World Tour Finale'
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: 'gid://shopify/ProductVariant/world-tour-finale',
              title: 'Default',
              price: {
                amount: '19.99',
                currencyCode: 'USD'
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    };
    
    const variant = mockShopifyProduct.node.variants.edges[0].node;
    
    addItem({
      product: mockShopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions
    });
    
    toast.success("Ticket added to cart!");
  };

  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Live Studio
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Experience live performances, intimate sessions,{" "}
            <br className="hidden sm:inline" />
            and exclusive concerts from anywhere.
          </p>
        </div>

        {/* Live Now / Next Live Section */}
        <div className="bg-gradient-to-br from-card to-card-hover rounded-3xl overflow-hidden mb-16 shadow-glow border border-primary/30">
          <div className="p-8 md:p-12">
            {/* Live Indicator */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full ${liveEventId ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                {liveEventId && (
                  <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
              <Badge className={liveEventId ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-muted/20 text-muted-foreground border-muted/30"}>
                {liveEventId ? 'LIVE NOW' : 'Next Live Event'}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Stream Preview or Live Video */}
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-glow transition-all duration-500">
                  {liveEventId && isViewingLive ? (
                    <ExpandableLiveViewer eventId={liveEventId} showExternalControls />
                  ) : (
                    <div className="relative aspect-video">
                      <img 
                        src={liveAcousticSession} 
                        alt="Acoustic Sessions Live"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  )}
                </div>
              </div>

              {/* Event Info */}
              <div className="flex flex-col justify-center">
                <h2 className="font-serif text-4xl font-bold mb-4">
                  {liveEventId ? 'Live Now' : 'Acoustic Sessions Live'}
                </h2>
                
                <p className="text-muted-foreground mb-6 text-lg">
                  {liveEventId 
                    ? 'Watch the live performance!' 
                    : 'Join us for an intimate acoustic performance featuring stripped down versions of your favorite tracks and unreleased material.'}
                </p>

                {/* Join Stream Button - Only show when live and not viewing */}
                {liveEventId && !isViewingLive && (
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowSubscribePrompt(true);
                        return;
                      }
                      setIsViewingLive(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-6 text-xl font-bold mb-6 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3 w-3 rounded-full bg-white animate-pulse" />
                      SOL IS LIVE NOW - JOIN STREAM
                    </div>
                  </Button>
                )}

                {!liveEventId && (
                  <>
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center space-x-3 text-sm">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span>Tuesday, December 23, 2025</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock className="w-5 h-5 text-primary" />
                        <span>8:00 PM EST</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Users className="w-5 h-5 text-primary" />
                        <span>1,247 registered</span>
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="bg-card rounded-xl p-4 mb-6 border border-border">
                      <p className="text-sm text-muted-foreground mb-2">Starting in:</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { value: countdown.days, label: "Days" },
                          { value: countdown.hours, label: "Hours" },
                          { value: countdown.minutes, label: "Mins" },
                          { value: countdown.seconds, label: "Secs" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="font-serif text-3xl font-bold text-primary">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!isAuthenticated && (
                        <Button 
                          size="lg" 
                          className="bg-gradient-gold hover:shadow-glow transition-all"
                          onClick={handleGetAccess}
                        >
                          <Ticket className="w-5 h-5 mr-2" />
                          Get Free Access
                        </Button>
                      )}
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-primary/30 hover:border-primary"
                        onClick={handleSetReminder}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Set Reminder
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Past Streams */}
        <div className="mt-16">
          <h2 className="font-serif text-3xl font-bold mb-8">Watch Past Streams</h2>
          <p className="text-muted-foreground mb-6">
            Missed a live show? Premium and VIP members can watch recordings of all past events.
          </p>
          <Button 
            variant="outline" 
            className="border-primary/30 hover:border-primary"
            onClick={() => navigate('/videos')}
          >
            Browse Archive
          </Button>
        </div>
      </div>


      {/* Email Signup Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Get Free Access</DialogTitle>
            <DialogDescription>
              Enter your details to receive the live stream link
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                type="text"
                placeholder="United States"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code (Optional)</Label>
              <Input
                id="zipCode"
                type="text"
                placeholder="12345"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                "Registering..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Get Access Link
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reminder Email Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Enter your email to receive a calendar invite
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminderEmail">Email Address</Label>
              <Input
                id="reminderEmail"
                type="email"
                placeholder="your@email.com"
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isReminderLoading}
            >
              {isReminderLoading ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Calendar Invite
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Album Listening Party Registration Dialog */}
      <Dialog open={showAlbumDialog} onOpenChange={setShowAlbumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Album Listening Party</DialogTitle>
            <DialogDescription>
              Register for free to listen to the new album with the band
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAlbumSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="albumEmail">Email Address</Label>
              <Input
                id="albumEmail"
                type="email"
                placeholder="your@email.com"
                value={albumEmail}
                onChange={(e) => setAlbumEmail(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isAlbumLoading}
            >
              {isAlbumLoading ? (
                "Registering..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Register Free
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subscribe Prompt */}
      <SubscribePrompt
        open={showSubscribePrompt}
        onOpenChange={setShowSubscribePrompt}
        title="Subscribe to Watch Live"
        description="Get unlimited access to all live streams with a 7-day free trial."
      />
    </div>
  );
}
