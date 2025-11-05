import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting avatar generation...');
    console.log('Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasLovableKey: !!Deno.env.get('LOVABLE_API_KEY')
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Fetching comprehensive member data for deep avatar generation...');

    // Fetch ALL member data for comprehensive analysis
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5000);

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000);

    const { data: personalities } = await supabase
      .from('personality_profiles')
      .select('*');

    const { data: purchases } = await supabase
      .from('funnel_conversions')
      .select('*')
      .limit(2000);

    console.log(`Analyzing ${profiles?.length || 0} profiles, ${events?.length || 0} events, ${personalities?.length || 0} personalities, ${purchases?.length || 0} purchases`);

    // Deep behavioral analysis
    const memberBehaviors = profiles?.map(profile => {
      const userEvents = events?.filter(e => e.member_id === profile.user_id) || [];
      const userPurchases = purchases?.filter(p => p.user_id === profile.user_id) || [];
      const userPersonality = personalities?.find(p => p.user_id === profile.user_id);

      return {
        // Demographics
        tier: profile.tier || profile.membership_tier || 'free',
        location: profile.location,
        country: profile.country,
        region: profile.region,
        created_at: profile.created_at,
        
        // Engagement metrics
        watch_time: profile.watch_time || 0,
        listen_time: profile.listen_time || 0,
        total_engagement_time: (profile.watch_time || 0) + (profile.listen_time || 0),
        last_active: profile.last_active_at || profile.last_login,
        is_active: profile.is_online || (profile.last_active_at && new Date(profile.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        
        // Behavioral patterns
        event_count: userEvents.length,
        event_types: userEvents.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        
        // Purchase behavior
        purchase_count: userPurchases.length,
        total_spent: userPurchases.reduce((sum, p) => sum + (p.amount || 0), 0),
        purchase_types: userPurchases.map(p => p.product_type).filter(Boolean),
        
        // Personality
        mbti: userPersonality?.mbti_type,
        personality_traits: userPersonality,
      };
    }) || [];

    // Aggregate insights
    const analysisData = {
      total_members: profiles?.length || 0,
      
      // Activity distribution
      active_members: memberBehaviors.filter(m => m.is_active).length,
      engagement_distribution: {
        high: memberBehaviors.filter(m => m.total_engagement_time > 300).length, // 5+ hours
        medium: memberBehaviors.filter(m => m.total_engagement_time > 60 && m.total_engagement_time <= 300).length,
        low: memberBehaviors.filter(m => m.total_engagement_time <= 60).length,
      },
      
      // Tier distribution
      tier_breakdown: memberBehaviors.reduce((acc, m) => {
        const tier = m.tier?.toLowerCase() || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Geographic insights
      top_locations: profiles?.reduce((acc, p) => {
        if (p.location) acc[p.location] = (acc[p.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      top_countries: profiles?.reduce((acc, p) => {
        if (p.country) acc[p.country] = (acc[p.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Event patterns
      event_type_distribution: events?.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Personality distribution
      mbti_distribution: personalities?.reduce((acc, p) => {
        if (p.mbti_type) acc[p.mbti_type] = (acc[p.mbti_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Purchase patterns
      total_revenue: memberBehaviors.reduce((sum, m) => sum + m.total_spent, 0),
      avg_purchase_value: memberBehaviors.filter(m => m.purchase_count > 0).length > 0
        ? memberBehaviors.reduce((sum, m) => sum + m.total_spent, 0) / memberBehaviors.filter(m => m.purchase_count > 0).length
        : 0,
      buyers_count: memberBehaviors.filter(m => m.purchase_count > 0).length,
      
      // Sample detailed profiles (for AI to understand patterns)
      sample_behaviors: memberBehaviors
        .sort((a, b) => b.total_engagement_time - a.total_engagement_time)
        .slice(0, 100)
        .map(m => ({
          tier: m.tier,
          engagement_minutes: m.total_engagement_time,
          events: Object.keys(m.event_types).length,
          purchases: m.purchase_count,
          spent: m.total_spent,
          mbti: m.mbti,
          location: m.location,
          active: m.is_active,
        })),
    };

    // Call Claude Sonnet 4.5 to generate avatars
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `You are an advanced audience intelligence analyst creating detailed avatar archetypes for a music artist's fanbase.

Analyze the provided member data and generate 4-6 distinct avatar archetypes that represent the core segments of this audience.

Each avatar should be a rich, multi-dimensional persona based on the 7 layers of human understanding:
1. Core Demographics (age, gender, location, etc.)
2. Psychographic & Personality (MBTI, Big Five, motivations)
3. Behavioral Patterns (engagement, consumption, activity)
4. Emotional & Energy Profile (emotions, archetypes, themes)
5. Cultural & Symbolic Affinities (aesthetics, brands, archetypes)
6. Socioeconomic Context (income, education, career)
7. Experiential & Aspirational (life stage, goals, dreams)

Plus predictive signals and conversion predictions.

Return ONLY a valid JSON array of avatars. Each avatar must follow this EXACT structure (do not add extra fields):
{
  "avatar_name": "The Vision Seeker",
  "description": "A deeply introspective creative seeking meaning and transformation through music",
  "confidence_score": 0.85,
  "member_count": 120,
  "core_demographic": {
    "age_range": "18-25",
    "gender_presentation": "female-presenting",
    "country": "United States",
    "region": "Pacific Northwest",
    "language": "English",
    "relationship_status_inferred": "single",
    "household_type": "solo",
    "device_type": "mobile",
    "time_zone": "PST"
  },
  "psychographic_personality": {
    "mbti_type": "INFP-T",
    "big_five": {
      "openness": 0.92,
      "conscientiousness": 0.65,
      "extraversion": 0.35,
      "agreeableness": 0.88,
      "neuroticism": 0.72
    },
    "love_language": "Words",
    "motivation_driver": "Growth",
    "conflict_style": "Avoidant",
    "core_fear": "Meaninglessness",
    "core_desire": "Purpose and belonging"
  },
  "behavioral_patterns": {
    "avg_listen_time_min": 45.5,
    "avg_watch_time_min": 12.3,
    "replay_rate": 0.68,
    "comment_frequency": 0.15,
    "comment_tone": "reflective",
    "purchase_cadence": "planned",
    "ad_click_type": "emotional",
    "active_hours": "night",
    "preferred_platforms": ["Instagram", "Spotify"],
    "engagement_stability": 0.75
  },
  "emotional_energy_profile": {
    "dominant_emotions": ["Hope", "Longing", "Wonder"],
    "emotional_intensity": 0.78,
    "sentiment_consistency": 0.82,
    "energy_archetype": "Healer",
    "emotional_journey_stage": "Connection",
    "healing_theme": "Finding purpose through creativity"
  },
  "cultural_symbolic_affinities": {
    "visual_aesthetic": "cinematic",
    "brand_overlap": ["Urban Outfitters", "Patagonia"],
    "favorite_media": ["Indie films", "Poetry"],
    "archetype_alignment": "Creator",
    "color_resonance": ["#8B7355", "#D4AF37"],
    "shared_mythology": ["Spirituality", "Environmental consciousness"]
  },
  "socioeconomic_context": {
    "income_band_inferred": "$35K-$60K",
    "education_level_inferred": "College",
    "career_field_cluster": "creative",
    "work_life_balance": "balanced",
    "purchase_method": "debit",
    "financial_fluidity_score": 0.65
  },
  "experiential_aspirational": {
    "life_stage": "seeker",
    "core_aspiration": "purpose",
    "limiting_emotion": "fear",
    "dream_identity": "Creative healer making meaningful impact",
    "resonant_storylines": ["Transformation", "Redemption", "Belonging"]
  },
  "predictive_signals": {
    "linguistic_markers": ["emotional", "spiritual", "reflective"],
    "emoji_usage_rate": 0.45,
    "response_latency_sec": 120.5,
    "playlist_entropy": 0.72,
    "color_click_bias": ["#D4AF37", "#8B7355"],
    "sound_signature_preference": "calm"
  },
  "conversion_predictions": {
    "conversion_probability": 0.78,
    "optimal_ad_tone": "reflective",
    "best_cta_type": "Discover",
    "best_funnel_entry": "Story Ad",
    "best_follow_up_channel": "Email",
    "avg_customer_value_est": 125.50
  }
}`
          },
          {
            role: 'user',
            content: `Analyze this REAL audience data to generate 4-6 distinct, data-driven avatar archetypes:

TOTAL AUDIENCE: ${analysisData.total_members} members
ACTIVE MEMBERS: ${analysisData.active_members}

ENGAGEMENT DISTRIBUTION:
- High engagement (5+ hours): ${analysisData.engagement_distribution.high} members
- Medium engagement (1-5 hours): ${analysisData.engagement_distribution.medium} members  
- Low engagement (<1 hour): ${analysisData.engagement_distribution.low} members

TIER BREAKDOWN: ${JSON.stringify(analysisData.tier_breakdown)}

TOP LOCATIONS: ${JSON.stringify(Object.entries(analysisData.top_locations || {}).slice(0, 10))}

EVENT PATTERNS: ${JSON.stringify(analysisData.event_type_distribution)}

MBTI DISTRIBUTION: ${JSON.stringify(analysisData.mbti_distribution)}

PURCHASE BEHAVIOR:
- Total buyers: ${analysisData.buyers_count}
- Total revenue: $${analysisData.total_revenue}
- Average purchase value: $${analysisData.avg_purchase_value.toFixed(2)}

TOP 100 MEMBER PATTERNS:
${JSON.stringify(analysisData.sample_behaviors.slice(0, 20), null, 2)}

Based on this REAL data, identify the natural clusters and segments in the audience. Create avatars that represent actual patterns you see - not generic personas. Each avatar should:

1. Represent a real segment you can identify in the data
2. Have accurate member counts based on the data
3. Reflect actual behavioral, geographic, and engagement patterns
4. Include realistic conversion predictions based on their behavior
5. Be immediately actionable for targeted marketing

Return ONLY the JSON array of 4-6 avatars, no other text. Make them rich, specific, and grounded in this data.`
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const avatars = JSON.parse(jsonMatch[0]);

    // Delete existing avatars
    await supabase.from('avatar_archetypes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new avatars
    const { data: inserted, error: insertError } = await supabase
      .from('avatar_archetypes')
      .insert(avatars)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`Generated ${inserted?.length || 0} avatar archetypes`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatars: inserted,
        count: inserted?.length || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error generating avatars:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
