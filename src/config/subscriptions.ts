export const TIERS = {
  FREE: 'Free',
  REBEL: 'Rebel',
  OUTLAW: 'Outlaw',
  LEGIONNAIRE: 'Legionnaire'
} as const;

export type TierType = typeof TIERS[keyof typeof TIERS];

// Feature flags for each tier
export const TIER_FEATURES: Record<TierType, string[]> = {
  [TIERS.FREE]: [
    'power_album',
    'music_library',
    'music_videos',
    'shows',
    'live_studio'
  ],
  [TIERS.REBEL]: [
    'power_album',
    'music_library',
    'music_videos',
    'shows',
    'bts_videos',
    'community_post',
    'performances',
    'premium_albums'
  ],
  [TIERS.OUTLAW]: [
    'power_album',
    'music_library',
    'music_videos',
    'shows',
    'bts_videos',
    'community_post',
    'performances',
    'premium_albums',
    'live_studio',
    'gallery',
    'documentary'
  ],
  [TIERS.LEGIONNAIRE]: [
    'power_album',
    'music_library',
    'music_videos',
    'shows',
    'bts_videos',
    'community_post',
    'performances',
    'premium_albums',
    'live_studio',
    'gallery',
    'documentary',
    'merch_discount',
    'early_access',
    'priority_support'
  ]
};

// Stripe price configuration (placeholders until real IDs are ready)
export const STRIPE_CONFIG = {
  [TIERS.REBEL]: {
    priceId: 'price_rebels_monthly',
    price: 10,
    interval: 'month' as const,
    description: 'Behind-the-scenes videos, community features, and premium albums'
  },
  [TIERS.OUTLAW]: {
    priceId: 'price_outlaws_monthly',
    price: 25,
    interval: 'month' as const,
    description: 'Gallery access, documentary content, and advanced community features'
  },
  [TIERS.LEGIONNAIRE]: {
    priceId: 'price_legionnaires_monthly',
    price: 50,
    interval: 'month' as const,
    description: 'VIP access with exclusive content, priority support, and merch discounts'
  }
} as const;

// Helper function to check if a tier has access to a feature
export const hasFeatureAccess = (tier: TierType, feature: string): boolean => {
  const features = TIER_FEATURES[tier] || [];
  return features.includes(feature);
};

// Get tier level (higher number = more access)
export const getTierLevel = (tier: TierType): number => {
  switch (tier) {
    case TIERS.FREE: return 0;
    case TIERS.REBEL: return 1;
    case TIERS.OUTLAW: return 2;
    case TIERS.LEGIONNAIRE: return 3;
    default: return 0;
  }
};

// Check if tierA has at least the access level of tierB
export const hasMinimumTier = (userTier: TierType, requiredTier: TierType): boolean => {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
};