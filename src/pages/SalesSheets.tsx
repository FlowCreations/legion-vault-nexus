import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Download, Music, TrendingUp, Sparkles } from 'lucide-react';

export default function SalesSheets() {
  const [selectedTier, setSelectedTier] = useState('standard');

  const tiers = {
    standard: {
      name: 'STANDARD BUILD',
      price: '$20,000',
      icon: Music,
      tagline: 'Foundation Platform for Artist-Fan Engagement',
      timeline: '4-6 weeks',
      color: 'from-blue-500 to-cyan-500',
      features: [
        {
          category: 'Music & Video',
          items: [
            'Global music player with playlist functionality',
            'Album detail pages (Power, Stripped, Outlaw, Acoustic)',
            'EPs & Singles catalog with track analytics',
            'Video library with custom thumbnails',
            'Like/favorite system',
          ]
        },
        {
          category: 'E-Commerce',
          items: [
            'Merchandise store with product catalog',
            'Shopping cart with drawer interface',
            'Stripe checkout integration',
            'Product customization options',
            'Purchase success pages',
          ]
        },
        {
          category: 'User System',
          items: [
            'Email/password authentication',
            'Google OAuth integration',
            'User profile management',
            'Basic tier system (Free, Rebels, Outlaws, Legionnaires)',
          ]
        },
        {
          category: 'Community',
          items: [
            'Community feed/posts',
            'User messaging',
            'Favorites tracking',
          ]
        },
        {
          category: 'Backend Infrastructure',
          items: [
            'Lovable Cloud (Supabase) database',
            '10 essential database tables',
            'File storage for media',
            'Basic RLS policies',
            '5+ edge functions',
          ]
        }
      ],
      deliverables: [
        'Fully functional web application',
        'Lovable Cloud backend',
        'Source code access (GitHub)',
        'Documentation',
        '2-hour admin training',
        '30-day post-launch support',
        'Mobile-responsive design',
        'SSL & custom domain setup',
      ]
    },
    advanced: {
      name: 'ADVANCED BUILD',
      price: '$30,000',
      icon: TrendingUp,
      tagline: 'Everything in Standard + Marketing Automation & Intelligence',
      timeline: '8-10 weeks',
      color: 'from-purple-500 to-pink-500',
      features: [
        {
          category: 'All Standard Features Plus:',
          items: ['Complete music, video, e-commerce, and community foundation']
        },
        {
          category: 'Merchant Dashboard',
          items: [
            'Real-time engagement metrics & analytics hub',
            'Geography mapping with member locations',
            'Demographics breakdown (age, gender)',
            'Top tracks performance (7-day, 28-day, all-time)',
            'Earnings overview dashboard',
          ]
        },
        {
          category: 'Content Management',
          items: [
            'Music upload & management system',
            'Video manager with thumbnail generation',
            'Tour show manager with venue/date tracking',
            'Gallery management',
            'Content Lab for performance analysis',
          ]
        },
        {
          category: 'Email Marketing System',
          items: [
            'Email list builder with smart segmentation',
            'Campaign builder with templates',
            'A/B testing for campaigns',
            'Email automation sequences',
            'Campaign analytics (open rates, click rates)',
            'Christ-conscious campaign templates',
          ]
        },
        {
          category: 'Sales Funnels',
          items: [
            'Multi-step funnel builder',
            'Lead capture & thank you pages',
            'Upsell/downsell pages',
            'A/B variant testing',
            'Funnel analytics & conversion tracking',
          ]
        },
        {
          category: 'Integrations',
          items: [
            'Meta Pixel integration',
            'Facebook insights sync',
            'Social credential management',
            'Behavioral event tracking',
          ]
        },
        {
          category: 'Backend',
          items: [
            '40+ database tables',
            '25+ edge functions',
            'Advanced RLS policies',
            'API integration framework',
            'Scheduled job system',
          ]
        }
      ],
      deliverables: [
        'Everything in Standard tier',
        'Advanced merchant dashboard',
        'Full marketing automation suite',
        'Sales funnel system',
        '4-hour admin training',
        'API integration documentation',
      ]
    },
    custom: {
      name: 'CUSTOM ADVANCED BUILD',
      price: '$50,000',
      icon: Sparkles,
      tagline: 'Everything in Advanced + AI, Live Streaming, & Predictive Intelligence',
      timeline: '12-16 weeks',
      color: 'from-orange-500 to-red-500',
      features: [
        {
          category: 'All Advanced Features Plus:',
          items: ['Complete Standard + Advanced feature set']
        },
        {
          category: 'AI-Powered Features',
          items: [
            'Merchant AI assistant for analytics insights',
            'Shop assistant chatbot (Christ-conscious)',
            'Fan-facing AI agent for recommendations',
            'AI email content generation',
            'Behavioral trigger recommendations',
            'Subject line optimization',
            'AI-powered video analysis',
          ]
        },
        {
          category: 'Personality Intelligence',
          items: [
            '16-question MBTI-based survey',
            'ERA (Engagement-Readiness-Affinity) scoring',
            'PTP (Propensity-to-Purchase) scoring',
            'Daily personality computation',
            'Next-Best-Action engine with predictive offers',
            'Member intelligence dashboard',
            'Automated NBA queue',
          ]
        },
        {
          category: 'Advanced Automation',
          items: [
            'Visual workflow builder (React Flow)',
            'Email, delay, condition, action, goal nodes',
            'Template library (Welcome, VIP, Re-engagement)',
            'Auto-engage system with behavior triggers',
            'Real-time engagement monitoring',
          ]
        },
        {
          category: 'Live Streaming Studio',
          items: [
            'LiveKit integration for broadcasting',
            'Audio mixer with 5-band EQ',
            'Reverb and dynamics processing',
            'Live chat with real-time messaging',
            'Stream intro with countdown',
            'Viewer count tracking',
          ]
        },
        {
          category: 'Partnerships & Affiliates',
          items: [
            'Affiliate recommendation engine',
            'Brand partnership management',
            'Spotify integration for content',
            'Click analytics & revenue attribution',
          ]
        },
        {
          category: 'Advanced Integrations',
          items: [
            'Tunepipe, Viberate, Heartbeat sync',
            'Meta Pixel (13+ event types)',
            'Facebook insights dashboard',
            'Cameo/personalized video system',
          ]
        },
        {
          category: 'Backend Powerhouse',
          items: [
            '80+ database tables',
            '50+ edge functions',
            'Complex RLS policies',
            'Real-time subscriptions',
            'Job queue management',
            'Multi-API orchestration',
          ]
        }
      ],
      deliverables: [
        'Everything in Standard + Advanced tiers',
        'Full AI integration suite',
        'Personality intelligence system',
        'Live streaming studio',
        'Partnership ecosystem',
        '6-hour comprehensive training',
        '60-day premium support',
      ]
    }
  };

  const currentTier = tiers[selectedTier as keyof typeof tiers];
  const Icon = currentTier.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Custom Platform Build Tiers
          </h1>
          <p className="text-muted-foreground">
            Professional artist-fan engagement platforms tailored to your needs
          </p>
        </div>

        <Tabs value={selectedTier} onValueChange={setSelectedTier} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {Object.entries(tiers).map(([key, tier]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <Card className="p-8 print:shadow-none">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${tier.color}`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{tier.name}</h2>
                        <p className="text-muted-foreground mt-1">{tier.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {tier.price}
                      </div>
                      <Badge variant="secondary" className="mt-2">
                        {tier.timeline}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-6 mb-8">
                  <h3 className="text-xl font-semibold border-b pb-2">Core Features</h3>
                  {tier.features.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="font-semibold text-primary mb-3">{section.category}</h4>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Deliverables */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold border-b pb-2 mb-4">What You Get</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tier.deliverables.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t flex items-center justify-between print:hidden">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold">Optional Add-On:</p>
                    <p>Monthly Support Package - $500/month</p>
                    <p>Growth Package - $1,500/month</p>
                  </div>
                  <Button onClick={() => window.print()} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
