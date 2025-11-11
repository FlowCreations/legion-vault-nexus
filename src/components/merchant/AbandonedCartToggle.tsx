import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const AbandonedCartToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureFlag();
  }, []);

  const loadFeatureFlag = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('flag_name', 'abandoned_cart_recovery_enabled')
        .single();

      if (error) throw error;
      setEnabled(data?.enabled || false);
    } catch (error) {
      console.error('Error loading feature flag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      setEnabled(checked);

      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: checked })
        .eq('flag_name', 'abandoned_cart_recovery_enabled');

      if (error) throw error;

      toast.success(
        checked
          ? "Abandoned cart recovery enabled"
          : "Abandoned cart recovery disabled",
        {
          description: checked
            ? "Customers will receive 25% discount codes after 3 days"
            : "No abandoned cart emails will be sent"
        }
      );
    } catch (error) {
      console.error('Error updating feature flag:', error);
      setEnabled(!checked);
      toast.error("Failed to update setting");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <CardTitle>Abandoned Cart Recovery</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-10 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle>Abandoned Cart Recovery</CardTitle>
        </div>
        <CardDescription>
          Automatically send discount codes to recover abandoned shopping carts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="abandoned-cart-toggle" className="text-base font-medium">
                Enable Recovery System
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>When enabled, the system detects carts abandoned for 3+ days and automatically:</p>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Generates unique 25% discount codes via Shopify</li>
                      <li>Sends recovery emails with discount details</li>
                      <li>Shows popup offers when users return to portal</li>
                      <li>Tracks recovery performance and revenue</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="abandoned-cart-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {enabled && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Current Settings:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="font-medium">Trigger Delay:</span> 3 days after cart abandonment</li>
                <li>• <span className="font-medium">Discount:</span> 25% off</li>
                <li>• <span className="font-medium">Minimum Cart Value:</span> $20</li>
                <li>• <span className="font-medium">Code Validity:</span> 7 days</li>
                <li>• <span className="font-medium">Delivery:</span> Email + Portal popup on return</li>
              </ul>
            </div>
          )}

          {!enabled && (
            <p className="text-sm text-muted-foreground">
              Enable this feature to start recovering abandoned carts automatically. The system will wait 3 days before sending recovery offers to give customers time to complete their purchase naturally.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};