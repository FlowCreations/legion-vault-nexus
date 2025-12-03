import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      jrny_id,
      fingerprint,
      device_info,
      page_url,
      referrer,
      utm_params,
      tenant_slug
    } = await req.json();

    console.log('[JRNY-IDENTIFY] Request:', { jrny_id, fingerprint: fingerprint?.substring(0, 20), tenant_slug });

    // Generate new jrny_id if not provided
    const effectiveJrnyId = jrny_id || crypto.randomUUID();
    let wasRecovered = false;
    let finalJrnyId = effectiveJrnyId;

    // Try to find existing visitor by jrny_id
    const { data: existingVisitor } = await supabase
      .from('jrny_visitors')
      .select('*')
      .eq('jrny_id', effectiveJrnyId)
      .single();

    // If no visitor found by jrny_id but we have fingerprint, try recovery
    if (!existingVisitor && fingerprint) {
      const { data: fingerprintMatch } = await supabase
        .from('jrny_fingerprint_map')
        .select('jrny_id, confidence')
        .eq('fingerprint_hash', fingerprint)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();

      if (fingerprintMatch && fingerprintMatch.confidence >= 0.8) {
        finalJrnyId = fingerprintMatch.jrny_id;
        wasRecovered = true;
        console.log('[JRNY-IDENTIFY] Recovered identity via fingerprint:', finalJrnyId);

        // Update fingerprint match timestamp
        await supabase
          .from('jrny_fingerprint_map')
          .update({ last_matched_at: new Date().toISOString() })
          .eq('fingerprint_hash', fingerprint)
          .eq('jrny_id', finalJrnyId);
      }
    }

    // Get tenant ID if slug provided
    let tenantId = null;
    if (tenant_slug) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant_slug)
        .single();
      tenantId = tenant?.id;
    }

    // Upsert visitor record
    const visitorData: Record<string, unknown> = {
      jrny_id: finalJrnyId,
      device_fingerprint: fingerprint,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (device_info) {
      visitorData.device_type = device_info.deviceType;
      visitorData.browser = device_info.browser;
      visitorData.os = device_info.os;
      visitorData.screen_resolution = device_info.screenResolution;
      visitorData.timezone = device_info.timezone;
      visitorData.language = device_info.language;
    }

    if (!existingVisitor && !wasRecovered) {
      // New visitor - set first-seen fields
      visitorData.first_seen_at = new Date().toISOString();
      visitorData.first_tenant_id = tenantId;
      visitorData.first_landing_page = page_url;
      visitorData.first_referrer = referrer;
      visitorData.utm_source = utm_params?.utm_source;
      visitorData.utm_medium = utm_params?.utm_medium;
      visitorData.utm_campaign = utm_params?.utm_campaign;
      visitorData.utm_content = utm_params?.utm_content;
      visitorData.utm_term = utm_params?.utm_term;
      visitorData.portals_visited = tenant_slug ? [tenant_slug] : [];
    }

    const { error: upsertError } = await supabase
      .from('jrny_visitors')
      .upsert(visitorData, { onConflict: 'jrny_id' });

    if (upsertError) {
      console.error('[JRNY-IDENTIFY] Upsert error:', upsertError);
      throw upsertError;
    }

    // Update portals_visited if new portal
    if (tenant_slug && (existingVisitor || wasRecovered)) {
      const { data: currentVisitor } = await supabase
        .from('jrny_visitors')
        .select('portals_visited')
        .eq('jrny_id', finalJrnyId)
        .single();

      const portals = (currentVisitor?.portals_visited as string[]) || [];
      if (!portals.includes(tenant_slug)) {
        await supabase
          .from('jrny_visitors')
          .update({ 
            portals_visited: [...portals, tenant_slug],
            updated_at: new Date().toISOString()
          })
          .eq('jrny_id', finalJrnyId);
      }
    }

    // Store/update fingerprint mapping
    if (fingerprint) {
      await supabase
        .from('jrny_fingerprint_map')
        .upsert({
          fingerprint_hash: fingerprint,
          jrny_id: finalJrnyId,
          confidence: wasRecovered ? 0.9 : 1.0,
          last_matched_at: new Date().toISOString(),
        }, { onConflict: 'fingerprint_hash,jrny_id' });
    }

    // Increment page views
    const currentPageViews = (existingVisitor?.total_page_views as number) || 0;
    await supabase
      .from('jrny_visitors')
      .update({ 
        total_page_views: currentPageViews + 1,
        updated_at: new Date().toISOString()
      })
      .eq('jrny_id', finalJrnyId);

    console.log('[JRNY-IDENTIFY] Success:', { finalJrnyId, wasRecovered, isNew: !existingVisitor && !wasRecovered });

    return new Response(
      JSON.stringify({
        success: true,
        jrny_id: finalJrnyId,
        was_recovered: wasRecovered,
        is_new: !existingVisitor && !wasRecovered,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[JRNY-IDENTIFY] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
