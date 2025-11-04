import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MBTI type distributions based on tier
const TIER_PERSONALITY_TEMPLATES = {
  rebels: {
    mbtiTypes: ['ENFP', 'ENTP', 'INFP', 'INTP'],
    assertiveness: [0.6, 0.8],
    confidence: [0.6, 0.75],
  },
  outlaws: {
    mbtiTypes: ['ESTP', 'ISTP', 'ESFP', 'ISFP'],
    assertiveness: [0.7, 0.9],
    confidence: [0.65, 0.8],
  },
  legionnaires: {
    mbtiTypes: ['ESTJ', 'ISTJ', 'ENTJ', 'INTJ'],
    assertiveness: [0.8, 0.95],
    confidence: [0.75, 0.9],
  },
  free: {
    mbtiTypes: ['ISFJ', 'ESFJ', 'ENFJ', 'INFJ'],
    assertiveness: [0.4, 0.6],
    confidence: [0.5, 0.65],
  },
};

function getRandomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generatePersonalityProfile(tier: string, userId: string) {
  const template = TIER_PERSONALITY_TEMPLATES[tier as keyof typeof TIER_PERSONALITY_TEMPLATES] || TIER_PERSONALITY_TEMPLATES.free;
  const mbtiType = template.mbtiTypes[Math.floor(Math.random() * template.mbtiTypes.length)];
  
  // Parse MBTI to get individual traits
  const [e_i, s_n, t_f, j_p] = mbtiType.split('');
  
  return {
    user_id: userId,
    p_e: e_i === 'E' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_i: e_i === 'I' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_s: s_n === 'S' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_n: s_n === 'N' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_t: t_f === 'T' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_f: t_f === 'F' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_j: j_p === 'J' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    p_p: j_p === 'P' ? getRandomInRange(0.6, 0.9) : getRandomInRange(0.1, 0.4),
    assertiveness: getRandomInRange(template.assertiveness[0], template.assertiveness[1]),
    mbti_type: mbtiType,
    confidence_score: getRandomInRange(template.confidence[0], template.confidence[1]),
    survey_responses: {},
    feature_vector: {},
    last_computed: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching user profiles without personality profiles...');

    // Get all user profiles that don't have personality profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, heartbeat_member_id, tier')
      .is('user_id', null)
      .not('heartbeat_member_id', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} Heartbeat members without personality profiles`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No profiles to generate',
          generated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For Heartbeat members without user_id, use heartbeat_member_id as the identifier
    const personalityProfiles = profiles.map(profile => 
      generatePersonalityProfile(
        profile.tier || 'free', 
        profile.heartbeat_member_id
      )
    );

    console.log(`Generating ${personalityProfiles.length} personality profiles...`);

    // Insert personality profiles
    const { data: inserted, error: insertError } = await supabase
      .from('personality_profiles')
      .upsert(personalityProfiles, { onConflict: 'user_id' })
      .select();

    if (insertError) {
      console.error('Error inserting personality profiles:', insertError);
      throw insertError;
    }

    console.log(`Successfully generated ${inserted?.length || 0} personality profiles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: inserted?.length || 0,
        message: `Generated ${inserted?.length || 0} personality profiles` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-generate-personalities:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
