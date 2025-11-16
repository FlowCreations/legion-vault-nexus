import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortalConnectionRequest {
  partnerName: string;
  partnerBio?: string;
  partnerAvatarUrl?: string;
  specialOffer?: string;
  offerDurationDays?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: PortalConnectionRequest = await req.json();
    console.log('Connecting portal:', body);

    // Create the portal connection
    const { data: connection, error: connectionError } = await supabase
      .from('portal_connections')
      .insert({
        host_artist_id: user.id,
        partner_artist_id: crypto.randomUUID(),
        partner_name: body.partnerName,
        partner_bio: body.partnerBio || null,
        partner_avatar_url: body.partnerAvatarUrl || null,
        special_offer: body.specialOffer || null,
        offer_duration_days: body.offerDurationDays || 30,
        status: 'active',
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Error creating portal connection:', connectionError);
      throw connectionError;
    }

    console.log('Portal connection created:', connection);

    // Get all community members to notify
    const { data: members, error: membersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name');

    if (membersError) {
      console.error('Error fetching members:', membersError);
    }

    // Create a community post announcing the partnership
    const announcementMessage = body.specialOffer
      ? `We're now hosting ${body.partnerName} in our portal—check them out! 🎉\n\n${body.partnerBio || ''}\n\n✨ Special Offer: ${body.specialOffer}`
      : `We're now hosting ${body.partnerName} in our portal—check them out! 🎉\n\n${body.partnerBio || ''}`;

    const { error: postError } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content: announcementMessage,
        category: 'announcement',
        post_type: 'partnership',
        tagged_all: true,
      });

    if (postError) {
      console.error('Error creating announcement post:', postError);
    }

    // Send individual messages to all members
    if (members && members.length > 0) {
      const messages = members.map(member => ({
        sender_id: user.id,
        recipient_id: member.user_id,
        content: announcementMessage,
        read: false,
      }));

      const { error: messagesError } = await supabase
        .from('community_messages')
        .insert(messages);

      if (messagesError) {
        console.error('Error sending member messages:', messagesError);
      } else {
        console.log(`Sent partnership announcement to ${members.length} members`);
      }
    }

    // Also create affiliate content entry for "You May Also Like"
    const { error: contentError } = await supabase
      .from('affiliate_content')
      .insert({
        affiliate_id: connection.partner_artist_id,
        title: `${body.partnerName} Portal`,
        description: body.partnerBio || `Check out ${body.partnerName}!`,
        thumbnail_url: body.partnerAvatarUrl || null,
        content_type: 'portal',
        content_url: '#', // Update with actual portal URL if available
      });

    if (contentError) {
      console.error('Error creating affiliate content:', contentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection,
        membersNotified: members?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in connect-portal function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});