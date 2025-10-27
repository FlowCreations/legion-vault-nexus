import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign and variants
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    const { data: variants } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('campaign_id', campaignId);

    if (!variants || variants.length === 0) {
      throw new Error('No variants found');
    }

    // Calculate performance for each variant
    const variantStats = await Promise.all(
      variants.map(async (variant) => {
        // Get assignments for this variant
        const { data: assignments } = await supabase
          .from('ab_test_assignments')
          .select('user_id')
          .eq('variant_id', variant.id);

        const userIds = assignments?.map(a => a.user_id) || [];

        if (userIds.length === 0) {
          return {
            variantId: variant.id,
            variantName: variant.variant_name,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
          };
        }

        // Get email sends for these users
        const { data: sends } = await supabase
          .from('email_sends')
          .select('*')
          .eq('campaign_id', campaignId)
          .in('user_id', userIds);

        const totalSent = sends?.length || 0;
        const opened = sends?.filter(s => s.opened_at).length || 0;
        const clicked = sends?.filter(s => s.clicked_at).length || 0;

        return {
          variantId: variant.id,
          variantName: variant.variant_name,
          openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
          conversionRate: 0,
        };
      })
    );

    // Determine winner based on criteria
    const winnerCriteria = campaign?.winner_criteria || 'open_rate';
    const winner = variantStats.reduce((best, current) => 
      current[winnerCriteria as keyof typeof current] > best[winnerCriteria as keyof typeof best] ? current : best
    );

    // Mark winner
    await supabase
      .from('ab_test_variants')
      .update({ is_winner: true })
      .eq('id', winner.variantId);

    return new Response(
      JSON.stringify({ 
        winner: winner.variantName,
        stats: variantStats
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error declaring AB winner:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
