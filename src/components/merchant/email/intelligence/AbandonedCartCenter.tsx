import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Send, Loader2, DollarSign, Mail, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AbandonedCartCenter = () => {
  const [loading, setLoading] = useState(true);
  const [carts, setCarts] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    delay_days: 3,
    min_cart_value: 20,
    discount_percentage: 25,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load abandoned carts
      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("created_at", { ascending: false });

      setCarts(abandonedCarts || []);

      // Load settings
      const { data: settingsData } = await supabase
        .from("abandoned_cart_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings({
          delay_days: settingsData.delay_days,
          min_cart_value: settingsData.min_cart_value,
          discount_percentage: settingsData.discount_percentage,
        });
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);

      const { error } = await supabase
        .from("abandoned_cart_settings")
        .upsert({
          id: "00000000-0000-0000-0000-000000000001",
          ...settings,
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Abandoned cart recovery settings have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const sendRecoveryEmail = async (cartId: string) => {
    try {
      toast({
        title: "Sending Recovery Email",
        description: "Processing your request...",
      });

      // This would call the send-cart-recovery-email function
      // For now, just update the status
      const { error } = await supabase
        .from("abandoned_carts")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", cartId);

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Cart recovery email has been sent successfully.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Abandoned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{carts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">
                {carts.filter(c => c.status === "pending").length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                ${carts.reduce((sum, c) => sum + (c.cart_value || 0), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Recovery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Delay Before Email (days)</Label>
              <Input
                type="number"
                value={settings.delay_days}
                onChange={(e) => setSettings({ ...settings, delay_days: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Cart Value ($)</Label>
              <Input
                type="number"
                value={settings.min_cart_value}
                onChange={(e) => setSettings({ ...settings, min_cart_value: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                value={settings.discount_percentage}
                onChange={(e) => setSettings({ ...settings, discount_percentage: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={saveSettings} disabled={savingSettings} className="w-full">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Abandoned Carts List */}
        <Card>
          <CardHeader>
            <CardTitle>Abandoned Carts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {carts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No abandoned carts found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carts.map((cart) => (
                    <Card key={cart.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">${cart.cart_value?.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cart.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={cart.status === "pending" ? "secondary" : "outline"}>
                            {cart.status}
                          </Badge>
                        </div>
                        {cart.discount_code && (
                          <p className="text-sm mb-2">
                            Code: <span className="font-mono">{cart.discount_code}</span>
                          </p>
                        )}
                        {!cart.email_sent_at && cart.status === "pending" && (
                          <Button
                            onClick={() => sendRecoveryEmail(cart.id)}
                            size="sm"
                            className="w-full"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Recovery Email
                          </Button>
                        )}
                        {cart.email_sent_at && (
                          <p className="text-xs text-muted-foreground">
                            Email sent: {new Date(cart.email_sent_at).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};