import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveCredentialsRequest {
  action: 'save';
  platform: 'meta' | 'instagram' | 'tiktok' | 'twitter';
  credentials: {
    pixel_id: string;
    access_token?: string;
  };
  tracking_mode?: 'browser_only' | 'full';
}

interface TestCredentialsRequest {
  action: 'test';
  platform: 'meta' | 'instagram' | 'tiktok' | 'twitter';
}

interface GetStatusRequest {
  action: 'status';
  platform: 'meta' | 'instagram' | 'tiktok' | 'twitter';
}

interface DeleteCredentialsRequest {
  action: 'delete';
  platform: 'meta' | 'instagram' | 'tiktok' | 'twitter';
}

type RequestBody = SaveCredentialsRequest | TestCredentialsRequest | GetStatusRequest | DeleteCredentialsRequest;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: RequestBody = await req.json();
    const { action, platform } = body;

    console.log(`Processing ${action} action for platform: ${platform}, user: ${user.id}`);

    // Handle different actions
    switch (action) {
      case 'save': {
        const { credentials, tracking_mode = 'browser_only' } = body as SaveCredentialsRequest;
        
        // Validate Meta pixel ID format
        if (platform === 'meta' && !/^\d{15,16}$/.test(credentials.pixel_id)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid Meta Pixel ID format. Must be 15-16 digits.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Test credentials only if in full tracking mode with access token
        if (tracking_mode === 'full' && credentials.access_token) {
          const testResult = await testMetaCredentials(credentials.pixel_id, credentials.access_token);
          
          if (!testResult.success) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: testResult.error || 'Failed to verify credentials with Meta API' 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Store pixel ID metadata
        const { error: pixelError } = await supabaseClient
          .from('social_credentials')
          .upsert({
            user_id: user.id,
            platform,
            credential_type: 'pixel_id',
            is_configured: true,
            status: 'active',
            tracking_mode,
            browser_events_enabled: true,
            credential_metadata: {
              pixel_id: credentials.pixel_id,
            },
            last_verified_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,platform,credential_type'
          });

        if (pixelError) throw pixelError;

        // Store access token only if in full tracking mode
        if (tracking_mode === 'full' && credentials.access_token) {
          const { error: tokenError } = await supabaseClient
            .from('social_credentials')
            .upsert({
              user_id: user.id,
              platform,
              credential_type: 'access_token',
              is_configured: true,
              status: 'active',
              tracking_mode,
              credential_metadata: {
                access_token: credentials.access_token, // In production, encrypt this
              },
              last_verified_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,platform,credential_type'
            });

          if (tokenError) throw tokenError;
        }

        console.log(`Credentials saved successfully for user ${user.id}, platform ${platform}, mode: ${tracking_mode}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: tracking_mode === 'browser_only' 
              ? 'Browser tracking configured successfully' 
              : 'Full tracking configured and verified successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test': {
        // Retrieve credentials
        const { data: credentials, error: credError } = await supabaseClient
          .from('social_credentials')
          .select('credential_metadata, tracking_mode')
          .eq('user_id', user.id)
          .eq('platform', platform);

        if (credError) throw credError;

        if (!credentials || credentials.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No credentials configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const pixelCred = credentials.find(c => (c.credential_metadata as any)?.pixel_id);
        const tokenCred = credentials.find(c => (c.credential_metadata as any)?.access_token);
        
        if (!pixelCred) {
          return new Response(
            JSON.stringify({ success: false, error: 'Pixel ID not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For browser-only mode, just verify pixel ID exists
        if (pixelCred.tracking_mode === 'browser_only') {
          await supabaseClient
            .from('social_credentials')
            .update({ 
              last_verified_at: new Date().toISOString(),
              status: 'active'
            })
            .eq('user_id', user.id)
            .eq('platform', platform);

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Browser tracking is configured (Pixel ID verified)' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For full mode, test the API connection
        if (!tokenCred || !(tokenCred.credential_metadata as any)?.access_token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Access token not configured for full tracking' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const pixelId = (pixelCred.credential_metadata as any).pixel_id;
        const accessToken = (tokenCred.credential_metadata as any).access_token;
        const testResult = await testMetaCredentials(pixelId, accessToken);

        if (testResult.success) {
          await supabaseClient
            .from('social_credentials')
            .update({ 
              last_verified_at: new Date().toISOString(),
              status: 'active'
            })
            .eq('user_id', user.id)
            .eq('platform', platform);

          return new Response(
            JSON.stringify({ success: true, message: 'Full tracking verified successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          await supabaseClient
            .from('social_credentials')
            .update({ status: 'invalid' })
            .eq('user_id', user.id)
            .eq('platform', platform);

          return new Response(
            JSON.stringify({ success: false, error: testResult.error }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'status': {
        const { data: credentials, error: credError } = await supabaseClient
          .from('social_credentials')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', platform);

        if (credError) throw credError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            credentials: credentials || [] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { error: deleteError } = await supabaseClient
          .from('social_credentials')
          .delete()
          .eq('user_id', user.id)
          .eq('platform', platform);

        if (deleteError) throw deleteError;

        // In production, also delete from secure credential storage
        console.log(`Credentials deleted for user ${user.id}, platform ${platform}`);

        return new Response(
          JSON.stringify({ success: true, message: 'Credentials deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in manage-social-credentials:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function testMetaCredentials(pixelId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Test the Meta Pixel by checking if it exists via Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}?access_token=${accessToken}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Meta API error:', errorData);
      return { 
        success: false, 
        error: errorData.error?.message || 'Failed to verify with Meta API' 
      };
    }

    const data = await response.json();
    console.log('Meta Pixel verified:', data);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error testing Meta credentials:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Meta API' 
    };
  }
}
