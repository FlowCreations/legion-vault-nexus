import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Posterior {
  p_e: number;
  p_i: number;
  p_s: number;
  p_n: number;
  p_t: number;
  p_f: number;
  p_j: number;
  p_p: number;
  assertiveness: number;
  mbti_type: string;
  confidence: number;
}

// Cold start cohort priors
const COHORT_PRIORS: Record<string, Partial<Posterior>> = {
  facebook: { p_e: 0.65, p_f: 0.6 },
  instagram: { p_e: 0.6, p_s: 0.55, p_f: 0.6 },
  reddit: { p_i: 0.6, p_t: 0.6 },
  youtube: { p_n: 0.55 },
  organic: { p_e: 0.5, p_i: 0.5, p_s: 0.5, p_n: 0.5, p_t: 0.5, p_f: 0.5, p_j: 0.5, p_p: 0.5 },
};

function computeMBTIType(p: Posterior): string {
  const e_i = p.p_e > p.p_i ? 'E' : 'I';
  const s_n = p.p_s > p.p_n ? 'S' : 'N';
  const t_f = p.p_t > p.p_f ? 'T' : 'F';
  const j_p = p.p_j > p.p_p ? 'J' : 'P';
  const a_t = p.assertiveness > 0.5 ? 'A' : 'T';
  return `${e_i}${s_n}${t_f}${j_p}-${a_t}`;
}

function coldStartPrediction(referralSource?: string): Posterior {
  const prior = COHORT_PRIORS[referralSource || 'organic'] || COHORT_PRIORS.organic;
  
  return {
    p_e: prior.p_e ?? 0.5,
    p_i: 1 - (prior.p_e ?? 0.5),
    p_s: prior.p_s ?? 0.5,
    p_n: 1 - (prior.p_s ?? 0.5),
    p_t: prior.p_t ?? 0.5,
    p_f: 1 - (prior.p_t ?? 0.5),
    p_j: prior.p_j ?? 0.5,
    p_p: 1 - (prior.p_j ?? 0.5),
    assertiveness: prior.assertiveness ?? 0.5,
    mbti_type: '',
    confidence: 0.2,
  };
}

