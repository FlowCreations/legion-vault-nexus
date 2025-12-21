import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Milestone categories with weights for random selection
const MILESTONES = {
  awareness: ['first_portal_visit', 'form_started', 'email_verified'],
  engagement: ['first_video_start', 'first_video_complete', 'first_song_start', 'first_song_finish', 'first_replay', 'first_save', 'first_download'],
  conversion: ['first_store_visit', 'first_add_to_cart', 'first_purchase', 'repeat_buyer'],
  advocacy: ['super_fan', 'first_referral', 'affiliate_activated'],
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all user profiles
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, watch_time, listen_time, total_spend")
      .limit(100);

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} users to seed milestones for`);

    let totalMilestones = 0;

    for (const user of users || []) {
      const milestonesToCreate: string[] = [];
      const watchTime = user.watch_time || 0;
      const listenTime = user.listen_time || 0;
      const totalSpend = user.total_spend || 0;

      // Always add awareness milestones
      milestonesToCreate.push('first_portal_visit');
      
      // Add email_verified with 80% probability
      if (Math.random() < 0.8) {
        milestonesToCreate.push('email_verified');
      }

      // Add engagement milestones based on watch/listen time
      if (watchTime > 0 || Math.random() < 0.6) {
        milestonesToCreate.push('first_video_start');
        if (watchTime > 5 || Math.random() < 0.5) {
          milestonesToCreate.push('first_video_complete');
        }
      }

      if (listenTime > 0 || Math.random() < 0.7) {
        milestonesToCreate.push('first_song_start');
        if (listenTime > 3 || Math.random() < 0.6) {
          milestonesToCreate.push('first_song_finish');
        }
      }

      // Add deeper engagement milestones with lower probability
      if (Math.random() < 0.3) milestonesToCreate.push('first_replay');
      if (Math.random() < 0.25) milestonesToCreate.push('first_save');
      if (Math.random() < 0.2) milestonesToCreate.push('first_download');

      // Add conversion milestones based on spend or random
      if (totalSpend > 0 || Math.random() < 0.4) {
        milestonesToCreate.push('first_store_visit');
        if (totalSpend > 0 || Math.random() < 0.3) {
          milestonesToCreate.push('first_add_to_cart');
          if (totalSpend > 0 || Math.random() < 0.2) {
            milestonesToCreate.push('first_purchase');
            if (totalSpend > 50 || Math.random() < 0.1) {
              milestonesToCreate.push('repeat_buyer');
            }
          }
        }
      }

      // Add advocacy milestones with very low probability
      if (Math.random() < 0.1) milestonesToCreate.push('first_referral');
      if (Math.random() < 0.05) milestonesToCreate.push('super_fan');
      if (Math.random() < 0.03) milestonesToCreate.push('affiliate_activated');

      // Insert milestones for this user
      for (const milestone of milestonesToCreate) {
        // Use a random date within the last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const achievedAt = new Date();
        achievedAt.setDate(achievedAt.getDate() - daysAgo);

        const { error } = await supabase
          .from("fan_journey_milestones")
          .upsert({
            user_id: user.user_id,
            milestone_key: milestone,
            achieved_at: achievedAt.toISOString(),
            metadata: { seeded: true, daysAgo }
          }, {
            onConflict: 'user_id,milestone_key'
          });

        if (!error) totalMilestones++;
      }
    }

    console.log(`Seeded ${totalMilestones} milestones for ${users?.length || 0} users`);

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: users?.length || 0,
        milestonesCreated: totalMilestones,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error seeding milestones:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
