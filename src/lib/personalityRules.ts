export interface Posterior {
  p_e: number;
  p_i: number;
  p_s: number;
  p_n: number;
  p_t: number;
  p_f: number;
  p_j: number;
  p_p: number;
  assertiveness: number;
  mbti_type?: string;
  confidence_score?: number;
}

export type Channel = 'email' | 'dm' | 'site' | 'push' | 'sms' | 'live';

export interface MessageRecipe {
  channel: Channel;
  subject?: string;
  opener: string;
  body: string;
  cta: string;
  creative_tags: string[];
  timing: 'immediate' | 'evening' | 'weekend' | 'scheduled';
}

export interface CopyStyle {
  style: 'concrete' | 'visionary';
  elements: string[];
  language: string;
}

export interface Framing {
  proof: string[];
  tone: string;
}

export interface CTAStyle {
  cta: string;
  structure: string;
  visual?: string;
}

export function selectChannel(posterior: Posterior): Channel {
  if (posterior.p_e > 0.6) return 'live';
  if (posterior.p_e > 0.55) return 'push';
  if (posterior.p_i > 0.6) return 'email';
  if (posterior.p_i > 0.55) return 'dm';
  return 'site';
}

export function selectCopyStyle(posterior: Posterior): CopyStyle {
  if (posterior.p_s > posterior.p_n) {
    return {
      style: 'concrete',
      elements: ['size_chart', 'venue_map', 'shipping_details', 'unboxing', 'specs'],
      language: 'specific, tangible, what-you-get',
    };
  } else {
    return {
      style: 'visionary',
      elements: ['story_arc', 'mission', 'future_vision', 'symbolism', 'movement'],
      language: 'metaphorical, meaning-driven, aspirational',
    };
  }
}

export function selectFraming(posterior: Posterior): Framing {
  if (posterior.p_t > posterior.p_f) {
    return {
      proof: ['comparison_table', 'value_breakdown', 'guarantee', 'policy', 'stats'],
      tone: 'logical, analytical, data-driven',
    };
  } else {
    return {
      proof: ['fan_testimonial', 'gratitude_message', 'belonging', 'impact_story', 'community'],
      tone: 'emotional, heartfelt, connective',
    };
  }
}

export function selectCTA(posterior: Posterior): CTAStyle {
  if (posterior.p_j > posterior.p_p) {
    return {
      cta: 'Reserve your spot by Friday',
      structure: 'deadline, checklist, clear steps',
      visual: 'countdown timer, progress bar',
    };
  } else {
    return {
      cta: 'Explore what fits your vibe',
      structure: 'open-ended, exploratory, remixable',
      visual: 'carousel, choose-your-own',
    };
  }
}

export function selectTone(assertiveness: number): { voice: string; length: string; safety: string } {
  if (assertiveness > 0.6) {
    return {
      voice: 'confident, brief, challenge',
      length: 'short, punchy',
      safety: 'none needed',
    };
  } else {
    return {
      voice: 'reassuring, caring, supportive',
      length: 'longer, detailed',
      safety: 'social proof, no-pressure opt-out, guarantees',
    };
  }
}

export function getMBTIDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'ENFP': 'The Campaigner - Enthusiastic, creative, and sociable free spirits',
    'INFP': 'The Mediator - Poetic, kind, and altruistic idealists',
    'ENTP': 'The Debater - Smart, curious thinkers who love intellectual challenges',
    'INTP': 'The Logician - Innovative inventors with an unquenchable thirst for knowledge',
    'ENFJ': 'The Protagonist - Charismatic and inspiring leaders',
    'INFJ': 'The Advocate - Quiet and mystical, yet very inspiring idealists',
    'ENTJ': 'The Commander - Bold, imaginative, and strong-willed leaders',
    'INTJ': 'The Architect - Imaginative and strategic thinkers',
    'ESFP': 'The Entertainer - Spontaneous, energetic, and enthusiastic performers',
    'ISFP': 'The Adventurer - Flexible and charming artists',
    'ESTP': 'The Entrepreneur - Smart, energetic, and perceptive',
    'ISTP': 'The Virtuoso - Bold and practical experimenters',
    'ESFJ': 'The Consul - Extraordinarily caring, social, and popular',
    'ISFJ': 'The Defender - Very dedicated and warm protectors',
    'ESTJ': 'The Executive - Excellent administrators and managers',
    'ISTJ': 'The Logistician - Practical and fact-minded individuals',
  };

  const baseType = type.split('-')[0];
  return descriptions[baseType] || 'Unknown Type';
}

export function getPersonalityColor(type: string): string {
  const firstLetter = type.charAt(0);
  const colors: Record<string, string> = {
    'E': 'hsl(var(--chart-1))', // Extraverted - energetic color
    'I': 'hsl(var(--chart-2))', // Introverted - calm color
  };
  return colors[firstLetter] || 'hsl(var(--muted))';
}

export function applyChristConsciousOverlay(
  message: MessageRecipe, 
  posterior: Posterior
): MessageRecipe {
  const startsWithLove = (text: string): boolean => {
    const loveKeywords = ['grateful', 'thank', 'honor', 'appreciate', 'love', 'blessed', 'gift'];
    const firstWords = text.toLowerCase().split(' ').slice(0, 5);
    return firstWords.some(word => loveKeywords.some(keyword => word.includes(keyword)));
  };

  // Ensure message starts with love-first principle
  if (!startsWithLove(message.opener)) {
    message.opener = `We're grateful you're part of this. ${message.opener}`;
  }
  
  // Add empowerment reminder for Feeling types
  if (posterior.p_f > 0.6) {
    message.body += "\n\nYou have the power to choose what serves your highest good. We're just here to offer what feels aligned.";
  }
  
  // Truth with compassion for Thinking types
  if (posterior.p_t > 0.6) {
    message.body += "\n\nWe speak plainly because we respect you. No games, no manipulation — just honest offering.";
  }
  
  return {
    ...message,
    creative_tags: [...message.creative_tags, 'christ_conscious', 'empowerment']
  };
}
