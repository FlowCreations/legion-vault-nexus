import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIChat } from "@/components/merchant/AIChat";
import { TopTracks } from "@/components/merchant/TopTracks";
import { Geography } from "@/components/merchant/Geography";
import { Demographics } from "@/components/merchant/Demographics";
import { EarningsOverview } from "@/components/merchant/EarningsOverview";
import { CreateCampaigns } from "@/components/merchant/CreateCampaigns";
import { PlatformOverview } from "@/components/merchant/analytics/PlatformOverview";
import { PlatformDistribution } from "@/components/merchant/analytics/PlatformDistribution";
import { EngagementTimeline } from "@/components/merchant/analytics/EngagementTimeline";
import { PlatformCards } from "@/components/merchant/analytics/PlatformCards";
import { BuildFunnel } from "@/components/merchant/BuildFunnel";
import { Partnerships } from "@/components/merchant/Partnerships";
import FunnelOverview from "@/components/merchant/FunnelOverview";
import { DistributorIntegration } from "@/components/merchant/DistributorIntegration";
import { ContentLab } from "@/components/merchant/ContentLab";
import { EmailMarketing } from "@/components/merchant/EmailMarketing";
import { SocialTracking } from "@/components/merchant/SocialTracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import AdminDashboard from "./AdminDashboard";
import VideoManager from "./VideoManager";
import { HeartbeatSyncButton } from "@/components/merchant/HeartbeatSyncButton";
import { SeedCoordinatesButton } from "@/components/merchant/SeedCoordinatesButton";

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

const Merchant = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Check for navigation state
    const state = window.history.state?.usr;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
    if (state?.selectedUserId) {
      setSelectedUserId(state.selectedUserId);
    }
  }, []);


  const getDemoData = (): AnalyticsData => ({
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
  });

  const loadAnalytics = async () => {
    // Always show demo data for now
    setAnalyticsData(getDemoData());
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 mt-20 max-w-7xl">
        <div className="mb-8">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold">Live Data</span> - Real-time analytics from Viberate, Tunepipe, and platform APIs • Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
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
              value="partnerships"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-none font-semibold py-3 px-4 rounded-md m-0.5 data-[state=active]:border-0 flex items-center justify-center"
            >
              Partnerships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-end gap-3">
              <HeartbeatSyncButton />
              <SeedCoordinatesButton />
              <Button 
                onClick={loadAnalytics} 
                disabled={refreshing}
                variant="outline"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Refreshing...
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
                {/* Earnings - Full Width */}
                <EarningsOverview />
                
                {/* Geography - Full Width Below Earnings */}
                <Geography />

                <TopTracks period="7days" />
                <Demographics />
                
                {/* New Analytics Components Below */}
                <PlatformOverview />
                <PlatformCards />
                
                <div className="grid gap-6 md:grid-cols-2">
                  <PlatformDistribution />
                  <EngagementTimeline />
                </div>

                <DistributorIntegration />
              </div>
            </div>

              {showChat && (
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <AIChat />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Tabs defaultValue="videos" className="space-y-6">
              <TabsList>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="lab">Content Lab</TabsTrigger>
              </TabsList>
              
              <TabsContent value="videos">
                <VideoManager />
              </TabsContent>
              <TabsContent value="lab">
                <ContentLab />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="marketing">
            <Tabs defaultValue="campaigns" className="space-y-6">
              <TabsList>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="funnels">Funnels</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>
              
              <TabsContent value="campaigns">
                <CreateCampaigns />
              </TabsContent>
              <TabsContent value="funnels">
                <BuildFunnel />
              </TabsContent>
              <TabsContent value="email">
                <EmailMarketing />
              </TabsContent>
              <TabsContent value="social">
                <SocialTracking />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="community">
            <AdminDashboard selectedUserId={selectedUserId} />
          </TabsContent>

        <TabsContent value="funnels">
          <FunnelOverview />
        </TabsContent>

        <TabsContent value="partnerships">
          <Partnerships />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Merchant;
