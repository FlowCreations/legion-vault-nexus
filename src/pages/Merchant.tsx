import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Users, DollarSign, Video, FileText, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIChat } from "@/components/merchant/AIChat";
import { TopPlatforms } from "@/components/merchant/TopPlatforms";
import { TopTracks } from "@/components/merchant/TopTracks";
import { StreamsOverview } from "@/components/merchant/StreamsOverview";
import { Geography } from "@/components/merchant/Geography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import AdminDashboard from "./AdminDashboard";
import VideoManager from "./VideoManager";

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

  useEffect(() => {
    loadAnalytics();
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
          <h1 className="text-5xl font-bold mb-3">Backend Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your content, community, and analytics</p>
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold">Demo Mode</span> - All sections accessible for testing
            </p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border-2 border-yellow-500/30">
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-semibold"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="videos"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-semibold"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger 
              value="community"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-semibold"
            >
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-end gap-3">
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
                <div className="space-y-12">
                  <TopPlatforms />
                  <StreamsOverview />
                  <TopTracks period="7days" />
                  <Geography />
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

          <TabsContent value="videos">
            <VideoManager />
          </TabsContent>

          <TabsContent value="community">
            <AdminDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Merchant;
