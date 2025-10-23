import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Video, Gift, Sparkles, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CameoDisplay } from "@/components/CameoDisplay";

export const CameoBookingTab = () => {
  const [recipientName, setRecipientName] = useState("");
  const [occasionType, setOccasionType] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!recipientName || !occasionType || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-cameo-checkout', {
        body: {
          recipientName,
          occasionType,
          specialInstructions,
          deliveryDate: deliveryDate?.toISOString(),
          email,
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Redirecting to checkout...");
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CameoDisplay />

      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Book a Personalized Cameo</CardTitle>
              <CardDescription className="text-base">
                Get a custom video message for any special occasion
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Gift className="w-6 h-6 text-accent mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Perfect for Any Occasion</h4>
                <p className="text-sm text-muted-foreground">
                  Birthdays, anniversaries, congratulations, or just because
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-accent mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Personalized Message</h4>
                <p className="text-sm text-muted-foreground">
                  Tell us what you'd like said and we'll make it special
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-accent mt-1" />
              <div>
                <h4 className="font-semibold mb-1">$100 per Cameo</h4>
                <p className="text-sm text-muted-foreground">
                  Delivered within 7 days via email
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Your Cameo</CardTitle>
          <CardDescription>Fill out the details below to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              placeholder="Who is this cameo for?"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Your Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Where should we send the cameo?"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasionType">Occasion Type *</Label>
            <Select value={occasionType} onValueChange={setOccasionType}>
              <SelectTrigger id="occasionType">
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="congratulations">Congratulations</SelectItem>
                <SelectItem value="encouragement">Encouragement</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
                <SelectItem value="just_because">Just Because</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Preferred Delivery Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              placeholder="What would you like us to say? Any specific details to include?"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Be specific! The more details you provide, the better we can personalize your cameo.
            </p>
          </div>

          <Button
            onClick={handleBooking}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : "Book Cameo - $100"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
