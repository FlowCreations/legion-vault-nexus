import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier-based multipliers for realistic data
const tierConfig: Record<string, { spendRange: [number, number]; mrr: number; sessionRange: [number, number]; watchRange: [number, number]; listenRange: [number, number] }> = {
  'Legionnaires': { spendRange: [150, 500], mrr: 29.99, sessionRange: [50, 120], watchRange: [300, 1200], listenRange: [600, 2400] },
  'Outlaws': { spendRange: [50, 200], mrr: 19.99, sessionRange: [30, 70], watchRange: [150, 600], listenRange: [300, 1200] },
  'Rebels': { spendRange: [10, 75], mrr: 9.99, sessionRange: [15, 40], watchRange: [60, 300], listenRange: [120, 600] },
  'Free': { spendRange: [0, 20], mrr: 0, sessionRange: [5, 20], watchRange: [15, 120], listenRange: [30, 240] },
};

// Milestone definitions with probability weights
const milestoneDefinitions = [
  { key: 'first_portal_visit', probability: 1.0 },
  { key: 'email_verified', probability: 0.95 },
  { key: 'first_video_start', probability: 0.85 },
  { key: 'first_song_start', probability: 0.85 },
  { key: 'first_video_complete', probability: 0.65 },
  { key: 'first_song_finish', probability: 0.70 },
  { key: 'first_store_visit', probability: 0.50 },
  { key: 'first_add_to_cart', probability: 0.35 },
  { key: 'first_purchase', probability: 0.25 },
  { key: 'repeat_buyer', probability: 0.12 },
  { key: 'first_save', probability: 0.40 },
  { key: 'first_download', probability: 0.15 },
  { key: 'super_fan', probability: 0.08 },
  { key: 'first_referral', probability: 0.05 },
  { key: 'first_livestream_join', probability: 0.45 },
  { key: 'first_livestream_reaction', probability: 0.35 },
  { key: 'first_comment', probability: 0.30 },
];

// Content catalog for events
const videoContent = [
  { id: 'vid_001', title: 'Behind The Scenes - Studio Session', duration: 480 },
  { id: 'vid_002', title: 'Live Performance NYC 2024', duration: 3600 },
  { id: 'vid_003', title: 'Acoustic Set - Living Room Sessions', duration: 1200 },
  { id: 'vid_004', title: 'Tour Documentary: On The Road', duration: 5400 },
  { id: 'vid_005', title: 'Music Video - New Single', duration: 240 },
  { id: 'vid_006', title: 'Fan Q&A Live Stream', duration: 2700 },
  { id: 'vid_007', title: 'Rehearsal Footage - World Tour', duration: 1800 },
  { id: 'vid_008', title: 'Exclusive Interview', duration: 900 },
];

const musicContent = [
  { id: 'song_001', title: 'Thunder Road', duration: 285 },
  { id: 'song_002', title: 'Midnight Run', duration: 234 },
  { id: 'song_003', title: 'Electric Dreams', duration: 312 },
  { id: 'song_004', title: 'Born to Ride', duration: 267 },
  { id: 'song_005', title: 'Neon Lights', duration: 198 },
  { id: 'song_006', title: 'Highway to Nowhere', duration: 345 },
  { id: 'song_007', title: 'Rebel Heart', duration: 276 },
  { id: 'song_008', title: 'Last Stand', duration: 423 },
  { id: 'song_009', title: 'Wild Ones (Acoustic)', duration: 254 },
  { id: 'song_010', title: 'Legion Anthem', duration: 189 },
];

