import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, ShoppingCart, CreditCard, Package, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface CommerceJourneyPanelProps {
  userId: string;
}

interface Purchase {
  id: string;
  product_name: string;
  product_type: string;
  amount_total: number;
  created_at: string;
  status: string;
}

interface CartAbandonment {
  id: string;
  cart_items: any[];
  cart_value: number;
  created_at: string;
  status: string;
}

export function CommerceJourneyPanel({ userId }: CommerceJourneyPanelProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<CartAbandonment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpend: 0,
    purchaseCount: 0,
    avgOrderValue: 0,
    storeVisits: 0,
    cartAbandons: 0,
  });

  useEffect(() => {
    loadCommerceData();
  }, [userId]);

  const loadCommerceData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Load purchases
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Load abandoned carts
      const { data: cartData } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Load store visit events from jrny_events
      const { data: eventsData, count: storeVisitCount } = await supabase
        .from('jrny_events')
        .select('*', { count: 'exact', head: true })
        .eq('jrny_id', userId)
        .eq('event_type', 'store_visit');

      const purchaseList = (purchaseData || []) as Purchase[];
      const cartList = (cartData || []) as CartAbandonment[];

      const totalSpend = purchaseList.reduce((acc, p) => acc + (p.amount_total || 0), 0);
      const avgOrderValue = purchaseList.length > 0 ? totalSpend / purchaseList.length : 0;

      setPurchases(purchaseList);
      setAbandonedCarts(cartList.filter(c => c.status === 'pending'));
      setStats({
        totalSpend,
        purchaseCount: purchaseList.length,
        avgOrderValue,
        storeVisits: storeVisitCount || 0,
        cartAbandons: cartList.filter(c => c.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error loading commerce data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBuyerStatus = () => {
    if (stats.purchaseCount >= 3) return { label: 'Super Fan', className: 'bg-emerald-500/20 text-emerald-400' };
    if (stats.purchaseCount >= 2) return { label: 'Repeat Buyer', className: 'bg-amber-500/20 text-amber-400' };
    if (stats.purchaseCount === 1) return { label: 'First-Time Buyer', className: 'bg-blue-500/20 text-blue-400' };
    return { label: 'Non-Buyer', className: 'bg-muted text-muted-foreground' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const buyerStatus = getBuyerStatus();

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Buyer Status:</span>
        <Badge className={buyerStatus.className}>
          {buyerStatus.label}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xl font-bold">${stats.totalSpend.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-xl font-bold">{stats.purchaseCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-purple-400" />
              <span className="text-xl font-bold">{stats.storeVisits}</span>
            </div>
            <p className="text-xs text-muted-foreground">Store Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-bold">${stats.avgOrderValue.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Order</p>
          </CardContent>
        </Card>
      </div>

      {/* Abandoned Carts Warning */}
      {abandonedCarts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Abandoned Carts ({abandonedCarts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {abandonedCarts.slice(0, 3).map(cart => (
              <div key={cart.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm">${cart.cart_value?.toFixed(2) || '0.00'} cart</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(cart.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-400">
                  Pending
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No purchases yet</p>
          ) : (
            <div className="space-y-3">
              {purchases.slice(0, 5).map(purchase => (
                <div key={purchase.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{purchase.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${purchase.amount_total.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      {purchase.product_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
