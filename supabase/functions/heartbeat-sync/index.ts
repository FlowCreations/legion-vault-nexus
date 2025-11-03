import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEARTBEAT_API_KEY = Deno.env.get('HEARTBEAT_API_KEY');
const HEARTBEAT_API_URL = 'https://api.heartbeat.chat/v0';
const HEARTBEAT_WORKSPACE_ID = 'sonsoflegion';

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
        // Try multiple endpoint formats to find what works
        const endpoints = [
          `/users?workspace=${HEARTBEAT_WORKSPACE_ID}`,
          `/workspaces/${HEARTBEAT_WORKSPACE_ID}/users`,
          `/users`,
          `/members?workspace=${HEARTBEAT_WORKSPACE_ID}`,
        ];

        let members = null;
        let successEndpoint = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${HEARTBEAT_API_URL}${endpoint}`);
            const response = await fetch(`${HEARTBEAT_API_URL}${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json',
              },
            });

            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

            if (response.ok) {
              const data = await response.json();
              console.log(`Response data structure:`, JSON.stringify(data, null, 2));
              
              // Handle different possible response structures
              members = data.users || data.data || data.members || (Array.isArray(data) ? data : null);
              
              if (members) {
                successEndpoint = endpoint;
                console.log(`✅ Success with endpoint: ${endpoint}`);
                console.log(`Found ${Array.isArray(members) ? members.length : 0} members`);
                break;
              }
            }
          } catch (err) {
            console.log(`❌ Failed with endpoint ${endpoint}:`, err);
          }
        }

        if (!members) {
          throw new Error('Could not fetch members from any endpoint');
        }

        return new Response(
          JSON.stringify({ success: true, members, endpoint: successEndpoint }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_member': {
        console.log(`Fetching member: ${memberId}`);
        const response = await fetch(`${HEARTBEAT_API_URL}/users/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
        });

        console.log(`Get member response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Heartbeat API error:`, errorText);
          throw new Error(`Heartbeat API error: ${response.statusText}`);
        }

        const member = await response.json();
        console.log(`Member data:`, JSON.stringify(member, null, 2));
        
        return new Response(
          JSON.stringify({ success: true, member }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_to_database': {
        console.log('🔄 Starting Heartbeat member sync...');
        
        // Try multiple endpoint formats to find what works
        const endpoints = [
          `/users?workspace=${HEARTBEAT_WORKSPACE_ID}`,
          `/workspaces/${HEARTBEAT_WORKSPACE_ID}/users`,
          `/users`,
          `/members?workspace=${HEARTBEAT_WORKSPACE_ID}`,
        ];

        let members = null;
        let successEndpoint = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${HEARTBEAT_API_URL}${endpoint}`);
            const response = await fetch(`${HEARTBEAT_API_URL}${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json',
              },
            });

            console.log(`Response status: ${response.status}`);

            if (response.ok) {
              const data = await response.json();
              console.log(`Response data structure:`, JSON.stringify(data, null, 2).substring(0, 500));
              
              // Handle different possible response structures
              members = data.users || data.data || data.members || (Array.isArray(data) ? data : null);
              
              if (members && Array.isArray(members)) {
                successEndpoint = endpoint;
                console.log(`✅ Success with endpoint: ${endpoint}`);
                console.log(`Found ${members.length} members to sync`);
                if (members.length > 0) {
                  console.log(`Sample member structure:`, JSON.stringify(members[0], null, 2));
                }
                break;
              }
            } else {
              const errorText = await response.text();
              console.log(`❌ Failed with status ${response.status}:`, errorText);
            }
          } catch (err) {
            console.log(`❌ Error with endpoint ${endpoint}:`, err);
          }
        }

        if (!members || !Array.isArray(members)) {
          throw new Error('Could not fetch members from any endpoint');
        }

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

              // Create profile with flexible Heartbeat data mapping
              const profileData = {
                user_id: authData.user.id,
                heartbeat_member_id: member.id,
                display_name: member.name || member.display_name || member.username || 
                             member.displayName || member.email?.split('@')[0] || 'Unknown Member',
                real_name: member.full_name || member.fullName || member.realName || 
                          member.name || null,
                avatar_url: member.avatar_url || member.avatarUrl || 
                           member.profile_picture_url || member.profilePictureUrl || 
                           member.picture || member.image || null,
                bio: member.bio || member.description || member.about || 
                    member.profile_description || null,
                location: member.location || member.city || member.address?.city || 
                         member.location_name || null,
                tier: member.subscription_tier || member.subscriptionTier || 
                     member.membership_level || member.membershipLevel || 
                     member.tier || 'free',
                is_public: true, // Make visible in Community Hub
              };

              console.log(`Creating profile for member ${member.id}:`, profileData);

              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert(profileData);

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
