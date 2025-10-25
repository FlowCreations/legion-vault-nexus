import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEARTBEAT_API_KEY = Deno.env.get('HEARTBEAT_API_KEY');
const HEARTBEAT_API_URL = 'https://api.heartbeat.chat/api/v1';
const HEARTBEAT_WORKSPACE_ID = '12345'; // Numeric workspace ID

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, memberId } = body;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Heartbeat sync action:', action);

    switch (action) {
      case 'get_members': {
        // Fetch members from Heartbeat with workspace_id as query param
        const response = await fetch(`${HEARTBEAT_API_URL}/members?workspace_id=${HEARTBEAT_WORKSPACE_ID}`, {
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
        // Fetch single member with workspace_id as query param
        const response = await fetch(`${HEARTBEAT_API_URL}/members/${memberId}?workspace_id=${HEARTBEAT_WORKSPACE_ID}`, {
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
        // Fetch members from Heartbeat with workspace_id as query param
        const response = await fetch(`${HEARTBEAT_API_URL}/members?workspace_id=${HEARTBEAT_WORKSPACE_ID}`, {
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
        let syncedCount = 0;
        const errors = [];
        
        for (const member of members) {
          try {
            // Check if user profile exists
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('heartbeat_member_id', member.id)
              .maybeSingle();

            if (!existingProfile) {
              // Create auth user for this Heartbeat member
              const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: member.email || `heartbeat-${member.id}@placeholder.com`,
                email_confirm: true,
                user_metadata: {
                  heartbeat_member_id: member.id,
                  synced_from_heartbeat: true
                }
              });

              if (authError) {
                console.error('Error creating auth user for member:', member.id, authError);
                errors.push({ memberId: member.id, error: authError.message });
                continue;
              }

              // Create profile with proper Heartbeat data mapping
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: authData.user.id,
                  heartbeat_member_id: member.id,
                  display_name: member.name || member.username || member.email?.split('@')[0],
                  real_name: member.full_name || member.name,
                  avatar_url: member.avatar_url || member.profile_picture_url,
                  bio: member.bio || member.description,
                  location: member.location || member.city,
                  tier: member.subscription_tier || member.membership_level || 'free',
                  is_public: true, // Make visible in Community Hub
                });

              if (profileError) {
                console.error('Error syncing member:', member.id, profileError);
                errors.push({ memberId: member.id, error: profileError.message });
              } else {
                syncedCount++;
              }
            }
          } catch (err) {
            console.error('Unexpected error syncing member:', member.id, err);
            errors.push({ memberId: member.id, error: err instanceof Error ? err.message : 'Unknown error' });
          }
        }

        console.log(`Successfully synced ${syncedCount} out of ${members.length} members`);
        if (errors.length > 0) {
          console.log('Errors encountered:', errors);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount,
            total: members.length,
            errors: errors.length > 0 ? errors : undefined
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in heartbeat-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
