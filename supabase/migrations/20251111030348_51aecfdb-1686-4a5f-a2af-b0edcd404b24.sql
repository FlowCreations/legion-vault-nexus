-- Create abandoned cart settings table
CREATE TABLE IF NOT EXISTS abandoned_cart_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delay_days INTEGER NOT NULL DEFAULT 3,
  discount_percentage INTEGER NOT NULL DEFAULT 25,
  min_cart_value NUMERIC NOT NULL DEFAULT 20,
  code_validity_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE abandoned_cart_settings ENABLE ROW LEVEL SECURITY;

-- Merchants can manage settings
CREATE POLICY "Merchants can manage abandoned cart settings"
  ON abandoned_cart_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('merchant', 'admin')
    )
  );

-- Insert default settings (only one row should exist)
INSERT INTO abandoned_cart_settings (id, delay_days, discount_percentage, min_cart_value, code_validity_days)
VALUES ('00000000-0000-0000-0000-000000000001', 3, 25, 20, 7)
ON CONFLICT (id) DO NOTHING;