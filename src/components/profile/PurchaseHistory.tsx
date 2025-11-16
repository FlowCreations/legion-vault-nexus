import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Music, Package, Calendar, DollarSign, Mail, User, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Purchase {
  id: string;
  email: string;
  customer_name: string | null;
  product_type: string;
  product_id: string | null;
  product_name: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user profile to match email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      // Fetch purchases by user_id or email
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}${profile?.email ? `,email.eq.${profile.email}` : ''}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load purchase history",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'album':
        return <Music className="w-4 h-4" />;
      case 'merch':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleDownload = (purchase: Purchase) => {
    if (purchase.product_type === 'album') {
      // Navigate to album page
      window.location.href = `/music/album/${purchase.product_id}`;
    } else {
      toast({
        title: "Coming Soon",
        description: "Download functionality for this product is coming soon!",
      });
    }
  };

  const handleDownloadReceipt = async (purchaseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to download receipts",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-receipt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purchaseId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const html = await response.text();
      const receiptWindow = window.open('', '_blank');
      if (receiptWindow) {
        receiptWindow.document.write(html);
        receiptWindow.document.close();
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate receipt",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Purchases Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Your purchase history will appear here once you buy albums or merchandise.
            </p>
            <Button asChild className="bg-gradient-gold hover:shadow-glow">
              <Link to="/music">Browse Music</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Purchase History</span>
            <Badge variant="secondary">{purchases.length} {purchases.length === 1 ? 'Purchase' : 'Purchases'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {getProductIcon(purchase.product_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{purchase.product_name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {purchase.product_type}
                            </Badge>
                            <Badge 
                              variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                              className={purchase.status === 'completed' ? 'bg-green-600' : ''}
                            >
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(purchase.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-foreground">
                            {formatAmount(purchase.amount_total, purchase.currency)}
                          </span>
                        </div>
                        {purchase.customer_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{purchase.customer_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{purchase.email}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Order #{purchase.stripe_session_id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {purchase.status === 'completed' && (
                        <>
                          <Button 
                            onClick={() => handleDownload(purchase)}
                            className="bg-gradient-gold hover:shadow-glow w-full md:w-auto"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {purchase.product_type === 'album' ? 'Listen Now' : 'View Order'}
                          </Button>
                          <Button 
                            onClick={() => handleDownloadReceipt(purchase.id)}
                            variant="outline"
                            className="w-full md:w-auto"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download Receipt
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View - Hidden on mobile */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{purchase.product_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {purchase.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(purchase.amount_total, purchase.currency)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                      className={purchase.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {purchase.stripe_session_id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-right">
                    {purchase.status === 'completed' && (
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm"
                          onClick={() => handleDownload(purchase)}
                          variant="ghost"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleDownloadReceipt(purchase.id)}
                          variant="ghost"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
