import { useEffect, useState, lazy, Suspense, memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerformanceTracking } from "@/hooks/usePerformanceTracking";
import { ProgressiveLoader } from "@/components/merchant/ProgressiveLoader";
import { dedupeRequest, deferNonCritical } from "@/lib/performance";
import { useMerchantRealtime } from "@/hooks/useMerchantRealtime";

// Lazy load ALL heavy components for maximum performance
const AIChat = lazy(() => import("@/components/merchant/AIChat").then(m => ({ default: m.AIChat })));
const MarketingAnalyticsDashboard = lazy(() => import("@/components/merchant/marketing/MarketingAnalyticsDashboard").then(m => ({ default: m.MarketingAnalyticsDashboard })));
const UserDataQualityPanel = lazy(() => import("@/components/merchant/marketing/UserDataQualityPanel").then(m => ({ default: m.UserDataQualityPanel })));
const MusicUpload = lazy(() => import("@/components/MusicUpload"));
const MusicManager = lazy(() => import("@/components/merchant/MusicManager").then(m => ({ default: m.MusicManager })));
const LyricsManager = lazy(() => import("@/components/merchant/LyricsManager").then(m => ({ default: m.LyricsManager })));
const TopTracks = lazy(() => import("@/components/merchant/TopTracks"));
const FanbaseStats = lazy(() => import("@/components/merchant/analytics/FanbaseStats"));
const Geography = lazy(() => import("@/components/merchant/Geography"));
const Demographics = lazy(() => import("@/components/merchant/Demographics"));
const EarningsOverview = lazy(() => import("@/components/merchant/EarningsOverview"));
const EmailIntelligenceHub = lazy(() => import("@/components/merchant/email/EmailIntelligenceHub").then(m => ({ default: m.EmailIntelligenceHub })));
const SMSIntelligenceHub = lazy(() => import("@/components/merchant/sms/SMSIntelligenceHub").then(m => ({ default: m.SMSIntelligenceHub })));
const CreateCampaigns = lazy(() => import("@/components/merchant/CreateCampaigns").then(m => ({ default: m.CreateCampaigns })));
const PlatformOverview = lazy(() => import("@/components/merchant/analytics/PlatformOverview"));
const PlatformDistribution = lazy(() => import("@/components/merchant/analytics/PlatformDistribution"));
const EngagementTimeline = lazy(() => import("@/components/merchant/analytics/EngagementTimeline"));
const PlatformCards = lazy(() => import("@/components/merchant/analytics/PlatformCards").then(m => ({ default: m.PlatformCards })));
const BuildFunnel = lazy(() => import("@/components/merchant/BuildFunnel").then(m => ({ default: m.BuildFunnel })));
const Partnerships = lazy(() => import("@/components/merchant/Partnerships").then(m => ({ default: m.Partnerships })));
const LiveStreamManager = lazy(() => import("@/components/merchant/LiveStreamManager").then(m => ({ default: m.LiveStreamManager })));
const LiveStreamEventManager = lazy(() => import("@/components/merchant/LiveStreamEventManager").then(m => ({ default: m.LiveStreamEventManager })));
const AvatarArchetypes = lazy(() => import("@/components/merchant/intelligence/AvatarArchetypes"));
const OracleInsight = lazy(() => import("@/components/merchant/intelligence/OracleInsight").then(m => ({ default: m.OracleInsight })));
const EpiphanyInsight = lazy(() => import("@/components/merchant/intelligence/EpiphanyInsight").then(m => ({ default: m.EpiphanyInsight })));
const CatalystDeploy = lazy(() => import("@/components/merchant/intelligence/CatalystDeploy").then(m => ({ default: m.CatalystDeploy })));
const IntelligenceFlowDiagram = lazy(() => import("@/components/merchant/intelligence/IntelligenceFlowDiagram").then(m => ({ default: m.IntelligenceFlowDiagram })));
const MatchMatrix = lazy(() => import("@/components/merchant/intelligence/MatchMatrix").then(m => ({ default: m.MatchMatrix })));
const CatalystHistory = lazy(() => import("@/components/merchant/intelligence/CatalystHistory").then(m => ({ default: m.CatalystHistory })));
const FunnelOverview = lazy(() => import("@/components/merchant/FunnelOverview"));
const DistributorIntegration = lazy(() => import("@/components/merchant/DistributorIntegration").then(m => ({ default: m.DistributorIntegration })));
const ContentLab = lazy(() => import("@/components/merchant/ContentLab").then(m => ({ default: m.ContentLab })));
const EmailMarketing = lazy(() => import("@/components/merchant/EmailMarketing").then(m => ({ default: m.EmailMarketing })));
const SocialTracking = lazy(() => import("@/components/merchant/SocialTracking").then(m => ({ default: m.SocialTracking })));
const HybridFunnelBuilder = lazy(() => import("@/components/merchant/marketing/HybridFunnelBuilder").then(m => ({ default: m.HybridFunnelBuilder })));
const AbandonedCartToggle = lazy(() => import("@/components/merchant/AbandonedCartToggle").then(m => ({ default: m.AbandonedCartToggle })));
const AbandonedCartSettings = lazy(() => import("@/components/merchant/AbandonedCartSettings").then(m => ({ default: m.AbandonedCartSettings })));
const PTPCalculationTrigger = lazy(() => import("@/components/merchant/admin/PTPCalculationTrigger").then(m => ({ default: m.PTPCalculationTrigger })));
const IntelligenceView = lazy(() => import("@/components/merchant/intelligence/IntelligenceView").then(m => ({ default: m.IntelligenceView })));
const AbandonedCartAnalytics = lazy(() => import("@/components/merchant/analytics/AbandonedCartAnalytics").then(m => ({ default: m.AbandonedCartAnalytics })));
const VideoManager = lazy(() => import("./VideoManager"));
const SeedCoordinatesButton = lazy(() => import("@/components/merchant/SeedCoordinatesButton").then(m => ({ default: m.SeedCoordinatesButton })));
const TourManager = lazy(() => import("@/components/merchant/TourManager").then(m => ({ default: m.TourManager })));
const CommunityMembers = lazy(() => import("@/components/merchant/CommunityMembers").then(m => ({ default: m.CommunityMembers })));
const HeartbeatToggle = lazy(() => import("@/components/merchant/HeartbeatToggle").then(m => ({ default: m.HeartbeatToggle })));

