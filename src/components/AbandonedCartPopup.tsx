import { useEffect, useState } from "react";
import { X, ShoppingCart, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface AbandonedCartOffer {
  hasOffer: boolean;
  cartItems?: any[];
  discountCode?: string;
  discountPercentage?: number;
  cartValue?: number;
  expiresAt?: string;
  abandonedCartId?: string;
}

export const AbandonedCartPopup = () => {
  const [offer, setOffer] = useState<AbandonedCartOffer | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const { items, addItem, clearCart, createCheckout } = useCartStore();

  useEffect(() => {
    checkForOffer();
  }, []);

  const checkForOffer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if we've already shown this popup in this session
      const dismissedKey = `abandoned_cart_dismissed_${user.id}`;
      if (sessionStorage.getItem(dismissedKey)) return;

      const { data, error } = await supabase.functions.invoke('check-cart-recovery-status');

      if (error) throw error;

      if (data?.hasOffer) {
        setOffer(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error checking cart recovery:', error);
    }
  };

  const handleApplyOffer = async () => {
    if (!offer?.cartItems) return;

    try {
      // Clear current cart
      clearCart();

      // Add abandoned items to cart
      offer.cartItems.forEach((item: any) => {
        addItem(item);
      });

      // Copy discount code
      if (offer.discountCode) {
        await navigator.clipboard.writeText(offer.discountCode);
        toast.success("Discount code copied!", {
          description: "Your 25% off code has been copied to clipboard",
        });
      }

      // Mark as recovered
      if (offer.abandonedCartId) {
        await supabase
          .from('abandoned_carts')
          .update({ status: 'recovered', recovered_at: new Date().toISOString() })
          .eq('id', offer.abandonedCartId);
      }

      // Proceed to checkout
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }

      setIsOpen(false);
      markAsDismissed();
    } catch (error) {
      console.error('Error applying offer:', error);
      toast.error("Failed to apply offer");
    }
  };

  const handleDismiss = async () => {
    if (offer?.abandonedCartId) {
      await supabase
        .from('abandoned_carts')
        .update({ status: 'ignored' })
        .eq('id', offer.abandonedCartId);
    }
    setIsOpen(false);
    markAsDismissed();
  };

  const markAsDismissed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      sessionStorage.setItem(`abandoned_cart_dismissed_${user.id}`, 'true');
    }
  };

  const copyDiscountCode = async () => {
    if (!offer?.discountCode) return;
    await navigator.clipboard.writeText(offer.discountCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast.success("Code copied!");
  };

  const formatPrice = (amount: string | number) => {
    return parseFloat(amount.toString()).toFixed(2);
  };

  if (!offer?.hasOffer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Welcome Back! Your Cart is Waiting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discount Offer Banner */}
          <div className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground p-6 rounded-lg text-center">
            <h3 className="text-3xl font-bold mb-2">
              {offer.discountPercentage}% OFF
            </h3>
            <p className="text-lg mb-3">
              Your exclusive cart recovery offer
            </p>
            <div className="bg-background text-foreground p-3 rounded-md inline-flex items-center gap-2">
              <code className="text-xl font-bold tracking-wider">
                {offer.discountCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyDiscountCode}
                className="h-8 w-8 p-0"
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm mt-2 opacity-90">
              Valid until {new Date(offer.expiresAt!).toLocaleDateString()}
            </p>
          </div>

          {/* Cart Items */}
          <div>
            <h4 className="font-semibold mb-3">Your Items:</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {offer.cartItems?.map((item: any, index: number) => {
                const product = item.product?.node || {};
                return (
                  <div key={index} className="flex gap-4 p-3 bg-secondary/20 rounded-lg">
                    {product.images?.edges?.[0]?.node?.url && (
                      <img
                        src={product.images.edges[0].node.url}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.title || 'Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${formatPrice(item.price?.amount || 0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pricing Summary */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>${formatPrice(offer.cartValue || 0)}</span>
              </div>
              <div className="flex justify-between text-lg text-green-600 font-semibold">
                <span>Your Discount ({offer.discountPercentage}%):</span>
                <span>-${formatPrice((offer.cartValue || 0) * (offer.discountPercentage || 0) / 100)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>New Total:</span>
                <span>${formatPrice((offer.cartValue || 0) * (1 - (offer.discountPercentage || 0) / 100))}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleApplyOffer}
              size="lg"
              className="flex-1"
            >
              Apply Discount & Checkout
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="lg"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};