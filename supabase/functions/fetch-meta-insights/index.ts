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

    console.log(`Fetching insights for Pixel ID: ${pixelId}`);

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const since = Math.floor(startDate.getTime() / 1000);
    const until = Math.floor(endDate.getTime() / 1000);

    // Fetch pixel stats from Facebook Graph API
    const apiUrl = `https://graph.facebook.com/v24.0/${pixelId}/stats`;
    const params = new URLSearchParams({
      access_token: metaAccessToken,
      fields: 'name,values',
      aggregation: 'event',
      since: since.toString(),
      until: until.toString(),
    });

    console.log('Calling Facebook Graph API:', apiUrl);
    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error:', response.status, errorText);
      throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
    }

    const pixelStats: FacebookPixelStats = await response.json();
    console.log('Received pixel stats:', JSON.stringify(pixelStats, null, 2));

    // Process and aggregate data by date
    const dailyInsights: Record<string, any> = {};

    if (pixelStats.data) {
      for (const stat of pixelStats.data) {
        const eventName = stat.name;
        
        for (const value of stat.values) {
          const date = value.end_time.split('T')[0];
          
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
            };
          }
          
          dailyInsights[date].event_counts[eventName] = value.value;
          
          // Update specific metrics
          if (eventName === 'Purchase') {
            dailyInsights[date].conversions += value.value;
          }
          if (eventName === 'PageView') {
            dailyInsights[date].impressions += value.value;
          }
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

    // Fetch revenue data from Purchase events
    const revenueUrl = `https://graph.facebook.com/v24.0/${pixelId}/events`;
    const revenueParams = new URLSearchParams({
      access_token: metaAccessToken,
      event: 'Purchase',
      aggregation: 'value',
      since: since.toString(),
      until: until.toString(),
    });

    const revenueResponse = await fetch(`${revenueUrl}?${revenueParams}`);
    if (revenueResponse.ok) {
      const revenueData = await revenueResponse.json();
      console.log('Revenue data:', JSON.stringify(revenueData, null, 2));
      
      // Update revenue in insights (if available)
      // This would require additional processing based on Facebook's response format
    }

    console.log('Meta Pixel insights sync completed successfully');

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
