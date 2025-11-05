import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🗄️ Starting event archival process...');

    // Call the database function to archive old events
    const { data, error } = await supabase.rpc('archive_old_events');

    if (error) {
      console.error('❌ Error archiving events:', error);
      throw error;
    }

    const archivedCount = data || 0;
    console.log(`✅ Successfully archived ${archivedCount} old events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        archived: archivedCount,
        message: `Archived ${archivedCount} events older than 90 days` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in archive-old-events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
