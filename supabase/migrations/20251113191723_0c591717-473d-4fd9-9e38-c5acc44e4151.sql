-- Create storage bucket for email campaign assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true);

-- Create RLS policies for email assets bucket
CREATE POLICY "Email assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own email assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own email assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-assets' 
  AND auth.role() = 'authenticated'
);