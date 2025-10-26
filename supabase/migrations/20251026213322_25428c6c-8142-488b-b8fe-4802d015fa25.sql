-- Allow anonymous and authenticated users to track events
CREATE POLICY "Allow anonymous event tracking"
ON user_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated event tracking"
ON user_events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own events"
ON user_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow anonymous users to view their session events"
ON user_events
FOR SELECT
TO anon
USING (true);