-- Create search_queries table to track what users search for in the portal
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  query_text TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  result_clicked BOOLEAN DEFAULT false,
  clicked_result_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  search_context TEXT -- e.g., 'music', 'merch', 'videos', 'shows'
);

-- Enable RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert search queries
CREATE POLICY "Anyone can insert search queries"
  ON public.search_queries
  FOR INSERT
  WITH CHECK (true);

-- Policy: Merchants can view all search queries
CREATE POLICY "Merchants can view search queries"
  ON public.search_queries
  FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Index for faster queries
CREATE INDEX idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at DESC);
CREATE INDEX idx_search_queries_query_text ON public.search_queries USING gin(to_tsvector('english', query_text));

-- Create behavioral_data_snapshots table for monthly AI reports
CREATE TABLE IF NOT EXISTS public.behavioral_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Journey stage metrics
  discover_count INTEGER DEFAULT 0,
  engage_count INTEGER DEFAULT 0,
  invest_count INTEGER DEFAULT 0,
  loyal_count INTEGER DEFAULT 0,
  
  -- PTP/ERA aggregates
  avg_ptp_score NUMERIC DEFAULT 0,
  avg_era_score NUMERIC DEFAULT 0,
  high_ptp_count INTEGER DEFAULT 0,
  
  -- Behavioral signals
  total_searches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  
  -- Content engagement
  avg_session_duration_sec INTEGER DEFAULT 0,
  avg_content_consumed_minutes INTEGER DEFAULT 0,
  
  -- Commerce signals
  cart_additions INTEGER DEFAULT 0,
  cart_abandonments INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  
  -- Raw data (JSON for detailed breakdowns)
  top_search_terms JSONB DEFAULT '[]'::jsonb,
  top_discussed_topics JSONB DEFAULT '[]'::jsonb,
  ptp_calculation_details JSONB DEFAULT '{}'::jsonb,
  era_calculation_details JSONB DEFAULT '{}'::jsonb,
  journey_transitions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.behavioral_data_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can view snapshots
CREATE POLICY "Merchants can view behavioral snapshots"
  ON public.behavioral_data_snapshots
  FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Service role can manage snapshots
CREATE POLICY "Service role can manage behavioral snapshots"
  ON public.behavioral_data_snapshots
  FOR ALL
  USING (true);

-- Index for date-based queries
CREATE INDEX idx_behavioral_snapshots_date ON public.behavioral_data_snapshots(snapshot_date DESC);

-- Add trigger to update updated_at
CREATE TRIGGER update_behavioral_snapshots_updated_at
  BEFORE UPDATE ON public.behavioral_data_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();