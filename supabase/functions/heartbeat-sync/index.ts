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
    // Validate API key is configured
    if (!HEARTBEAT_API_KEY) {
      console.error('❌ HEARTBEAT_API_KEY is not configured');
      throw new Error('HEARTBEAT_API_KEY environment variable is not set');
    }
    
    console.log('✅ API Key configured (first 10 chars):', HEARTBEAT_API_KEY.substring(0, 10) + '...');
    
    const body = await req.json();
    const { action, memberId } = body;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Heartbeat sync action:', action);

    switch (action) {
      case 'get_members': {
        console.log('📥 Fetching Heartbeat members...');
        
        const response = await fetch(`${HEARTBEAT_API_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Heartbeat API error: ${response.status}`, errorText);
          throw new Error(`Heartbeat API error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        const members = responseData.users || responseData;
        console.log(`✅ Found ${members.length || 0} members`);

        return new Response(
          JSON.stringify({ success: true, members, total: responseData.total }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_member': {
        console.log(`📥 Fetching member: ${memberId}`);
        const response = await fetch(`${HEARTBEAT_API_URL}/users/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Heartbeat API error:`, errorText);
          throw new Error(`Heartbeat API error: ${response.statusText}`);
        }

        const member = await response.json();
        console.log(`✅ Member data:`, JSON.stringify(member, null, 2));
        
        return new Response(
          JSON.stringify({ success: true, member }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_channels': {
        console.log('📥 Fetching Heartbeat channels...');
        
        const response = await fetch(`${HEARTBEAT_API_URL}/channelCategories`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Heartbeat API error: ${response.status}`, errorText);
          throw new Error(`Heartbeat API error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        console.log(`✅ Channels response:`, JSON.stringify(responseData, null, 2));

        return new Response(
          JSON.stringify({ success: true, channels: responseData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_announcements': {
        console.log('🔄 Starting Heartbeat announcements sync...');
        
        // Step 1: Fetch all channel categories to find Announcements
        const channelsResponse = await fetch(`${HEARTBEAT_API_URL}/channelCategories`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!channelsResponse.ok) {
          const errorText = await channelsResponse.text();
          console.error(`❌ Failed to fetch channels: ${channelsResponse.status}`, errorText);
          throw new Error(`Failed to fetch channels: ${channelsResponse.status}`);
        }

        const channelsData = await channelsResponse.json();
        console.log('📊 Channel categories:', JSON.stringify(channelsData, null, 2));
        
        // Find announcements channel - look through all categories and their channels
        let announcementChannelId: string | null = null;
        const categories = channelsData.channelCategories || channelsData || [];
        
        for (const category of categories) {
          const channels = category.channels || [];
          for (const channel of channels) {
            const channelName = (channel.name || '').toLowerCase();
            if (channelName.includes('announcement') || channelName.includes('news') || channelName.includes('update')) {
              announcementChannelId = channel.id;
              console.log(`✅ Found announcements channel: ${channel.name} (ID: ${channel.id})`);
              break;
            }
          }
          if (announcementChannelId) break;
        }

        if (!announcementChannelId) {
          // Try getting all channels directly
          console.log('🔍 Trying direct channels endpoint...');
          const directChannelsResponse = await fetch(`${HEARTBEAT_API_URL}/channels`, {
            headers: {
              'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
              'Accept': 'application/json',
            },
          });
          
          if (directChannelsResponse.ok) {
            const directChannels = await directChannelsResponse.json();
            console.log('📊 Direct channels:', JSON.stringify(directChannels, null, 2));
            
            const channelList = directChannels.channels || directChannels || [];
            for (const channel of channelList) {
              const channelName = (channel.name || '').toLowerCase();
              if (channelName.includes('announcement') || channelName.includes('news') || channelName.includes('update')) {
                announcementChannelId = channel.id;
                console.log(`✅ Found announcements channel: ${channel.name} (ID: ${channel.id})`);
                break;
              }
            }
          }
        }

        if (!announcementChannelId) {
          console.warn('⚠️ No announcements channel found, returning available channels');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'No announcements channel found',
              availableChannels: categories
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Step 2: Fetch threads from the announcements channel
        console.log(`📥 Fetching threads from channel ${announcementChannelId}...`);
        const threadsResponse = await fetch(`${HEARTBEAT_API_URL}/channels/${announcementChannelId}/threads`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!threadsResponse.ok) {
          const errorText = await threadsResponse.text();
          console.error(`❌ Failed to fetch threads: ${threadsResponse.status}`, errorText);
          throw new Error(`Failed to fetch threads: ${threadsResponse.status}`);
        }

        const threadsData = await threadsResponse.json();
        const threads = threadsData.threads || threadsData || [];
        console.log(`✅ Found ${threads.length} threads`);

        // Step 3: Get or create official Sons of Legion profile
        let officialUserId: string | null = null;
        
        // First try to find profiles with valid user_id for FK constraint
        const { data: validProfiles } = await supabase
          .from('user_profiles')
          .select('user_id')
          .not('user_id', 'is', null)
          .limit(1);
        
        if (validProfiles && validProfiles.length > 0) {
          officialUserId = validProfiles[0].user_id;
          console.log(`✅ Using existing user_id for posts: ${officialUserId}`);
        }

        // Step 4: Sync threads to community_posts
        let syncedCount = 0;
        let updatedCount = 0;
        const errors: Array<{ threadId: string; error: string }> = [];

        for (const thread of threads) {
          try {
            const threadId = thread.id || thread._id;
            const content = thread.body || thread.content || thread.text || '';
            const authorName = thread.author?.name || thread.user?.name || 'Sons of Legion';
            
            // Try to find the author by heartbeat_member_id
            let postUserId = officialUserId;
            if (thread.author?.id || thread.user?.id) {
              const authorHeartbeatId = thread.author?.id || thread.user?.id;
              const { data: authorProfile } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('heartbeat_member_id', authorHeartbeatId)
                .not('user_id', 'is', null)
                .maybeSingle();
              
              if (authorProfile?.user_id) {
                postUserId = authorProfile.user_id;
              }
            }

            if (!postUserId) {
              console.warn(`⚠️ No valid user_id for thread ${threadId}, skipping...`);
              errors.push({ threadId, error: 'No valid user_id available for FK constraint' });
              continue;
            }

            const postData = {
              heartbeat_thread_id: threadId,
              user_id: postUserId,
              content: content,
              category: 'announcements',
              post_type: thread.attachments?.length > 0 ? 'media' : 'text',
              media_url: thread.attachments?.[0]?.url || null,
              link_url: thread.links?.[0]?.url || null,
              created_at: thread.created_at || thread.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Check if thread already exists
            const { data: existingPost } = await supabase
              .from('community_posts')
              .select('id')
              .eq('heartbeat_thread_id', threadId)
              .maybeSingle();

            if (existingPost) {
              // Update existing post
              const { error: updateError } = await supabase
                .from('community_posts')
                .update(postData)
                .eq('id', existingPost.id);

              if (updateError) {
                console.error(`❌ Error updating thread ${threadId}:`, updateError);
                errors.push({ threadId, error: updateError.message });
              } else {
                updatedCount++;
                console.log(`✅ Updated announcement: ${threadId}`);
              }
            } else {
              // Insert new post
              const { error: insertError } = await supabase
                .from('community_posts')
                .insert(postData);

              if (insertError) {
                console.error(`❌ Error inserting thread ${threadId}:`, insertError);
                errors.push({ threadId, error: insertError.message });
              } else {
                syncedCount++;
                console.log(`✅ Created announcement: ${threadId}`);
              }
            }
          } catch (err) {
            const threadId = thread.id || thread._id || 'unknown';
            console.error(`❌ Unexpected error syncing thread ${threadId}:`, err);
            errors.push({ threadId, error: err instanceof Error ? err.message : 'Unknown error' });
          }
        }

        console.log(`✅ Announcements sync complete: ${syncedCount} created, ${updatedCount} updated`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount,
            updated: updatedCount,
            total: threads.length,
            errors: errors.length > 0 ? errors : undefined
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_to_database': {
        console.log('🔄 Starting Heartbeat member sync...');
        
        // Fetch all members from Heartbeat
        const response = await fetch(`${HEARTBEAT_API_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Heartbeat API error: ${response.status}`, errorText);
          throw new Error(`Heartbeat API error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        
        // Heartbeat API returns { users: [...] } with pagination info
        const members = responseData.users || responseData;
        
        if (!Array.isArray(members)) {
          console.error('Invalid response format:', responseData);
          throw new Error('Invalid response format from Heartbeat API');
        }

        console.log(`📊 Found ${members.length} members to sync`);
        if (responseData.total) {
          console.log(`📊 Total members in Heartbeat: ${responseData.total}`);
        }
        if (members.length > 0) {
          console.log(`Sample member:`, JSON.stringify(members[0], null, 2));
        }

        // Sync members to user_profiles table
        let syncedCount = 0;
        let updatedCount = 0;
        const errors: Array<{ memberId: string; error: string }> = [];
        
        for (const member of members) {
          try {
            // Check if user profile exists by heartbeat_member_id
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('id, user_id')
              .eq('heartbeat_member_id', member.id)
              .maybeSingle();

            // Map Heartbeat data fields according to API documentation
            // Determine tier from groups (subscription tier)
            let tier = 'free';
            if (member.groups && Array.isArray(member.groups) && member.groups.length > 0) {
              const group = member.groups[0];
              const groupName = typeof group === 'string' ? group : (group?.name || '');
              const groupLower = groupName.toLowerCase();
              if (groupLower.includes('legionnaire')) tier = 'legionnaire';
              else if (groupLower.includes('outlaw')) tier = 'outlaw';
              else if (groupLower.includes('rebel')) tier = 'rebel';
            }

            const profileData = {
              heartbeat_member_id: member.id,
              display_name: member.name || member.email?.split('@')[0] || 'Unknown Member',
              email: member.email || null,
              full_name: member.full_name || member.name || null,
              // Try multiple avatar field variations from Heartbeat API
              avatar_url: member.profile_picture || member.avatar_url || member.avatar || member.photo_url || null,
              bio: member.bio || null,
              location: member.location || null,
              tier: tier,
              membership_tier: tier,
              // Additional Heartbeat fields
              last_active_at: member.last_active_at || member.last_seen_at || null,
              // Timestamps
              created_at: member.created_at || new Date().toISOString(),
              // Make visible in Community Hub
              is_public: true,
              // Note: user_id will be null for Heartbeat-only members
            };

            if (existingProfile) {
              // Update existing profile
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update(profileData)
                .eq('id', existingProfile.id);

              if (updateError) {
                console.error(`❌ Error updating member ${member.id}:`, updateError);
                errors.push({ memberId: member.id, error: updateError.message });
              } else {
                updatedCount++;
                console.log(`✅ Updated member ${member.id}`);
              }
            } else {
              // Insert profile without creating auth user - these are external community members
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert(profileData);

              if (insertError) {
                console.error(`❌ Error creating profile for ${member.id}:`, insertError);
                errors.push({ memberId: member.id, error: insertError.message });
              } else {
                syncedCount++;
                console.log(`✅ Created new member ${member.id}`);
              }
            }
          } catch (err) {
            console.error(`❌ Unexpected error syncing member ${member.id}:`, err);
            errors.push({ memberId: member.id, error: err instanceof Error ? err.message : 'Unknown error' });
          }
        }

        console.log(`✅ Sync complete: ${syncedCount} created, ${updatedCount} updated out of ${members.length} total`);
        if (errors.length > 0) {
          console.log(`⚠️ Errors encountered:`, errors);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount,
            updated: updatedCount,
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
