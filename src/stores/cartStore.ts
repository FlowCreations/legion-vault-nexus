import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShopifyProduct, createStorefrontCheckout } from '@/lib/shopify';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  lastUpdated: number;
  
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setCartId: (cartId: string) => void;
  setCheckoutUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  createCheckout: () => Promise<void>;
  syncCartToBackend: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      lastUpdated: Date.now(),

      addItem: (item) => {
        const { items, syncCartToBackend } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
            lastUpdated: Date.now()
          });
        } else {
          set({ items: [...items, item], lastUpdated: Date.now() });
        }
        syncCartToBackend();
      },

      updateQuantity: (variantId, quantity) => {
        const { syncCartToBackend } = get();
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
          lastUpdated: Date.now()
        });
        syncCartToBackend();
      },

      removeItem: (variantId) => {
        const { syncCartToBackend } = get();
        set({
          items: get().items.filter(item => item.variantId !== variantId),
          lastUpdated: Date.now()
        });
        syncCartToBackend();
      },

      clearCart: () => {
        set({ items: [], cartId: null, checkoutUrl: null, lastUpdated: Date.now() });
        localStorage.removeItem('shopify-cart');
      },

      setCartId: (cartId) => set({ cartId }),
      setCheckoutUrl: (checkoutUrl) => set({ checkoutUrl }),
      setLoading: (isLoading) => set({ isLoading }),

      createCheckout: async () => {
        const { items, setLoading, setCheckoutUrl } = get();
        if (items.length === 0) return;

        setLoading(true);
        try {
          const checkoutUrl = await createStorefrontCheckout(
            items.map(item => ({ variantId: item.variantId, quantity: item.quantity }))
          );
          setCheckoutUrl(checkoutUrl);
        } catch (error) {
          console.error('Failed to create checkout:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      syncCartToBackend: async () => {
        const { items } = get();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || items.length === 0) return;

        const cartValue = items.reduce((sum, item) => 
          sum + (parseFloat(item.price.amount) * item.quantity), 0
        );

        try {
          const { data: existingSession } = await supabase
            .from('cart_sessions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingSession) {
            await supabase
              .from('cart_sessions')
              .update({
                cart_items: items as any,
                cart_value: cartValue,
                last_updated: new Date().toISOString(),
              })
              .eq('user_id', user.id);
          } else {
            await supabase
              .from('cart_sessions')
              .insert({
                user_id: user.id,
                cart_items: items as any,
                cart_value: cartValue,
                last_updated: new Date().toISOString(),
              });
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
        }
      }
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
