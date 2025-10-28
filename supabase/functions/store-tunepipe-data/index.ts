import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Campaign {
  id: string;
  name: string;
  subject?: string;
  sent_at?: string;
  stats?: {
    sent?: number;
    opened?: number;
    clicked?: number;
  };
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribed?: boolean;
  created_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaigns, subscribers, analytics } = await req.json();
    
    console.log('Received data to store:', {
      campaignCount: campaigns?.length || 0,
      subscriberCount: subscribers?.length || 0,
      analyticsCount: analytics?.length || 0
    });

    const results = {
      campaigns: 0,
      subscribers: 0,
      analytics_events: 0,
      errors: [] as string[]
    };

    // Store campaigns
    if (campaigns && Array.isArray(campaigns)) {
      try {
        const campaignRecords = campaigns.map((c: Campaign) => ({
          external_id: String(c.id),
          name: c.name || 'Untitled Campaign',
          subject: c.subject || '',
          email_body: '',
          status: c.sent_at ? 'sent' : 'draft',
          sent_at: c.sent_at || null,
          analytics: {
            sent: c.stats?.sent || 0,
            opened: c.stats?.opened || 0,
            clicked: c.stats?.clicked || 0
          }
        }));

        const { error: campaignError } = await supabaseClient
          .from('email_campaigns')
          .upsert(campaignRecords, { 
            onConflict: 'external_id',
            ignoreDuplicates: false 
          });

        if (campaignError) {
          console.error('Error storing campaigns:', campaignError);
          results.errors.push(`Campaigns: ${campaignError.message}`);
        } else {
          results.campaigns = campaignRecords.length;
          console.log(`Stored ${campaignRecords.length} campaigns`);
        }
      } catch (error: any) {
        console.error('Error processing campaigns:', error);
        results.errors.push(`Campaigns processing: ${error.message}`);
      }
    }

    // Store subscribers
    if (subscribers && Array.isArray(subscribers)) {
      try {
        for (const sub of subscribers) {
          if (!sub.email) continue;

          // Try to find existing user by email
          const { data: existingUsers } = await supabaseClient
            .from('user_profiles')
            .select('user_id, email')
            .eq('email', sub.email)
            .limit(1);

          if (existingUsers && existingUsers.length > 0) {
            // Update existing user profile with subscription status
            const { error: updateError } = await supabaseClient
              .from('user_profiles')
              .update({
                subscription_tier: sub.subscribed ? 'email_subscriber' : 'free',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', existingUsers[0].user_id);

            if (!updateError) {
              results.subscribers++;
            } else {
              console.error('Error updating subscriber:', updateError);
            }
          }
        }
        console.log(`Processed ${results.subscribers} subscribers`);
      } catch (error: any) {
        console.error('Error processing subscribers:', error);
        results.errors.push(`Subscribers processing: ${error.message}`);
      }
    }

    // Store analytics events
    if (analytics && Array.isArray(analytics)) {
      try {
        const analyticsRecords = analytics.map((a: any) => ({
          email_address: a.email,
          campaign_id: null, // Could be linked if we have campaign mapping
          opened_at: a.opened ? new Date().toISOString() : null,
          clicked_at: a.clicked ? new Date().toISOString() : null,
          metadata: {
            source: 'tunepipe',
            imported_at: new Date().toISOString()
          }
        }));

        const { error: analyticsError } = await supabaseClient
          .from('email_sends')
          .insert(analyticsRecords);

        if (analyticsError) {
          console.error('Error storing analytics:', analyticsError);
          results.errors.push(`Analytics: ${analyticsError.message}`);
        } else {
          results.analytics_events = analyticsRecords.length;
          console.log(`Stored ${analyticsRecords.length} analytics events`);
        }
      } catch (error: any) {
        console.error('Error processing analytics:', error);
        results.errors.push(`Analytics processing: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        synced: results,
        errors: results.errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in store-tunepipe-data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
