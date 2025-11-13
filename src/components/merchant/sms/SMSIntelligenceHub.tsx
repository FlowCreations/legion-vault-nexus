import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, TrendingUp, Users, Zap, Workflow } from "lucide-react";
import { SMSCampaignWizard } from "./SMSCampaignWizard";
import { SMSAnalyticsDashboard } from "./SMSAnalyticsDashboard";
import { SMSComplianceDashboard } from "./SMSComplianceDashboard";
import { CrossChannelAutomationBuilder } from "../automation/CrossChannelAutomationBuilder";

export const SMSIntelligenceHub = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Intelligence</h2>
          <p className="text-muted-foreground mt-2">
            AI-powered SMS campaigns that work alongside your email strategy
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create SMS Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Configure Twilio to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Awaiting first campaign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opted In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Add opt-in forms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Track conversions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Campaigns</CardTitle>
              <CardDescription>
                Create and manage SMS campaigns that integrate with your email strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No SMS campaigns yet</p>
                <Button onClick={() => setShowWizard(true)} variant="outline">
                  Create Your First Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <SMSAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Channel Automations</CardTitle>
              <CardDescription>
                Create automated workflows combining email and SMS based on user behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No automations yet</p>
                <Button onClick={() => setShowAutomationBuilder(true)} variant="outline">
                  Build Your First Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <SMSComplianceDashboard />
        </TabsContent>
      </Tabs>

      {showWizard && (
        <SMSCampaignWizard onClose={() => setShowWizard(false)} />
      )}

      {showAutomationBuilder && (
        <CrossChannelAutomationBuilder onClose={() => setShowAutomationBuilder(false)} />
      )}
    </div>
  );
};
