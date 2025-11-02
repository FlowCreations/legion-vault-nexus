import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Award, Package } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MilestoneModalProps {
  milestone: {
    milestone_type: 'silver_star' | 'gold_star' | 'dunbar_champion';
    total_minutes_at_achievement: number;
  };
  onClose: () => void;
}

export const MilestoneModal = ({ milestone, onClose }: MilestoneModalProps) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  });

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = milestone.milestone_type === 'silver_star' 
      ? ['#C0C0C0', '#E8E8E8']
      : milestone.milestone_type === 'gold_star'
      ? ['#FFD700', '#FFA500']
      : ['#FFD700', '#FF6347', '#FFB300'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [milestone.milestone_type]);

  const milestoneConfig = {
    silver_star: {
      icon: Star,
      title: 'Silver Star Unlocked!',
      message: "Nice work — you've just unlocked your next star. Keep going.",
      color: 'from-gray-400 to-gray-300',
    },
    gold_star: {
      icon: Star,
      title: 'Gold Star Achieved!',
      message: "Five hours deep — your journey's lighting up. Two more hours until something special arrives.",
      color: 'from-yellow-500 to-yellow-400',
    },
    dunbar_champion: {
      icon: Award,
      title: 'Dunbar Champion!',
      message: "You've reached the final milestone. Confirm your address — your collectible is on the way.",
      color: 'from-amber-600 to-yellow-500',
    },
  };

  const config = milestoneConfig[milestone.milestone_type];
  const Icon = config.icon;

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_milestones')
        .update({
          reward_claimed: true,
          reward_claimed_at: new Date().toISOString(),
          shipping_address: formData,
        })
        .eq('user_id', user.id)
        .eq('milestone_type', 'dunbar_champion');

      if (error) throw error;

      toast.success('Address saved! Your collectible will be shipped soon.');
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-6">
          {/* Badge Icon */}
          <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-2xl animate-pulse`}>
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-muted-foreground">{config.message}</p>
            <p className="text-sm text-muted-foreground">
              Achieved after {(milestone.total_minutes_at_achievement / 60).toFixed(1)} hours
            </p>
          </div>

          {/* Address Form for Dunbar Champion */}
          {milestone.milestone_type === 'dunbar_champion' && !showAddressForm && (
            <Button onClick={() => setShowAddressForm(true)} className="w-full gap-2">
              <Package className="w-4 h-4" />
              Claim Your Collectible
            </Button>
          )}

          {showAddressForm && (
            <form onSubmit={handleSubmitAddress} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                  id="address1"
                  required
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                <Input
                  id="address2"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  required
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Address'}
              </Button>
            </form>
          )}

          {/* Close Button */}
          {milestone.milestone_type !== 'dunbar_champion' && (
            <Button onClick={onClose} className="w-full">
              Continue Journey
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
