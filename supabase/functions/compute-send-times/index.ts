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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with email activity
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1000);

    let processed = 0;

    for (const user of users || []) {
      // Get historical email opens
      const { data: opens } = await supabase
        .from('email_sends')
        .select('opened_at')
        .eq('user_id', user.user_id)
        .not('opened_at', 'is', null)
        .order('opened_at', { ascending: false })
        .limit(50);

      if (!opens || opens.length < 5) continue;

      // Analyze patterns
      const hourCounts: Record<number, number> = {};
      const dayCounts: Record<string, number> = {};

      opens.forEach(open => {
        const date = new Date(open.opened_at!);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });

      // Find most common hour and day
      const optimalHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      const optimalDay = Object.entries(dayCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      const confidence = Math.min(opens.length / 50, 1);

      // Store prediction
      await supabase
        .from('user_send_preferences')
        .upsert({
          user_id: user.user_id,
          optimal_send_hour: optimalHour ? parseInt(optimalHour) : null,
          optimal_send_day: optimalDay || null,
          confidence_score: confidence,
          open_pattern: { hourCounts, dayCounts },
          last_calculated_at: new Date().toISOString(),
        });

      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error computing send times:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
