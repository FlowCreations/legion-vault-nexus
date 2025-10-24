import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEARTBEAT_API_KEY = Deno.env.get('HEARTBEAT_API_KEY');
const HEARTBEAT_API_URL = 'https://api.heartbeat.chat/v0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Heartbeat sync action:', action);

    switch (action) {
      case 'get_members': {
        // Fetch members from Heartbeat
        const response = await fetch(`${HEARTBEAT_API_URL}/members`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Heartbeat API error: ${response.statusText}`);
        }

        const members = await response.json();
        console.log(`Fetched ${members.length} members from Heartbeat`);

        return new Response(
          JSON.stringify({ success: true, members }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_member': {
        const { memberId } = await req.json();
        
        const response = await fetch(`${HEARTBEAT_API_URL}/members/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Heartbeat API error: ${response.statusText}`);
        }

        const member = await response.json();
        
        return new Response(
          JSON.stringify({ success: true, member }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_to_database': {
        // Fetch members from Heartbeat
        const response = await fetch(`${HEARTBEAT_API_URL}/members`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Heartbeat API error: ${response.statusText}`);
        }

        const members = await response.json();
        console.log(`Syncing ${members.length} members to database`);

        // Sync members to user_profiles table
        for (const member of members) {
          // Check if user profile exists
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('heartbeat_member_id', member.id)
            .maybeSingle();

          if (!existingProfile) {
            // Create or update profile
            const { error } = await supabase
              .from('user_profiles')
              .upsert({
                heartbeat_member_id: member.id,
                display_name: member.name || member.email?.split('@')[0],
                avatar_url: member.avatar_url,
                bio: member.bio,
                location: member.location,
                tier: member.subscription_tier,
              });

            if (error) {
              console.error('Error syncing member:', member.id, error);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, synced: members.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in heartbeat-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
