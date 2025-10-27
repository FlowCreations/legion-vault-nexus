import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPixelStats {
  data: {
    name: string;
    period: string;
    values: Array<{
      value: number;
      end_time: string;
    }>;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Meta Pixel insights fetch...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Meta Access Token from environment
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    if (!metaAccessToken) {
      throw new Error('META_ACCESS_TOKEN not configured');
    }

    // Get Pixel ID from social_credentials
    const { data: credentials, error: credError } = await supabase
      .from('social_credentials')
      .select('credential_metadata')
      .eq('platform', 'meta')
      .eq('is_configured', true)
      .single();

    if (credError || !credentials) {
      console.error('No Meta credentials found:', credError);
      throw new Error('Meta Pixel not configured');
    }

    const pixelId = (credentials.credential_metadata as any)?.pixel_id;
    if (!pixelId) {
      throw new Error('Pixel ID not found in credentials');
    }

    console.log(`Aggregating insights from user_events for Pixel ID: ${pixelId}`);

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('Date range:', { start: startDate.toISOString(), end: endDate.toISOString() });

    // Query user_events table for Meta Pixel events
    const { data: events, error: eventsError } = await supabase
      .from('user_events')
      .select('event_type, created_at, session_id, user_id, event_data')
      .like('event_type', 'meta_pixel_%')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching user_events:', eventsError);
      throw new Error(`Database error: ${eventsError.message}`);
    }

    console.log(`Found ${events?.length || 0} Meta Pixel events in user_events table`);

    // Process and aggregate data by date
    const dailyInsights: Record<string, any> = {};

    if (events && events.length > 0) {
      for (const event of events) {
        // Extract date from created_at
        const date = event.created_at.split('T')[0];
        
        // Remove 'meta_pixel_' prefix to get the actual event name
        const eventName = event.event_type.replace('meta_pixel_', '');
        
        // Initialize daily insights object if it doesn't exist
        if (!dailyInsights[date]) {
          dailyInsights[date] = {
            pixel_id: pixelId,
            date,
            event_counts: {},
            unique_users: 0,
            conversions: 0,
            revenue: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            uniqueSessions: new Set(), // Temporary for counting unique sessions
          };
        }
        
        // Count this event
        dailyInsights[date].event_counts[eventName] = 
          (dailyInsights[date].event_counts[eventName] || 0) + 1;
        
        // Track unique sessions/users
        const sessionKey = event.session_id || event.user_id;
        if (sessionKey) {
          dailyInsights[date].uniqueSessions.add(sessionKey);
        }
        
        // Update specific metrics based on event type
        if (eventName === 'Purchase') {
          dailyInsights[date].conversions += 1;
          
          // Try to extract revenue from event_data
          if (event.event_data && typeof event.event_data === 'object') {
            const value = (event.event_data as any).value || 
                         (event.event_data as any).revenue || 
                         (event.event_data as any).amount;
            if (value && !isNaN(parseFloat(value))) {
              dailyInsights[date].revenue += parseFloat(value);
            }
          }
        }
        
        if (eventName === 'PageView') {
          dailyInsights[date].impressions += 1;
        }
        
        // Count clicks (AddToCart, InitiateCheckout, etc. are click-like events)
        if (['AddToCart', 'InitiateCheckout', 'ViewContent', 'AddPaymentInfo'].includes(eventName)) {
          dailyInsights[date].clicks += 1;
        }
      }
      
      // Convert unique sessions Set to count and calculate CTR
      for (const date in dailyInsights) {
        dailyInsights[date].unique_users = dailyInsights[date].uniqueSessions.size;
        delete dailyInsights[date].uniqueSessions; // Remove temporary Set
        
        // Calculate CTR (Click-Through Rate)
        if (dailyInsights[date].impressions > 0) {
          dailyInsights[date].ctr = dailyInsights[date].clicks / dailyInsights[date].impressions;
        }
      }
    }

    // Store insights in database
    const insightsArray = Object.values(dailyInsights);
    console.log(`Storing ${insightsArray.length} daily insights...`);

    if (insightsArray.length > 0) {
      const { error: insertError } = await supabase
        .from('meta_pixel_insights')
        .upsert(insightsArray, {
          onConflict: 'pixel_id,date',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('Error storing insights:', insertError);
        throw insertError;
      }
    }

    console.log('Meta Pixel insights aggregation completed successfully from user_events table');

    return new Response(
      JSON.stringify({
        success: true,
        insightsFetched: insightsArray.length,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in fetch-meta-insights:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
