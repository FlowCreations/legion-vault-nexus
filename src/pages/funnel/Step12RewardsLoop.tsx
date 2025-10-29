import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FunnelLayout from './FunnelLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Gift, Crown } from 'lucide-react';

export default function Step12RewardsLoop() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    // Simulate points and rank
    setPoints(150);
    setRank(42);
  }, []);

  const tiers = [
    { name: 'Bronze', threshold: 0, icon: Star, color: 'text-orange-600' },
    { name: 'Silver', threshold: 250, icon: Star, color: 'text-gray-400' },
    { name: 'Gold', threshold: 500, icon: Trophy, color: 'text-yellow-500' },
    { name: 'Platinum', threshold: 1000, icon: Crown, color: 'text-purple-500' },
  ];

  const currentTier = tiers.reduce((acc, tier) => 
    points >= tier.threshold ? tier : acc
  , tiers[0]);

  const nextTier = tiers.find(t => t.threshold > points) || tiers[tiers.length - 1];
  const progress = ((points - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100;

  return (
    <FunnelLayout step={12}>
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Every listen earns points
          </h1>
          
          <p className="text-2xl text-muted-foreground">
            Points unlock rewards. You're already on your way.
          </p>
        </div>

        {/* Stats Panel */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center space-y-2">
            <Gift className="w-10 h-10 mx-auto text-primary" />
            <div className="text-4xl font-bold">{points}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </Card>

          <Card className="p-6 text-center space-y-2">
            <currentTier.icon className={`w-10 h-10 mx-auto ${currentTier.color}`} />
            <div className="text-4xl font-bold">{currentTier.name}</div>
            <div className="text-sm text-muted-foreground">Current Tier</div>
          </Card>

          <Card className="p-6 text-center space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-primary" />
            <div className="text-4xl font-bold">#{rank}</div>
            <div className="text-sm text-muted-foreground">Global Rank</div>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        <Card className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">Progress to {nextTier.name}</div>
              <div className="text-sm text-muted-foreground">
                {nextTier.threshold - points} points to go
              </div>
            </div>
            <nextTier.icon className={`w-8 h-8 ${nextTier.color}`} />
          </div>
          
          <Progress value={progress} className="h-3" />
        </Card>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 rounded-lg border space-y-4">
          <h2 className="text-2xl font-bold text-center">How to Earn More</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold">Listen Daily</div>
                <div className="text-sm text-muted-foreground">5 points per track</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold">Share Tracks</div>
                <div className="text-sm text-muted-foreground">10 points each</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold">Invite Friends</div>
                <div className="text-sm text-muted-foreground">50 points each</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold">Attend Shows</div>
                <div className="text-sm text-muted-foreground">100 points</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Top 10 fans get private sessions with the artist
          </p>
          
          <Button 
            onClick={() => navigate('/community')}
            size="lg"
            className="h-14 px-8"
          >
            View Leaderboard
          </Button>
        </div>
      </div>
    </FunnelLayout>
  );
}
