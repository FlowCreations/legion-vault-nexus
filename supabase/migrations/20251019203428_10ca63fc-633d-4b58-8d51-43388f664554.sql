-- Update RLS policy for videos table to allow admins and merchants to update all videos
-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;

-- Create new policy that allows users to update their own videos OR allows admins/merchants to update any video
CREATE POLICY "Users and admins can update videos"
ON videos
FOR UPDATE
USING (
  auth.uid() = uploaded_by 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'merchant'::app_role)
);