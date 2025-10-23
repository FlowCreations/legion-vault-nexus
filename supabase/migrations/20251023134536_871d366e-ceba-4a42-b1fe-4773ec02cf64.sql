-- Update RLS policy to allow authenticated users to insert their own content analyses
DROP POLICY IF EXISTS "Merchants can insert analyses" ON content_analyses;

CREATE POLICY "Authenticated users can insert their own analyses"
ON content_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = merchant_id);

-- Also allow users to view their own analyses
DROP POLICY IF EXISTS "Merchants can view their own analyses" ON content_analyses;

CREATE POLICY "Users can view their own analyses"
ON content_analyses
FOR SELECT
TO authenticated
USING (auth.uid() = merchant_id OR has_role(auth.uid(), 'admin'::app_role));

-- Allow users to delete their own analyses
DROP POLICY IF EXISTS "Merchants can delete their own analyses" ON content_analyses;

CREATE POLICY "Users can delete their own analyses"
ON content_analyses
FOR DELETE
TO authenticated
USING (auth.uid() = merchant_id OR has_role(auth.uid(), 'admin'::app_role));