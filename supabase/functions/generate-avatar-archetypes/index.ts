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
    const supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Fetching member data for avatar generation...');

    // Fetch comprehensive member data
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1000);

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .order('ts', { ascending: false })
      .limit(5000);

    const { data: personalities } = await supabase
      .from('personality_profiles')
      .select('*');

    const { data: purchases } = await supabase
      .from('funnel_conversions')
      .select('*')
      .limit(1000);

    console.log(`Analyzing ${profiles?.length || 0} profiles, ${events?.length || 0} events, ${personalities?.length || 0} personalities`);

    // Prepare analysis data
    const analysisData = {
      profileCount: profiles?.length || 0,
      eventCount: events?.length || 0,
      personalityCount: personalities?.length || 0,
      purchaseCount: purchases?.length || 0,
      
      // Sample data (anonymized)
      sampleProfiles: profiles?.slice(0, 50).map(p => ({
        tier: p.tier,
        location: p.location,
        created_at: p.created_at,
        is_online: p.is_online,
        membership_tier: p.membership_tier,
      })),
      
      eventTypes: events?.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      mbtiDistribution: personalities?.reduce((acc, p) => {
        const type = p.mbti_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
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
            content: `Analyze this audience data and generate 4-6 distinct avatar archetypes:

${JSON.stringify(analysisData, null, 2)}

Generate avatars that represent the true diversity and depth of this audience. Make them actionable for marketing and engagement. Return ONLY the JSON array, no other text.`
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
