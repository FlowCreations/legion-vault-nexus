-- Create table for survey discount codes
CREATE TABLE public.survey_discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  discount_code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL DEFAULT 50,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_discount_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view their own discount codes"
  ON public.survey_discount_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert codes
CREATE POLICY "System can insert discount codes"
  ON public.survey_discount_codes
  FOR INSERT
  WITH CHECK (true);

-- Merchants can view all codes
CREATE POLICY "Merchants can view all discount codes"
  ON public.survey_discount_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- Merchants can update codes
CREATE POLICY "Merchants can update discount codes"
  ON public.survey_discount_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- Create table for merchant notifications
CREATE TABLE public.merchant_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;

-- Merchants can view notifications
CREATE POLICY "Merchants can view notifications"
  ON public.merchant_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- Merchants can update notifications (mark as read)
CREATE POLICY "Merchants can update notifications"
  ON public.merchant_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON public.merchant_notifications
  FOR INSERT
  WITH CHECK (true);