import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { artist_id = 'sons-of-legion' } = await req.json().catch(() => ({}));

    // Fetch most recent cached data
    const { data, error } = await supabase
      .from('viberate_metrics')
      .select('*')
      .eq('artist_id', artist_id)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'No data found. Please sync first.' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if data is stale (older than 24 hours)
    const syncedAt = new Date(data.synced_at);
    const hoursSinceSync = (Date.now() - syncedAt.getTime()) / (1000 * 60 * 60);
    const isStale = hoursSinceSync > 24;

    // If stale, trigger background sync (fire and forget)
    if (isStale) {
      console.log('Data is stale, triggering background sync');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      fetch(`${supabaseUrl}/functions/v1/sync-viberate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artist_id }),
      }).catch(err => console.error('Background sync failed:', err));
    }

    return new Response(
      JSON.stringify({ 
        metrics: data.data,
        synced_at: data.synced_at,
        is_stale: isStale
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get metrics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});