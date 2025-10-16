import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIChat } from "@/components/merchant/AIChat";
import { TopPlatforms } from "@/components/merchant/TopPlatforms";
import { TopTracks } from "@/components/merchant/TopTracks";
import { StreamsOverview } from "@/components/merchant/StreamsOverview";
import { Geography } from "@/components/merchant/Geography";

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Demo mode - allow access without auth
        setIsDemoMode(true);
        setIsAuthorized(true);
        setAnalyticsData(getDemoData());
        setIsLoading(false);
        return;
      }

      // Check if user has merchant or admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Role check error:', error);
        // If error checking roles, allow demo mode
        setIsDemoMode(true);
        setIsAuthorized(true);
        setAnalyticsData(getDemoData());
        setIsLoading(false);
        return;
      }

      const hasAccess = roles?.some(r => r.role === 'admin' || r.role === 'merchant');
      
      if (!hasAccess) {
        // User logged in but no access - show demo mode
        setIsDemoMode(true);
        setIsAuthorized(true);
        setAnalyticsData(getDemoData());
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      setIsDemoMode(false);
      loadAnalytics();
    } catch (error) {
      console.error('Authorization error:', error);
      // On error, allow demo mode
      setIsDemoMode(true);
      setIsAuthorized(true);
      setAnalyticsData(getDemoData());
    } finally {
      setIsLoading(false);
    }
  };

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
    if (isDemoMode) {
      setAnalyticsData(getDemoData());
      return;
    }

    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('analyze-user-behavior', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      setAnalyticsData(data);
    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Showing demo data.",
        variant: "destructive",
      });
      setAnalyticsData(getDemoData());
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 mt-20 max-w-7xl">
        {isDemoMode && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold">Demo Mode</span> - Showing sample analytics data for presentation
            </p>
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-3">Analytics Dashboard</h1>
              <p className="text-gray-400 text-lg">Track your fan engagement and platform performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={loadAnalytics} 
                disabled={refreshing}
                variant="outline"
                className="border-white/20 hover:bg-white/10"
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
                className="bg-primary hover:bg-primary/90"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {showChat ? "Hide" : "Show"} AI Assistant
              </Button>
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default Merchant;
