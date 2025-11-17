import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Parse request body to get target user ID (for admin deletion)
    const { userId: targetUserId } = await req.json().catch(() => ({}));

    // Create client with user's token to verify identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Determine which user to delete
    let userIdToDelete = user.id;
    
    // If a target user ID was provided, check if the requester is an admin
    if (targetUserId && targetUserId !== user.id) {
      const { data: adminRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!adminRole) {
        throw new Error('Only admins can delete other users');
      }
      
      userIdToDelete = targetUserId;
    }

    console.log('Deleting account for user:', userIdToDelete);

    // Create admin client to delete user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete user data from all related tables
    const tablesToClean = [
      'user_milestones',
      'milestone_progress',
      'user_roles',
      'events',
      'affiliate_content_clicks',
      'email_logs',
      'cameo_requests',
      'purchases',
      'user_profiles'
    ];

    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userIdToDelete);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue anyway - table might not exist or user might not have data there
      } else {
        console.log(`Deleted user data from ${table}`);
      }
    }

    // Now delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw new Error('Failed to delete user account');
    }

    console.log('Successfully deleted user account:', userIdToDelete);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});