export interface PersonalityProfile {
  id: string;
  user_id: string;
  p_e: number;
  p_i: number;
  p_s: number;
  p_n: number;
  p_t: number;
  p_f: number;
  p_j: number;
  p_p: number;
  assertiveness: number;
  mbti_type: string | null;
  confidence_score: number;
  feature_vector: any;
  last_computed: string;
  created_at: string;
}

export interface NextBestAction {
  id: string;
  user_id: string;
  action_type: string;
  channel: string;
  offer_id: string | null;
  message_recipe: any;
  predicted_conversion_rate: number;
  personality_match: any;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  outcome: string | null;
  outcome_value: number | null;
  created_at: string;
  updated_at: string;
}
