import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BarChart3, Target, TrendingUp } from "lucide-react";
import { CredentialCard } from "./CredentialCard";
import { PixelEventStats } from "./PixelEventStats";
import { MetaPixelAnalytics } from "./MetaPixelAnalytics";
import { FacebookInsightsSync } from "./FacebookInsightsSync";

export const SocialTracking = () => {
  const [activeTab, setActiveTab] = useState("setup");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Tracking</h2>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to track attribution and campaign performance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted p-1">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Platform Connections</CardTitle>
              <CardDescription>
                Configure your social media credentials to enable tracking and attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CredentialCard 
                platform="meta"
                platformName="Meta/Facebook"
                description="Track pixel events and conversions from Facebook and Instagram"
              />
              
              <CredentialCard 
                platform="instagram"
                platformName="Instagram Business"
                description="Advanced Instagram metrics and audience insights"
                comingSoon
              />
              
              <CredentialCard 
                platform="tiktok"
                platformName="TikTok"
                description="Track TikTok pixel events and campaign performance"
                comingSoon
              />
              
              <CredentialCard 
                platform="twitter"
                platformName="Twitter/X"
                description="Track conversions and engagement from Twitter/X"
                comingSoon
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PixelEventStats />
            <FacebookInsightsSync />
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Track ROI and performance metrics for your social campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Campaign Tracking Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                View detailed campaign performance, ROI calculations, and attribution data
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MetaPixelAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
