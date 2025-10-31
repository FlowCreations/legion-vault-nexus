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
}

interface MessageRecipe {
  channel: string;
  subject?: string;
  opener: string;
  body: string;
  cta: string;
  creative_tags: string[];
  timing: string;
}

// Offer graph based on user state
const OFFER_GRAPH: Record<string, string[]> = {
  new_visitor: ['free_ep', 'email_capture'],
  lead: ['album_digital', 'merch_starter'],
  buyer: ['ticket_local', 'vip_bundle', 'membership'],
  member: ['exclusive_drop', 'meet_and_greet', 'signed_vinyl'],
};

function selectChannel(p: Posterior): string {
  if (p.p_e > 0.6) return 'push';
  if (p.p_i > 0.6) return 'email';
  return 'site';
}

function selectCopyStyle(p: Posterior) {
  if (p.p_s > p.p_n) {
    return {
      style: 'concrete',
      elements: ['size_chart', 'venue_map', 'shipping_details'],
      language: 'specific, tangible details',
    };
  } else {
    return {
      style: 'visionary',
      elements: ['story_arc', 'mission', 'future_vision'],
      language: 'metaphorical, meaning-driven',
    };
  }
}

function selectFraming(p: Posterior) {
  if (p.p_t > p.p_f) {
    return {
      proof: ['comparison', 'value_breakdown', 'guarantee'],
      tone: 'logical, analytical',
    };
  } else {
    return {
      proof: ['fan_quote', 'gratitude', 'belonging'],
      tone: 'emotional, heartfelt',
    };
  }
}

function selectCTA(p: Posterior) {
  if (p.p_j > p.p_p) {
    return {
      cta: 'Reserve your spot by Friday',
      structure: 'deadline, clear steps',
    };
  } else {
    return {
      cta: 'Explore what fits your vibe',
      structure: 'open-ended, exploratory',
    };
  }
}

function getUserState(hasPurchases: boolean, isMember: boolean): string {
  if (isMember) return 'member';
  if (hasPurchases) return 'buyer';
  return 'new_visitor';
}

function generateMessage(p: Posterior, offer: string): MessageRecipe {
  const channel = selectChannel(p);
  const copyStyle = selectCopyStyle(p);
  const framing = selectFraming(p);
  const ctaStyle = selectCTA(p);

  let opener = '';
  let body = '';
  let subject = '';

  if (offer === 'ticket_local') {
    if (p.p_e > 0.6) {
      opener = "We're pulling the crew together and you were on my mind.";
      subject = "Dallas is about to be a moment ✨";
    } else {
      opener = "A quiet note for you about something special coming up.";
      subject = "An invitation just for you";
    }

    if (p.p_n > p.p_s) {
      body = "We've been building something special with the Legion — this show is the next chapter. The energy, the movement, the moments we create together.";
    } else {
      body = "We're playing The Echo Dallas on March 15th at 8PM. 300 capacity venue, full band, new songs from the upcoming album.";
    }

    if (p.p_f > p.p_t) {
      body += " If you can make it, I want you there. This is about us, together.";
    } else {
      body += " Tickets are $35, includes meet & greet access. VIP packages available.";
    }
  } else if (offer === 'merch_starter') {
    subject = p.p_j > p.p_p ? "Limited drop ends Friday" : "New merch you might vibe with";
    opener = p.p_f > p.p_t 
      ? "Wanted to share something we made with you in mind."
      : "Check out the new Legion collection — quality you can feel.";
    
    body = p.p_s > p.p_n
      ? "Premium cotton tees, embroidered details, sizes XS-3XL. Ships in 3-5 days."
      : "Each piece tells the story of where we've been and where we're going. Wear the movement.";
  } else {
    subject = "Something for you";
    opener = "Quick note with an offer.";
    body = `Check out our ${offer} — think you'd like it.`;
  }

  return {
    channel,
    subject,
    opener,
    body,
    cta: ctaStyle.cta,
    creative_tags: [...copyStyle.elements, ...framing.proof],
    timing: p.assertiveness > 0.6 ? 'immediate' : 'evening',
  };
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

    // Get personality
    const { data: personality } = await supabase
      .from('personality_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!personality) {
      return new Response(
        JSON.stringify({ error: 'No personality profile found. Run predict-personality first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user state
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: membership } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    const userState = getUserState(!!purchases?.length, !!membership?.length);

    // Select offer
    const eligibleOffers = OFFER_GRAPH[userState] || OFFER_GRAPH.new_visitor;
    const selectedOffer = eligibleOffers[Math.floor(Math.random() * eligibleOffers.length)];

    // Generate message
    const recipe = generateMessage(personality, selectedOffer);

    // Store NBA
    const { data: nba, error: nbaError } = await supabase
      .from('next_best_actions')
      .insert({
        user_id: userId,
        action_type: 'offer',
        channel: recipe.channel,
        offer_id: selectedOffer,
        message_recipe: recipe,
        predicted_conversion_rate: personality.confidence_score * 0.25,
        personality_match: {
          mbti_type: personality.mbti_type,
          confidence: personality.confidence_score,
        },
        status: 'pending',
        scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (nbaError) throw nbaError;

    return new Response(
      JSON.stringify({ recipe, offerId: selectedOffer, nbaId: nba.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating NBA:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
