import { Lock, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIERS, STRIPE_CONFIG, type TierType, getTierLevel } from '@/config/subscriptions';

interface UpgradePromptProps {
  feature?: string;
  requiredTier?: TierType;
  currentTier: TierType;
  inline?: boolean;
}

const FEATURE_NAMES: Record<string, { name: string; tier: TierType }> = {
  shows: { name: 'Show Listings', tier: TIERS.REBELS },
  bts_videos: { name: 'Behind-the-Scenes Videos', tier: TIERS.REBELS },
  community_post: { name: 'Community Posting', tier: TIERS.REBELS },
  performances: { name: 'Performance Videos', tier: TIERS.REBELS },
  premium_albums: { name: 'Premium Albums', tier: TIERS.REBELS },
  live_studio: { name: 'Live Studio', tier: TIERS.OUTLAWS },
  gallery: { name: 'Photo Gallery', tier: TIERS.OUTLAWS },
  documentary: { name: 'Documentary Content', tier: TIERS.OUTLAWS },
  merch_discount: { name: 'Merch Discounts', tier: TIERS.LEGIONNAIRES },
  early_access: { name: 'Early Access', tier: TIERS.LEGIONNAIRES },
  priority_support: { name: 'Priority Support', tier: TIERS.LEGIONNAIRES },
};

export function UpgradePrompt({ feature, requiredTier, currentTier, inline = false }: UpgradePromptProps) {
  const navigate = useNavigate();

  // Determine the tier needed
  let tierNeeded: TierType = requiredTier || TIERS.REBELS;
  if (feature && FEATURE_NAMES[feature]) {
    tierNeeded = FEATURE_NAMES[feature].tier;
  }

  const featureName = feature && FEATURE_NAMES[feature] ? FEATURE_NAMES[feature].name : 'This Content';
  const config = STRIPE_CONFIG[tierNeeded as keyof typeof STRIPE_CONFIG];
  
  if (!config) return null;

  const currentLevel = getTierLevel(currentTier);
  const requiredLevel = getTierLevel(tierNeeded);

  // Get all tier options at or above the required tier
  const tierOptions = Object.entries(STRIPE_CONFIG)
    .filter(([tier]) => getTierLevel(tier as TierType) >= requiredLevel)
    .map(([tier, config]) => ({
      tier: tier as TierType,
      ...config
    }));

  if (inline) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {featureName} requires {tierNeeded} membership
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/subscribe')}>
          Upgrade
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 max-w-4xl mx-auto">
      <CardContent className="p-8 md:p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        
        <h3 className="text-3xl font-bold mb-3">Premium Content</h3>
        <p className="text-muted-foreground mb-8 text-lg">
          Unlock {featureName} and more with a paid membership
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tierOptions.map(({ tier, price, interval, description }) => {
            const isRecommended = tier === tierNeeded;
            return (
              <div
                key={tier}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  isRecommended
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Recommended
                  </Badge>
                )}
                <h4 className="text-xl font-bold mb-2">{tier}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-muted-foreground">/{interval}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            onClick={() => navigate('/subscribe')}
            className="w-full md:w-auto px-8"
          >
            View All Plans
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {currentTier === TIERS.FREE && (
            <p className="text-sm text-muted-foreground">
              You're currently on the <strong>Free</strong> tier
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
