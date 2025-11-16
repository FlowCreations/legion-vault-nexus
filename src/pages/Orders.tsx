import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Purchase {
  id: string;
  product_name: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  product_type?: string;
}

export default function Orders() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPurchases();
    }
  }, [user]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error("Error loading purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">View your purchase history and order details</p>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Your order history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{purchase.product_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(purchase.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <Badge className={getStatusColor(purchase.status)}>
                    {purchase.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="w-5 h-5" />
                  {formatAmount(purchase.amount_total, purchase.currency)}
                </div>
                {purchase.product_type && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Type: {purchase.product_type}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