function warmStartPrediction(features: any[], surveyScores?: Posterior): Posterior {
  const posterior: Posterior = {
    p_e: surveyScores?.p_e || 0.5,
    p_i: surveyScores?.p_i || 0.5,
    p_s: surveyScores?.p_s || 0.5,
    p_n: surveyScores?.p_n || 0.5,
    p_t: surveyScores?.p_t || 0.5,
    p_f: surveyScores?.p_f || 0.5,
    p_j: surveyScores?.p_j || 0.5,
    p_p: surveyScores?.p_p || 0.5,
    assertiveness: surveyScores?.assertiveness || 0.5,
    mbti_type: '',
    confidence: surveyScores ? 0.65 : 0.5,
  };

  // If we have survey scores, use them as strong priors
  const surveyWeight = surveyScores ? 0.7 : 0;
  const behaviorWeight = 1 - surveyWeight;

  // Get 7d features for behavioral signals
  const features7d = features.filter((f) => f.time_window === '7d' || f.window === '7d');

  if (features7d.length > 0) {
    // E/I prediction from social signals
    const commentFreq = features7d.find((f) => f.feature_name === 'comment_frequency')?.value || 0;
    const shareFreq = features7d.find((f) => f.feature_name === 'share_frequency')?.value || 0;
    const socialScore = (commentFreq + shareFreq) / 2;
    const behaviorE = Math.min(0.9, Math.max(0.1, 0.5 + socialScore * 2));
    posterior.p_e = surveyWeight * posterior.p_e + behaviorWeight * behaviorE;
    posterior.p_i = 1 - posterior.p_e;

    // S/N prediction from content preference
    const longFormRatio = features7d.find((f) => f.feature_name === 'long_form_ratio')?.value || 0.5;
    const behaviorN = Math.min(0.9, Math.max(0.1, longFormRatio));
    posterior.p_n = surveyWeight * posterior.p_n + behaviorWeight * behaviorN;
    posterior.p_s = 1 - posterior.p_n;

    // T/F prediction from rational vs emotional signals
    const rationalClicks = features7d.find((f) => f.feature_name === 'rational_clicks')?.value || 0;
    const heartFreq = features7d.find((f) => f.feature_name === 'heart_frequency')?.value || 0;
    const thinkingScore = rationalClicks / Math.max(rationalClicks + heartFreq, 0.01);
    const behaviorT = Math.min(0.9, Math.max(0.1, thinkingScore));
    posterior.p_t = surveyWeight * posterior.p_t + behaviorWeight * behaviorT;
    posterior.p_f = 1 - posterior.p_t;

    // J/P prediction from session variance and exploration
    const sessionVariance = features7d.find((f) => f.feature_name === 'session_variance')?.value || 0;
    const explorationIndex = features7d.find((f) => f.feature_name === 'exploration_index')?.value || 0.5;
    const perceivingScore = (sessionVariance / 10000 + explorationIndex) / 2;
    const behaviorP = Math.min(0.9, Math.max(0.1, perceivingScore));
    posterior.p_p = surveyWeight * posterior.p_p + behaviorWeight * behaviorP;
    posterior.p_j = 1 - posterior.p_p;

    // Assertiveness from decision latency
    const decisionLatency = features7d.find((f) => f.feature_name === 'decision_latency')?.value || 3600;
    const behaviorAssertiveness = Math.min(0.9, Math.max(0.1, 1 - (decisionLatency / 86400)));
    posterior.assertiveness = surveyWeight * posterior.assertiveness + behaviorWeight * behaviorAssertiveness;

    // Increase confidence if we have both survey and behavior
    if (surveyScores) {
      posterior.confidence = 0.75;
    }
  }

  posterior.mbti_type = computeMBTIType(posterior);

  return posterior;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have existing personality profile with survey data
    const { data: existingProfile } = await supabase
      .from('personality_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get event count
    const { count: eventCount } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    let posterior: Posterior;

    // Extract survey scores if they exist
    let surveyScores: Posterior | undefined;
    if (existingProfile && existingProfile.survey_responses && Object.keys(existingProfile.survey_responses).length > 0) {
      surveyScores = {
        p_e: existingProfile.p_e,
        p_i: existingProfile.p_i,
        p_s: existingProfile.p_s,
        p_n: existingProfile.p_n,
        p_t: existingProfile.p_t,
        p_f: existingProfile.p_f,
        p_j: existingProfile.p_j,
        p_p: existingProfile.p_p,
        assertiveness: existingProfile.assertiveness,
        mbti_type: existingProfile.mbti_type || '',
        confidence: existingProfile.confidence_score,
      };
    }

    if (!eventCount || eventCount < 10) {
      // Cold start - use survey scores if available, otherwise use cohort priors
      if (surveyScores) {
        posterior = surveyScores;
        posterior.confidence = 0.65;
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('referral_source')
          .eq('user_id', userId)
          .single();

        posterior = coldStartPrediction(profile?.referral_source);
      }
    } else if (eventCount < 50) {
      // Warm start - blend survey scores with behavioral features
      const { data: features } = await supabase
        .from('personality_features')
        .select('*')
        .eq('user_id', userId);

      posterior = warmStartPrediction(features || [], surveyScores);
    } else {
      // Hot model - use existing if recent
      if (existingProfile && 
          new Date().getTime() - new Date(existingProfile.last_computed).getTime() < 6 * 60 * 60 * 1000) {
        return new Response(
          JSON.stringify({ posterior: existingProfile }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Recompute with warm start blending survey + behavior
      const { data: features } = await supabase
        .from('personality_features')
        .select('*')
        .eq('user_id', userId);

      posterior = warmStartPrediction(features || [], surveyScores);
      posterior.confidence = surveyScores ? 0.82 : 0.78;
    }

    posterior.mbti_type = computeMBTIType(posterior);

    // Upsert personality profile
    const { error: upsertError } = await supabase
      .from('personality_profiles')
      .upsert({
        user_id: userId,
        ...posterior,
        confidence_score: posterior.confidence,
        last_computed: new Date().toISOString(),
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ posterior }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error predicting personality:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