const MostTalkedAbout = lazy(() => import("@/components/merchant/MostTalkedAbout").then(m => ({ default: m.MostTalkedAbout })));
const DataInsights = lazy(() => import("@/components/merchant/DataInsights").then(m => ({ default: m.DataInsights })));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

interface AnalyticsData {
  events: number;
  analytics: number;
  superFans: number;
  analysis: {
    patterns: string[];
    insights: string[];
    recommendations: string[];
    segments: any[];
    targets: any[];
    geographic: any;
  };
}

const Merchant = memo(() => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Real-time dashboard updates
  const { stats, isConnected, refreshStats } = useMerchantRealtime();

  // Performance tracking - disabled for production performance
  // usePerformanceTracking('Merchant', {
  //   trackRender: true,
  //   trackAPI: true,
  //   trackMemory: true,
  //   memoryInterval: 15000,
  // });

  // Memoize demo data to prevent recreation on every render
  const getDemoData = useMemo((): AnalyticsData => ({
    events: 15847,
    analytics: 3421,
    superFans: 234,
    analysis: {
      patterns: [
        "Peak engagement occurs on Friday evenings (8-10 PM), with 3x higher activity compared to weekdays",
        "Mobile users account for 68% of traffic, with iOS devices showing 2x longer session times",
        "Music streaming peaks during commute hours (7-9 AM, 5-7 PM) across all demographics",
        "Video content has 45% higher completion rates when under 3 minutes in length"
      ],
      insights: [
        "Super fans generate 78% of total revenue despite being only 6.8% of the user base",
        "Album purchases increase by 34% when bundled with exclusive behind-the-scenes content",
        "Community engagement drives a 2.3x increase in merchandise sales within 48 hours",
        "Users who attend virtual live shows are 5x more likely to become super fans"
      ],
      recommendations: [
        "Launch targeted Friday evening campaigns featuring new releases and exclusive content",
        "Optimize mobile experience with vertical video formats and one-tap purchasing",
        "Create VIP bundles combining albums with exclusive merchandise for super fan segments",
        "Schedule tour announcements during peak engagement windows for maximum impact",
        "Implement referral program targeting super fans with incentives for friend invitations"
      ],
      segments: [],
      targets: [],
      geographic: {
        "Los Angeles, CA": { fans: 487, superFans: 34, revenue: "$12,450" },
        "New York, NY": { fans: 423, superFans: 28, revenue: "$10,890" },
        "Austin, TX": { fans: 312, superFans: 21, revenue: "$8,234" },
        "Nashville, TN": { fans: 289, superFans: 19, revenue: "$7,567" },
        "Chicago, IL": { fans: 256, superFans: 16, revenue: "$6,890" }
      }
    }
  }), []);

  const loadAnalytics = useCallback(async () => {
    // Deduplicate analytics loading
    return dedupeRequest('merchant-analytics', async () => {
      setAnalyticsData(getDemoData);
      return getDemoData;
    });
  }, [getDemoData]);

  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      window.history.replaceState({}, document.title);
    }
    if (state?.selectedUserId) {
      setSelectedUserId(state.selectedUserId);
      setTimeout(() => setSelectedUserId(null), 3000);
    }
    
    // Defer analytics loading to speed up initial render
    deferNonCritical(() => {
      loadAnalytics();
    }, 300);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        supabase.functions.invoke('sync-viberate'),
        refreshStats()
      ]);
      toast({
        title: "Data refreshed",
        description: "Your analytics data has been updated",
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Error refreshing data",
        description: "There was an error updating your analytics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast, refreshStats]);

  const showAIChat = showChat;
  const setShowAIChat = setShowChat;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 mt-20 max-w-7xl">
        <div className="mb-8">
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto bg-card border-2 border-yellow-500/30 p-0 h-auto gap-0 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="content"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="marketing"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Marketing
            </TabsTrigger>
            <TabsTrigger 
              value="community"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Community
            </TabsTrigger>
            <TabsTrigger 
              value="livestream"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Live Studio
            </TabsTrigger>
            <TabsTrigger 
              value="partnerships"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Partnerships
            </TabsTrigger>
            <TabsTrigger 
              value="intelligence"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Intelligence
            </TabsTrigger>
          </TabsList>

          {/* Conditional Tab Rendering - Only render active tab */}
          {activeTab === "analytics" && (
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex justify-end items-center gap-3">
                  <Suspense fallback={<div className="h-10 w-10"></div>}>
                    <SeedCoordinatesButton />
                  </Suspense>
                  <Button 
                    onClick={handleRefreshData} 
                    disabled={refreshing}
                    variant="outline"
                  >
                    {refreshing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Refresh Data
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowChat(!showChat)}
                    className="bg-gradient-gold"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {showChat ? "Hide" : "Show"} AI Assistant
                  </Button>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={showChat ? "lg:col-span-2" : "lg:col-span-3"}>
                <div className="space-y-8">
                  <ProgressiveLoader priority="immediate">
                    <Suspense fallback={<LoadingSpinner />}>
                      <EarningsOverview />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="high" delay={20}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Geography />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="high" delay={40}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FanbaseStats />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="high" delay={60}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Suspense fallback={<LoadingSpinner />}>
                        <PlatformDistribution />
                      </Suspense>
                      <Suspense fallback={<LoadingSpinner />}>
                        <EngagementTimeline />
                      </Suspense>
                    </div>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="medium" delay={80}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Demographics />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="medium" delay={100}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <MostTalkedAbout />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="low" delay={120}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <TopTracks period="7days" />
                    </Suspense>
                  </ProgressiveLoader>
                </div>
              </div>

                {showChat && (
                  <div className="lg:col-span-1">
                    <div className="sticky top-24">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AIChat />
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {activeTab === "content" && (
            <TabsContent value="content">
              <Tabs defaultValue="videos" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="music">Music Upload</TabsTrigger>
                  <TabsTrigger value="music-manager">Music Manager</TabsTrigger>
                  <TabsTrigger value="lyrics">Lyrics Manager</TabsTrigger>
                  <TabsTrigger value="livestreams">Live Events</TabsTrigger>
                  <TabsTrigger value="tour">Tour Manager</TabsTrigger>
                  <TabsTrigger value="lab">Content Lab</TabsTrigger>
                </TabsList>
                
                <TabsContent value="videos">
                  <Suspense fallback={<LoadingSpinner />}>
                    <VideoManager />
                  </Suspense>
                </TabsContent>
                <TabsContent value="music">
                  <Suspense fallback={<LoadingSpinner />}>
                    <MusicUpload />
                  </Suspense>
                </TabsContent>
                <TabsContent value="music-manager">
                  <Suspense fallback={<LoadingSpinner />}>
                    <MusicManager />
                  </Suspense>
                </TabsContent>
                <TabsContent value="lyrics">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LyricsManager />
                  </Suspense>
                </TabsContent>
                <TabsContent value="livestreams">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LiveStreamEventManager />
                  </Suspense>
                </TabsContent>
                <TabsContent value="tour">
                  <Suspense fallback={<LoadingSpinner />}>
                    <TourManager />
                  </Suspense>
                </TabsContent>
                <TabsContent value="lab">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ContentLab />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {activeTab === "marketing" && (
            <TabsContent value="marketing">
              <Tabs defaultValue="campaigns" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
                  <TabsTrigger value="hybrid">Hybrid Funnel</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics & AI</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analytics" className="space-y-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    <MarketingAnalyticsDashboard />
                  </Suspense>
                  <Suspense fallback={<LoadingSpinner />}>
                    <UserDataQualityPanel />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="campaigns">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CreateCampaigns />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="funnel">
                  <div className="space-y-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      <FunnelOverview />
                    </Suspense>
                    <Suspense fallback={<LoadingSpinner />}>
                      <BuildFunnel />
                    </Suspense>
                  </div>
                </TabsContent>
                
                <TabsContent value="hybrid">
                  <Suspense fallback={<LoadingSpinner />}>
                    <HybridFunnelBuilder />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="email">
                  <Suspense fallback={<LoadingSpinner />}>
                    <EmailMarketing />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="sms">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SMSIntelligenceHub />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="social">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SocialTracking />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {activeTab === "community" && (
            <TabsContent value="community" className="space-y-6">
              {/* Real-time community stats */}
              <div className="flex items-center gap-4">
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-2">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Live Updates
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </>
                  )}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">{stats.totalUsers.toLocaleString()}</span> users
                  {' • '}
                  <span className="font-semibold">{stats.activeUsers.toLocaleString()}</span> active
                  {' • '}
                  <span className="font-semibold text-green-500">+{stats.newUsersToday}</span> today
                </div>
              </div>

              <Suspense fallback={<LoadingSpinner />}>
                <CommunityMembers selectedUserId={selectedUserId} />
              </Suspense>
            </TabsContent>
          )}

          {activeTab === "intelligence" && (
            <TabsContent value="intelligence" className="space-y-6">
              <Suspense fallback={<LoadingSpinner />}>
                <IntelligenceView />
              </Suspense>
            </TabsContent>
          )}

          {activeTab === "funnels" && (
            <TabsContent value="funnels">
              <Suspense fallback={<LoadingSpinner />}>
                <FunnelOverview />
              </Suspense>
            </TabsContent>
          )}

          {activeTab === "partnerships" && (
            <TabsContent value="partnerships">
              <Suspense fallback={<LoadingSpinner />}>
                <Partnerships />
              </Suspense>
            </TabsContent>
          )}

          {activeTab === "livestream" && (
            <TabsContent value="livestream">
              <Suspense fallback={<LoadingSpinner />}>
                <LiveStreamManager />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
});

Merchant.displayName = "Merchant";

export default Merchant;
