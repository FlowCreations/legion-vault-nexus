import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Copy, 
  Users, 
  MousePointer, 
  ShoppingBag, 
  Music, 
  Gift,
  ExternalLink,
  Loader2,
  Share2,
  CheckCircle2
} from "lucide-react";

interface AffiliateData {
  id: string;
  affiliate_code: string;
  shopify_discount_code: string | null;
  status: string;
  total_clicks: number;
  portal_signups: number;
  digital_purchases: number;
  merch_purchases: number;
  discount_codes_earned: number;
  created_at: string;
}

interface AffiliateReward {
  id: string;
  trigger_type: string;
  discount_code: string;
  discount_percentage: number;
  reward_type: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export const AffiliateTab = () => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [rewards, setRewards] = useState<AffiliateReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load affiliate data
      const { data: affiliateData } = await supabase
        .from('fan_affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData);

        // Load rewards
        const { data: rewardsData } = await supabase
          .from('affiliate_rewards')
          .select('*')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false });

        if (rewardsData) {
          setRewards(rewardsData);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-register');
      
      if (error) throw error;
      
      if (data?.affiliate) {
        setAffiliate(data.affiliate);
        toast.success('Welcome to the affiliate program!');
      }
    } catch (error) {
      console.error('Error registering as affiliate:', error);
      toast.error('Failed to join affiliate program');
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'signup': return 'Friend Signed Up';
      case 'digital_purchase': return 'Digital Purchase';
      case 'subscription': return 'New Subscription';
      case 'merch_purchase': return 'Merch Purchase';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not enrolled state
  if (!affiliate) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Become an Affiliate</CardTitle>
            <CardDescription className="text-base">
              Share Sons of Legion with your friends and earn discount codes!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-4 text-center">
                <Users className="mb-2 h-6 w-6 text-green-500" />
                <p className="text-lg font-semibold text-green-500">10% off</p>
                <p className="text-sm text-muted-foreground">when a friend signs up</p>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-4 text-center">
                <ShoppingBag className="mb-2 h-6 w-6 text-blue-500" />
                <p className="text-lg font-semibold text-blue-500">15% off</p>
                <p className="text-sm text-muted-foreground">when they purchase</p>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-4 text-center">
                <Gift className="mb-2 h-6 w-6 text-purple-500" />
                <p className="text-lg font-semibold text-purple-500">25% off</p>
                <p className="text-sm text-muted-foreground">when they subscribe</p>
              </div>
            </div>

            <Button 
              onClick={handleRegister} 
              disabled={registering}
              className="w-full"
              size="lg"
            >
              {registering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Your Links...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate My Affiliate Links
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enrolled state
  const links = [
    { 
      label: 'Portal Signup', 
      icon: Users, 
      url: `${baseUrl}/?ref=${affiliate.affiliate_code}`,
      description: 'Share to earn 10% when friends sign up'
    },
    { 
      label: 'Digital Downloads', 
      icon: Music, 
      url: `${baseUrl}/music?ref=${affiliate.affiliate_code}`,
      description: 'Earn 15% when friends buy music'
    },
    { 
      label: 'Physical Merch', 
      icon: ShoppingBag, 
      url: `${baseUrl}/shop?ref=${affiliate.affiliate_code}`,
      description: 'Earn 15% when friends buy merch'
    },
  ];

  const stats = [
    { label: 'Total Clicks', value: affiliate.total_clicks, icon: MousePointer },
    { label: 'Portal Signups', value: affiliate.portal_signups, icon: Users },
    { label: 'Digital Purchases', value: affiliate.digital_purchases, icon: Music },
    { label: 'Merch Purchases', value: affiliate.merch_purchases, icon: ShoppingBag },
  ];

  const activeRewards = rewards.filter(r => !r.used && new Date(r.expires_at) > new Date());
  const usedRewards = rewards.filter(r => r.used);

  return (
    <div className="space-y-6">
      {/* Affiliate Code Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Affiliate Code</CardTitle>
              <CardDescription>Share this code to earn rewards</CardDescription>
            </div>
            <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
              {affiliate.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="text-2xl font-bold tracking-wider text-primary">
                {affiliate.affiliate_code}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(affiliate.affiliate_code, 'Code')}
            >
              {copiedLink === 'Code' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shareable Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLink className="h-5 w-5" />
            Your Shareable Links
          </CardTitle>
          <CardDescription>Copy and share these links on social media</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.map((link) => (
            <div 
              key={link.label}
              className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <link.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{link.label}</p>
                <p className="truncate text-sm text-muted-foreground">{link.url}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(link.url, link.label)}
              >
                {copiedLink === link.label ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Earned Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5" />
            Your Earned Rewards
          </CardTitle>
          <CardDescription>
            {activeRewards.length > 0 
              ? `You have ${activeRewards.length} active discount code${activeRewards.length > 1 ? 's' : ''}`
              : 'Share your links to start earning discount codes'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Gift className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No rewards yet</p>
              <p className="text-sm text-muted-foreground">
                Share your links to start earning!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRewards.map((reward) => (
                <div 
                  key={reward.id}
                  className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{reward.discount_code}</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                        {reward.discount_percentage}% off
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTriggerTypeLabel(reward.trigger_type)} • Expires {new Date(reward.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(reward.discount_code, reward.discount_code)}
                  >
                    {copiedLink === reward.discount_code ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}

              {usedRewards.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm font-medium text-muted-foreground">Used Codes</p>
                  {usedRewards.slice(0, 5).map((reward) => (
                    <div 
                      key={reward.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 opacity-60"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono line-through">{reward.discount_code}</span>
                          <Badge variant="secondary">Used</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getTriggerTypeLabel(reward.trigger_type)}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
