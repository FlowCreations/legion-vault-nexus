import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings } from "lucide-react";

interface CartSettings {
  delay_days: number;
  discount_percentage: number;
  min_cart_value: number;
  code_validity_days: number;
}

export const AbandonedCartSettings = () => {
  const [settings, setSettings] = useState<CartSettings>({
    delay_days: 3,
    discount_percentage: 25,
    min_cart_value: 20,
    code_validity_days: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('abandoned_cart_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          delay_days: data.delay_days,
          discount_percentage: data.discount_percentage,
          min_cart_value: Number(data.min_cart_value),
          code_validity_days: data.code_validity_days,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load abandoned cart settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('abandoned_cart_settings')
        .update({
          delay_days: settings.delay_days,
          discount_percentage: settings.discount_percentage,
          min_cart_value: settings.min_cart_value,
          code_validity_days: settings.code_validity_days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Abandoned cart settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CartSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Recovery Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your abandoned cart recovery parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="delay_days">Delay Before Email (Days)</Label>
          <Input
            id="delay_days"
            type="number"
            min="1"
            max="30"
            value={settings.delay_days}
            onChange={(e) => handleChange('delay_days', parseInt(e.target.value) || 1)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Time to wait before sending recovery email (1-30 days)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
          <Input
            id="discount_percentage"
            type="number"
            min="5"
            max="75"
            value={settings.discount_percentage}
            onChange={(e) => handleChange('discount_percentage', parseInt(e.target.value) || 5)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Discount to offer in recovery email (5-75%)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_cart_value">Minimum Cart Value ($)</Label>
          <Input
            id="min_cart_value"
            type="number"
            min="1"
            step="0.01"
            value={settings.min_cart_value}
            onChange={(e) => handleChange('min_cart_value', parseFloat(e.target.value) || 1)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Only send recovery for carts above this value
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code_validity_days">Discount Code Validity (Days)</Label>
          <Input
            id="code_validity_days"
            type="number"
            min="1"
            max="30"
            value={settings.code_validity_days}
            onChange={(e) => handleChange('code_validity_days', parseInt(e.target.value) || 1)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            How long the discount code remains valid (1-30 days)
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
