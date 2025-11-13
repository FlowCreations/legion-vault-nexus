import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Target, Sparkles, BarChart3, Send, Zap, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "./intelligence/DashboardOverview";
import { BehaviorAnalytics } from "./intelligence/BehaviorAnalytics";
import { EmailMetricsReporting } from "./intelligence/EmailMetricsReporting";
import { SmartCampaignWizard } from "./intelligence/SmartCampaignWizard";
import { EmailDesigner } from "./EmailDesigner";

export const EmailIntelligenceHub = () => {
  const [showDesigner, setShowDesigner] = useState(false);

  if (showDesigner) {
    return (
      <EmailDesigner
        onBack={() => setShowDesigner(false)}
        onSave={(design) => {
          console.log("Saved design:", design);
          setShowDesigner(false);
        }}
        onSendOrSchedule={(design) => {
          console.log("Send/Schedule:", design);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Email Intelligence
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered insights and automated campaign management
            </p>
          </div>
        </div>
        <Button onClick={() => setShowDesigner(true)} size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <BehaviorAnalytics />
        </TabsContent>

        <TabsContent value="send" className="space-y-6 mt-6">
          <SmartCampaignWizard />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6 mt-6">
          <EmailMetricsReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
};