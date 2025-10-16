import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

interface StripeCheckoutProps {
  albumId: string;
  albumTitle: string;
  price: number;
  onSuccess: () => void;
  className?: string;
}

export function StripeCheckout({ 
  albumId, 
  albumTitle, 
  price, 
  onSuccess,
  className 
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-album-checkout', {
        body: {
          albumId,
          albumTitle,
          price: Math.round(price * 100), // Convert to cents
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? (
        "Loading..."
      ) : (
        <>
          <Lock className="w-4 h-4 mr-2" />
          Purchase ${price.toFixed(2)}
        </>
      )}
    </Button>
  );
}