// Product catalog for purchases
const productCatalog = [
  { name: 'Tour T-Shirt 2024', type: 'merch', priceRange: [30, 45] },
  { name: 'Limited Edition Hoodie', type: 'merch', priceRange: [65, 85] },
  { name: 'Signed Poster', type: 'merch', priceRange: [25, 40] },
  { name: 'VIP Meet & Greet Package', type: 'experience', priceRange: [150, 250] },
  { name: 'Digital Album Download', type: 'music', priceRange: [12, 15] },
  { name: 'Vinyl Record - Collector Edition', type: 'music', priceRange: [40, 60] },
  { name: 'Concert Ticket - General Admission', type: 'ticket', priceRange: [45, 75] },
  { name: 'Concert Ticket - VIP', type: 'ticket', priceRange: [125, 200] },
  { name: 'Legion Cap', type: 'merch', priceRange: [25, 35] },
  { name: 'Guitar Pick Set', type: 'merch', priceRange: [15, 20] },
  { name: 'Backstage Pass Experience', type: 'experience', priceRange: [200, 350] },
  { name: 'Exclusive Merch Bundle', type: 'merch', priceRange: [80, 120] },
];

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('user_profiles')
      .select('id, user_id, display_name, tier, membership_tier');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No profiles found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${profiles.length} profiles...`);

    const now = new Date();
    let totalPurchases = 0;
    let totalEvents = 0;
    let totalMilestones = 0;
    let totalCarts = 0;

    // Process each profile
    for (const profile of profiles) {
      const tier = profile.tier || profile.membership_tier || 'Free';
      const config = tierConfig[tier] || tierConfig['Free'];
      
      // Generate realistic profile data
      const totalSpend = randomFloat(config.spendRange[0], config.spendRange[1]);
      const hasMrr = tier !== 'Free' && Math.random() > 0.3;
      const mrr = hasMrr ? config.mrr : 0;
      const watchTime = randomBetween(config.watchRange[0], config.watchRange[1]);
      const listenTime = randomBetween(config.listenRange[0], config.listenRange[1]);
      const totalSessions = randomBetween(config.sessionRange[0], config.sessionRange[1]);
      const loginStreak = randomBetween(1, 30);
      const inactiveDays = Math.random() > 0.7 ? randomBetween(0, 14) : 0;
      const lastActiveAt = randomDate(inactiveDays + 1);
      const livestreamEngagement = randomBetween(0, tier === 'Legionnaires' ? 200 : tier === 'Outlaws' ? 120 : 60);
      const isSuperFan = tier === 'Legionnaires' && Math.random() > 0.5;

      // Update user profile with engagement data
      await supabaseClient
        .from('user_profiles')
        .update({
          total_spend: totalSpend,
          mrr: mrr,
          watch_time: watchTime,
          listen_time: listenTime,
          total_sessions: totalSessions,
          login_streak: loginStreak,
          inactive_days: inactiveDays,
          last_active_at: lastActiveAt.toISOString(),
          livestream_engagement_score: livestreamEngagement,
          is_super_fan: isSuperFan,
          era_current: randomBetween(1, 10),
          ptp_current: randomBetween(0, 100),
          era_label: pickRandom(['Dormant', 'Engaged', 'Tribe', 'Integrated']),
          ptp_status: pickRandom(['Cold', 'Warm', 'Hot']),
        })
        .eq('id', profile.id);

      // Generate milestones for this user
      const userMilestones = [];
      for (const milestone of milestoneDefinitions) {
        if (Math.random() < milestone.probability) {
          const achievedAt = randomDate(90);
          userMilestones.push({
            user_id: profile.id, // Use profile.id to match how CommunityMembers drawer works
            milestone_key: milestone.key,
            achieved_at: achievedAt.toISOString(),
            metadata: { demo: true, source: 'seed-demo-data' }
          });
        }
      }

      if (userMilestones.length > 0) {
        // Delete existing demo milestones first
        await supabaseClient
          .from('fan_journey_milestones')
          .delete()
          .eq('user_id', profile.id)
          .eq('metadata->>demo', 'true');

        const { error: milestoneError } = await supabaseClient
          .from('fan_journey_milestones')
          .upsert(userMilestones, { onConflict: 'user_id,milestone_key' });

        if (!milestoneError) {
          totalMilestones += userMilestones.length;
        }
      }

      // Generate content engagement events (jrny_events)
      const numEvents = randomBetween(5, 30);
      const userEvents = [];

      for (let i = 0; i < numEvents; i++) {
        const isVideo = Math.random() > 0.4;
        const content = isVideo ? pickRandom(videoContent) : pickRandom(musicContent);
        const eventDate = randomDate(60);
        const progress = randomBetween(10, 100);
        const completed = progress >= 90;

        if (isVideo) {
          // Video events
          userEvents.push({
            jrny_id: profile.id,
            event_type: 'video_start',
            event_data: { 
              content_id: content.id, 
              title: content.title, 
              duration: content.duration 
            },
            created_at: eventDate.toISOString()
          });

          if (progress > 25) {
            userEvents.push({
              jrny_id: profile.id,
              event_type: 'video_progress',
              event_data: { 
                content_id: content.id, 
                title: content.title, 
                progress_percent: progress,
                watch_time_seconds: Math.floor(content.duration * progress / 100)
              },
              created_at: new Date(eventDate.getTime() + 60000).toISOString()
            });
          }

          if (completed) {
            userEvents.push({
              jrny_id: profile.id,
              event_type: 'video_complete',
              event_data: { 
                content_id: content.id, 
                title: content.title, 
                total_watch_time: content.duration 
              },
              created_at: new Date(eventDate.getTime() + content.duration * 1000).toISOString()
            });
          }
        } else {
          // Music events
          userEvents.push({
            jrny_id: profile.id,
            event_type: 'song_start',
            event_data: { 
              content_id: content.id, 
              title: content.title, 
              duration: content.duration 
            },
            created_at: eventDate.toISOString()
          });

          if (completed) {
            userEvents.push({
              jrny_id: profile.id,
              event_type: 'song_finish',
              event_data: { 
                content_id: content.id, 
                title: content.title, 
                listen_time: content.duration 
              },
              created_at: new Date(eventDate.getTime() + content.duration * 1000).toISOString()
            });
          }
        }
      }

      if (userEvents.length > 0) {
        const { error: eventsError } = await supabaseClient
          .from('jrny_events')
          .insert(userEvents);

        if (!eventsError) {
          totalEvents += userEvents.length;
        }
      }

      // Generate purchases for users with spending
      if (totalSpend > 10) {
        const numPurchases = randomBetween(1, Math.ceil(totalSpend / 50));
        let remainingSpend = totalSpend;

        for (let i = 0; i < numPurchases && remainingSpend > 10; i++) {
          const product = pickRandom(productCatalog);
          const purchaseAmount = Math.min(
            randomFloat(product.priceRange[0], product.priceRange[1]),
            remainingSpend
          );
          remainingSpend -= purchaseAmount;

          const purchaseDate = randomDate(120);

          await supabaseClient
            .from('purchases')
            .insert({
              user_id: profile.user_id,
              product_name: product.name,
              product_type: product.type,
              amount: purchaseAmount,
              status: 'completed',
              created_at: purchaseDate.toISOString()
            });

          totalPurchases++;
        }
      }

      // Generate abandoned carts for some users (15% chance)
      if (Math.random() < 0.15) {
        const cartItems = [];
        const numItems = randomBetween(1, 3);
        let cartValue = 0;

        for (let i = 0; i < numItems; i++) {
          const product = pickRandom(productCatalog);
          const price = randomFloat(product.priceRange[0], product.priceRange[1]);
          cartItems.push({
            name: product.name,
            type: product.type,
            price: price,
            quantity: 1
          });
          cartValue += price;
        }

        await supabaseClient
          .from('abandoned_carts')
          .insert({
            user_id: profile.user_id,
            cart_items: cartItems,
            cart_value: cartValue,
            status: 'pending',
            created_at: randomDate(14).toISOString()
          });

        totalCarts++;
      }
    }

    // Also seed ERA/PTP daily scores
    const eventTypes = [
      'watch_start', 'watch_complete', 'listen_start', 'listen_complete',
      'page_view', 'reaction', 'comment', 'add_to_cart'
    ];

    const eventPromises = profiles.map(async (profile) => {
      const numEvents = randomBetween(10, 40);
      const events = [];

      for (let i = 0; i < numEvents; i++) {
        const daysAgo = randomBetween(0, 30);
        const ts = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        const eventType = pickRandom(eventTypes);
        const sentiment = eventType === 'comment' || eventType === 'reaction' 
          ? randomFloat(-1, 1)
          : null;

        events.push({
          member_id: profile.user_id,
          type: eventType,
          content_id: `content_${randomBetween(1, 20)}`,
          duration_sec: ['watch_complete', 'listen_complete'].includes(eventType) 
            ? randomBetween(60, 3600)
            : null,
          sentiment,
          click_latency_ms: randomBetween(100, 2000),
          ts: ts.toISOString(),
          value: eventType === 'add_to_cart' ? Math.random() * 100 : 0,
          meta: { demo: true }
        });
      }

      return supabaseClient.from('events').insert(events);
    });

    await Promise.all(eventPromises);

    // Update ERA/PTP daily scores
    const scorePromises = profiles.map(async (profile) => {
      const era = randomBetween(1, 10);
      const ptp = randomBetween(0, 100);

      return supabaseClient
        .from('era_ptp_scores_daily')
        .upsert({
          member_id: profile.user_id,
          date: now.toISOString().split('T')[0],
          era,
          ptp,
          era_components: {
            c1: Math.random() * 100,
            c2: Math.random() * 100,
            c3: Math.random() * 100,
            c4: Math.random() * 100,
            c5: Math.random() * 100,
            c6: Math.random() * 100
          },
          ptp_components: { 
            demo: true,
            behaviorBreakdown: [
              { behavior_key: 'repeat_visits', behavior_name: 'Repeat Visits', weight: 15, tier: 1, triggered: Math.random() > 0.3, count: randomBetween(1, 20) },
              { behavior_key: 'content_saves', behavior_name: 'Content Saves', weight: 10, tier: 1, triggered: Math.random() > 0.5, count: randomBetween(0, 10) },
              { behavior_key: 'video_completion', behavior_name: 'Video Completion', weight: 20, tier: 2, triggered: Math.random() > 0.4, count: randomBetween(1, 15) },
              { behavior_key: 'store_visits', behavior_name: 'Store Visits', weight: 25, tier: 2, triggered: Math.random() > 0.5, count: randomBetween(0, 8) },
              { behavior_key: 'cart_adds', behavior_name: 'Cart Adds', weight: 30, tier: 3, triggered: Math.random() > 0.6, count: randomBetween(0, 5) },
              { behavior_key: 'wishlist_adds', behavior_name: 'Wishlist Adds', weight: 15, tier: 3, triggered: Math.random() > 0.7, count: randomBetween(0, 3) },
            ]
          }
        }, { onConflict: 'member_id,date' });
    });

    await Promise.all(scorePromises);

    // Create sample cohorts
    await supabaseClient.from('cohorts').upsert([
      {
        name: 'Night Owls',
        definition: { time_range: '22:00-04:00', engagement: 'high' }
      },
      {
        name: 'Concert-First',
        definition: { content_type: 'live_shows', frequency: 'weekly' }
      },
      {
        name: 'Long-Form Documentaries',
        definition: { content_type: 'documentaries', duration: '>60min' }
      }
    ], { onConflict: 'name' });

    return new Response(
      JSON.stringify({ 
        success: true, 
        profiles: profiles.length,
        milestones: totalMilestones,
        events: totalEvents,
        purchases: totalPurchases,
        abandonedCarts: totalCarts,
        message: 'Demo data seeded successfully with comprehensive engagement data'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
