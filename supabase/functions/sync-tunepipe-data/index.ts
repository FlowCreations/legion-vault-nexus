import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TUNEPIPE_BASE_URL = 'https://websitebuilder.tunepipe.com/api/v1';

interface TunepipeCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  sent_at?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

interface TunepipeSubscriber {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  custom_fields?: Record<string, any>;
}

interface TunepipeAnalytics {
  campaign_id: string;
  subscriber_id: string;
  email: string;
  opened?: boolean;
  opened_at?: string;
  clicked?: boolean;
  clicked_at?: string;
  bounced?: boolean;
  unsubscribed?: boolean;
  unsubscribed_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'sync_all' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('TUNEPIPE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting Tunepipe sync with action: ${action}`);
    
    const syncLogId = await logSyncStart(supabase, 'tunepipe', action);
    
    let result = {
      success: true,
      synced: {
        campaigns: 0,
        subscribers: 0,
        analytics_events: 0
      },
      errors: [] as string[]
    };

    try {
      if (action === 'sync_all' || action === 'fetch_campaigns') {
        result.synced.campaigns = await fetchCampaigns(apiKey, supabase);
      }
      
      if (action === 'sync_all' || action === 'fetch_subscribers') {
        result.synced.subscribers = await fetchSubscribers(apiKey, supabase);
      }
      
      if (action === 'sync_all' || action === 'fetch_analytics') {
        result.synced.analytics_events = await fetchAnalytics(apiKey, supabase);
      }

      await logSyncComplete(supabase, syncLogId, result.synced.campaigns + result.synced.subscribers + result.synced.analytics_events);
      
    } catch (error: any) {
      console.error('Tunepipe sync error:', error);
      result.success = false;
      result.errors.push(error.message);
      
      await logSyncError(supabase, syncLogId, error.message);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in sync-tunepipe-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});

async function fetchCampaigns(apiKey: string, supabase: any) {
  const url = `${TUNEPIPE_BASE_URL}/subscriber-lists`;
  
  // Enhanced browser-like headers to bypass Cloudflare
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  console.log('Fetching campaigns from:', url);
  
  // Add delay to mimic human behavior
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Tunepipe API Error Response:', errorText.substring(0, 500));
    throw new Error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Check if we got Cloudflare challenge page
  if (responseText.includes('Just a moment') || responseText.includes('cloudflare')) {
    console.error('Received Cloudflare challenge page');
    throw new Error('Cloudflare bot detection triggered. Please try again or contact support.');
  }
  
  const data = JSON.parse(responseText) as { data: TunepipeCampaign[] };
  const campaigns = data.data || [];
  
  console.log(`Fetched ${campaigns.length} campaigns`);

  let syncedCount = 0;

  for (const campaign of campaigns) {
    const { error } = await supabase
      .from('email_campaigns')
      .upsert({
        name: campaign.name,
        subject: campaign.subject,
        email_body: campaign.body,
        status: campaign.status === 'sent' ? 'sent' : 'draft',
        sent_at: campaign.sent_at ? new Date(campaign.sent_at).toISOString() : null,
        ai_generated: false,
        analytics: {
          external_source: 'tunepipe',
          tunepipe_campaign_id: campaign.id,
          sent_count: campaign.stats?.sent || 0,
          open_rate: campaign.stats?.opened && campaign.stats?.sent 
            ? (campaign.stats.opened / campaign.stats.sent * 100).toFixed(2)
            : 0,
          click_rate: campaign.stats?.clicked && campaign.stats?.sent
            ? (campaign.stats.clicked / campaign.stats.sent * 100).toFixed(2)
            : 0,
          unique_opens: campaign.stats?.opened || 0,
          unique_clicks: campaign.stats?.clicked || 0,
        }
      }, {
        onConflict: 'analytics->tunepipe_campaign_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error upserting campaign:', error);
    } else {
      syncedCount++;
    }
  }

  return syncedCount;
}

async function fetchSubscribers(apiKey: string, supabase: any) {
  const url = `${TUNEPIPE_BASE_URL}/contacts?subscribed=true&limit=100`;
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  console.log('Fetching subscribers from:', url);
  
  // Add delay to mimic human behavior
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Tunepipe API Error Response:', errorText.substring(0, 500));
    throw new Error(`Failed to fetch subscribers: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Check if we got Cloudflare challenge page
  if (responseText.includes('Just a moment') || responseText.includes('cloudflare')) {
    console.error('Received Cloudflare challenge page');
    throw new Error('Cloudflare bot detection triggered. Please try again or contact support.');
  }
  
  const data = JSON.parse(responseText) as { data: TunepipeSubscriber[] };
  const subscribers = data.data || [];
  
  console.log(`Fetched ${subscribers.length} subscribers`);

  let syncedCount = 0;

  for (const subscriber of subscribers) {
    // Find user by email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', subscriber.email)
      .single();

    if (profile) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          tunepipe_subscriber_id: subscriber.id,
          external_ids: {
            tunepipe: subscriber.id,
            tunepipe_custom_fields: subscriber.custom_fields || {}
          }
        })
        .eq('user_id', profile.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      } else {
        syncedCount++;
      }
    }
  }

  return syncedCount;
}

async function fetchAnalytics(apiKey: string, supabase: any) {
  const url = `${TUNEPIPE_BASE_URL}/contacts?limit=100`;
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  console.log('Fetching analytics from:', url);
  
  // Add delay to mimic human behavior
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Tunepipe API Error Response:', errorText.substring(0, 500));
    throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  
  // Check if we got Cloudflare challenge page
  if (responseText.includes('Just a moment') || responseText.includes('cloudflare')) {
    console.error('Received Cloudflare challenge page');
    throw new Error('Cloudflare bot detection triggered. Please try again or contact support.');
  }
  
  const data = JSON.parse(responseText) as { data: TunepipeAnalytics[] };
  const analyticsData = data.data || [];
  
  console.log(`Fetched ${analyticsData.length} analytics events`);

  let syncedCount = 0;

  for (const analytics of analyticsData) {
    // Find campaign by Tunepipe campaign ID
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('analytics->>tunepipe_campaign_id', analytics.campaign_id)
      .single();

    if (!campaign) {
      continue;
    }

    // Find user by email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', analytics.email)
      .single();
    
    if (!profile) {
      continue;
    }

    // Create or update email_sends record
    const { error: sendError } = await supabase
      .from('email_sends')
      .upsert({
        campaign_id: campaign.id,
        user_id: profile.user_id,
        email_address: analytics.email,
        opened_at: analytics.opened && analytics.opened_at ? new Date(analytics.opened_at).toISOString() : null,
        clicked_at: analytics.clicked && analytics.clicked_at ? new Date(analytics.clicked_at).toISOString() : null,
        bounced: analytics.bounced || false,
        unsubscribed_at: analytics.unsubscribed && analytics.unsubscribed_at ? new Date(analytics.unsubscribed_at).toISOString() : null,
        metadata: {
          source: 'tunepipe',
          tunepipe_subscriber_id: analytics.subscriber_id
        }
      }, {
        onConflict: 'campaign_id,user_id',
        ignoreDuplicates: false
      });

    if (!sendError) {
      syncedCount++;

      // Create events for scoring
      if (analytics.opened && analytics.opened_at) {
        await supabase.from('events').insert({
          type: 'email_opened',
          member_id: profile.user_id,
          content_id: campaign.id,
          value: 5,
          ts: new Date(analytics.opened_at).toISOString(),
          meta: { source: 'tunepipe', campaign_id: analytics.campaign_id }
        });
      }

      if (analytics.clicked && analytics.clicked_at) {
        await supabase.from('events').insert({
          type: 'email_clicked',
          member_id: profile.user_id,
          content_id: campaign.id,
          value: 10,
          ts: new Date(analytics.clicked_at).toISOString(),
          meta: { source: 'tunepipe', campaign_id: analytics.campaign_id }
        });
      }
    }
  }

  return syncedCount;
}

async function logSyncStart(supabase: any, apiName: string, syncType: string): Promise<string> {
  const { data, error } = await supabase
    .from('api_sync_logs')
    .insert({
      api_name: apiName,
      sync_type: syncType,
      status: 'in_progress'
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging sync start:', error);
    throw error;
  }

  return data.id;
}

async function logSyncComplete(supabase: any, logId: string, recordsSynced: number) {
  await supabase
    .from('api_sync_logs')
    .update({
      status: 'completed',
      records_synced: recordsSynced,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);
}

async function logSyncError(supabase: any, logId: string, errorMessage: string) {
  await supabase
    .from('api_sync_logs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);
}
