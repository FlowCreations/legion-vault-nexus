import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const tunepipeApiKey = Deno.env.get('TUNEPIPE_API_KEY')!;
    
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
      // Based on websitebuilder.docs.apiary.io documentation
      // Using hypothetical API endpoints - adjust based on actual API docs
      const tunepipeBaseUrl = 'https://api.tunepipe.com/v1'; // Adjust to actual base URL
      
      if (action === 'sync_all' || action === 'fetch_campaigns') {
        result.synced.campaigns = await fetchCampaigns(supabase, tunepipeBaseUrl, tunepipeApiKey);
      }
      
      if (action === 'sync_all' || action === 'fetch_subscribers') {
        result.synced.subscribers = await fetchSubscribers(supabase, tunepipeBaseUrl, tunepipeApiKey);
      }
      
      if (action === 'sync_all' || action === 'fetch_analytics') {
        result.synced.analytics_events = await fetchAnalytics(supabase, tunepipeBaseUrl, tunepipeApiKey);
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

async function fetchCampaigns(supabase: any, baseUrl: string, apiKey: string): Promise<number> {
  console.log('Fetching campaigns from Tunepipe...');
  
  try {
    // TODO: Adjust endpoint based on actual Tunepipe API documentation
    const response = await fetch(`${baseUrl}/campaigns`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Tunepipe API error: ${response.status} ${response.statusText}`);
    }

    const campaigns: TunepipeCampaign[] = await response.json();
    console.log(`Fetched ${campaigns.length} campaigns from Tunepipe`);

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

  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

async function fetchSubscribers(supabase: any, baseUrl: string, apiKey: string): Promise<number> {
  console.log('Fetching subscribers from Tunepipe...');
  
  try {
    // TODO: Adjust endpoint based on actual Tunepipe API documentation
    const response = await fetch(`${baseUrl}/subscribers`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Tunepipe API error: ${response.status} ${response.statusText}`);
    }

    const subscribers: TunepipeSubscriber[] = await response.json();
    console.log(`Fetched ${subscribers.length} subscribers from Tunepipe`);

    let syncedCount = 0;

    for (const subscriber of subscribers) {
      // Find or create user by email
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(subscriber.email);
      
      if (userError && userError.message !== 'User not found') {
        console.error('Error checking user:', userError);
        continue;
      }

      let userId = existingUser?.user?.id;

      // If user doesn't exist, we'll update their profile when they sign up
      // For now, just track the Tunepipe subscriber ID
      
      if (userId) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            tunepipe_subscriber_id: subscriber.id,
            external_ids: {
              tunepipe: subscriber.id,
              tunepipe_custom_fields: subscriber.custom_fields || {}
            },
            subscription_source: 'tunepipe'
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (profileError) {
          console.error('Error updating profile:', profileError);
        } else {
          syncedCount++;
        }
      } else {
        // Log subscriber for future matching when they sign up
        console.log(`Subscriber ${subscriber.email} not yet in system`);
      }
    }

    return syncedCount;

  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
}

async function fetchAnalytics(supabase: any, baseUrl: string, apiKey: string): Promise<number> {
  console.log('Fetching analytics from Tunepipe...');
  
  try {
    // TODO: Adjust endpoint based on actual Tunepipe API documentation
    const response = await fetch(`${baseUrl}/analytics`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Tunepipe API error: ${response.status} ${response.statusText}`);
    }

    const analyticsData: TunepipeAnalytics[] = await response.json();
    console.log(`Fetched ${analyticsData.length} analytics events from Tunepipe`);

    let syncedCount = 0;

    for (const analytics of analyticsData) {
      // Find campaign by Tunepipe campaign ID
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('id')
        .eq('analytics->>tunepipe_campaign_id', analytics.campaign_id)
        .single();

      if (!campaign) {
        console.log(`Campaign not found for Tunepipe ID: ${analytics.campaign_id}`);
        continue;
      }

      // Find user by email
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(analytics.email);
      
      if (!existingUser?.user) {
        console.log(`User not found for email: ${analytics.email}`);
        continue;
      }

      // Create or update email_sends record
      const { error: sendError } = await supabase
        .from('email_sends')
        .upsert({
          campaign_id: campaign.id,
          user_id: existingUser.user.id,
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

      if (sendError) {
        console.error('Error upserting email send:', sendError);
      } else {
        syncedCount++;

        // Create events for scoring
        if (analytics.opened && analytics.opened_at) {
          await supabase.from('events').insert({
            type: 'email_opened',
            member_id: existingUser.user.id,
            content_id: campaign.id,
            value: 5,
            ts: new Date(analytics.opened_at).toISOString(),
            meta: { source: 'tunepipe', campaign_id: analytics.campaign_id }
          });
        }

        if (analytics.clicked && analytics.clicked_at) {
          await supabase.from('events').insert({
            type: 'email_clicked',
            member_id: existingUser.user.id,
            content_id: campaign.id,
            value: 10,
            ts: new Date(analytics.clicked_at).toISOString(),
            meta: { source: 'tunepipe', campaign_id: analytics.campaign_id }
          });
        }
      }
    }

    return syncedCount;

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
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
