-- Create cameos table
CREATE TABLE public.cameos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  recipient_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  recipient_manual_name TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'video', 'scheduled')),
  message_text TEXT,
  video_url TEXT,
  video_thumbnail_url TEXT,
  display_duration TEXT NOT NULL CHECK (display_duration IN ('permanent', 'auto_expire', 'show_once')),
  expires_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'viewed', 'scheduled')),
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cameo_notifications table (for future email integration)
CREATE TABLE public.cameo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cameo_id UUID REFERENCES public.cameos(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  notification_type TEXT DEFAULT 'email' CHECK (notification_type IN ('email', 'in_app', 'both')),
  email_enabled BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_cameos_recipient ON public.cameos(recipient_user_id);
CREATE INDEX idx_cameos_merchant ON public.cameos(merchant_id);
CREATE INDEX idx_cameos_status ON public.cameos(status);
CREATE INDEX idx_cameos_scheduled ON public.cameos(scheduled_for) WHERE status = 'scheduled';

-- Enable RLS
ALTER TABLE public.cameos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameo_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cameos
CREATE POLICY "Merchants and admins can manage all cameos"
ON public.cameos
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own active cameos"
ON public.cameos
FOR SELECT
USING (
  (recipient_user_id = auth.uid() AND status = 'active') OR
  (recipient_manual_name IS NOT NULL AND status = 'active')
);

-- RLS Policies for notifications
CREATE POLICY "Merchants and admins can manage notifications"
ON public.cameo_notifications
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own notifications"
ON public.cameo_notifications
FOR SELECT
USING (recipient_user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_cameos_updated_at
BEFORE UPDATE ON public.cameos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for cameo videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cameo-videos', 'cameo-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Merchants can upload cameo videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cameo-videos' AND (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Anyone can view cameo videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'cameo-videos');