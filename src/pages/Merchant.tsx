import { useEffect, useState, lazy, Suspense, memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePerformanceTracking } from "@/hooks/usePerformanceTracking";
import { ProgressiveLoader } from "@/components/merchant/ProgressiveLoader";

// Lazy load ALL heavy components for maximum performance
const AIChat = lazy(() => import("@/components/merchant/AIChat").then(m => ({ default: m.AIChat })));
const MusicUpload = lazy(() => import("@/components/MusicUpload"));
const MusicManager = lazy(() => import("@/components/merchant/MusicManager").then(m => ({ default: m.MusicManager })));
const TopTracks = lazy(() => import("@/components/merchant/TopTracks"));
const Geography = lazy(() => import("@/components/merchant/Geography"));
const Demographics = lazy(() => import("@/components/merchant/Demographics"));
const EarningsOverview = lazy(() => import("@/components/merchant/EarningsOverview"));
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
const FunnelOverview = lazy(() => import("@/components/merchant/FunnelOverview"));
const DistributorIntegration = lazy(() => import("@/components/merchant/DistributorIntegration").then(m => ({ default: m.DistributorIntegration })));
const ContentLab = lazy(() => import("@/components/merchant/ContentLab").then(m => ({ default: m.ContentLab })));
const EmailMarketing = lazy(() => import("@/components/merchant/EmailMarketing").then(m => ({ default: m.EmailMarketing })));
const SocialTracking = lazy(() => import("@/components/merchant/SocialTracking").then(m => ({ default: m.SocialTracking })));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const VideoManager = lazy(() => import("./VideoManager"));
const SeedCoordinatesButton = lazy(() => import("@/components/merchant/SeedCoordinatesButton").then(m => ({ default: m.SeedCoordinatesButton })));
const TourManager = lazy(() => import("@/components/merchant/TourManager").then(m => ({ default: m.TourManager })));
const CommunityMembers = lazy(() => import("@/components/merchant/CommunityMembers").then(m => ({ default: m.CommunityMembers })));
const HeartbeatToggle = lazy(() => import("@/components/merchant/HeartbeatToggle").then(m => ({ default: m.HeartbeatToggle })));
const GlobeRealtime = lazy(() => import("@/components/merchant/GlobeRealtime"));

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

  // Performance tracking
  usePerformanceTracking('Merchant', {
    trackRender: true,
    trackAPI: true,
    trackMemory: true,
    memoryInterval: 15000,
  });

  useEffect(() => {
    // Check for navigation state only once on mount
    const state = window.history.state?.usr;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
    if (state?.selectedUserId) {
      setSelectedUserId(state.selectedUserId);
      // Clear the navigation state after setting it
      window.history.replaceState({}, document.title);
      // Clear selectedUserId after a delay to allow the component to use it
      setTimeout(() => {
        setSelectedUserId(null);
      }, 3000);
    }
  }, []); // Only run on mount

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
    // Load demo data immediately (it's just static data)
    setAnalyticsData(getDemoData);
  }, [getDemoData]);

  const handleRefreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Run sync in parallel with analytics reload
      const [viberateResult] = await Promise.allSettled([
        supabase.functions.invoke('sync-viberate'),
      ]);
      
      if (viberateResult.status === 'rejected') {
        console.error('Viberate sync error:', viberateResult.reason);
      }
      
      // Force reload analytics data
      setAnalyticsData(getDemoData);
      
      toast({
        title: "Data refreshed",
        description: "Analytics and Viberate data have been synchronized",
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh failed",
        description: "Unable to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [getDemoData, toast]);

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
              <div className="flex justify-end gap-3">
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
                      Syncing Data...
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
                  {/* IMMEDIATE PRIORITY - Load instantly */}
                  <ProgressiveLoader priority="immediate">
                    <Suspense fallback={<LoadingSpinner />}>
                      <EarningsOverview />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  {/* HIGH PRIORITY - Load after 100ms */}
                  <ProgressiveLoader priority="high" delay={100}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <PlatformOverview />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  {/* MEDIUM PRIORITY - Load when browser is idle (300-500ms) */}
                  <ProgressiveLoader priority="medium" delay={300}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Suspense fallback={<LoadingSpinner />}>
                        <PlatformDistribution />
                      </Suspense>
                      <Suspense fallback={<LoadingSpinner />}>
                        <EngagementTimeline />
                      </Suspense>
                    </div>
                  </ProgressiveLoader>
                  
                  {/* LOW PRIORITY - Load after medium components (1s) */}
                  <ProgressiveLoader priority="low" delay={1000}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <TopTracks period="7days" />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  <ProgressiveLoader priority="low" delay={1200}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Demographics />
                    </Suspense>
                  </ProgressiveLoader>
                  
                  {/* IDLE PRIORITY - Load last, heavy 3D globe (2s) */}
                  <ProgressiveLoader priority="idle" delay={2000}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Geography />
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
                  <TabsTrigger value="funnels">Funnels</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>
                
                <TabsContent value="campaigns">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CreateCampaigns />
                  </Suspense>
                </TabsContent>
                <TabsContent value="funnels">
                  <Suspense fallback={<LoadingSpinner />}>
                    <BuildFunnel />
                  </Suspense>
                </TabsContent>
                <TabsContent value="email">
                  <Suspense fallback={<LoadingSpinner />}>
                    <EmailMarketing />
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
            <TabsContent value="community">
              <div className="space-y-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <HeartbeatToggle />
                </Suspense>
                
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="h-[600px] rounded-lg overflow-hidden border">
                    <GlobeRealtime />
                  </div>
                </Suspense>
                
                <Tabs defaultValue="members" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="members">Community Members</TabsTrigger>
                    <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="members">
                    <Suspense fallback={<LoadingSpinner />}>
                      <CommunityMembers selectedUserId={selectedUserId} />
                    </Suspense>
                  </TabsContent>
                  
                  <TabsContent value="activity">
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminDashboard selectedUserId={selectedUserId} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          )}

          {activeTab === "intelligence" && (
            <TabsContent value="intelligence" className="space-y-6">
              <Suspense fallback={<LoadingSpinner />}>
                <OracleInsight />
              </Suspense>
              <Suspense fallback={<LoadingSpinner />}>
                <EpiphanyInsight />
              </Suspense>
              <Suspense fallback={<LoadingSpinner />}>
                <AvatarArchetypes />
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
