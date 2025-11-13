import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Target, ShoppingCart, Sparkles, BarChart3, Settings } from "lucide-react";
import { DashboardOverview } from "./intelligence/DashboardOverview";
import { BehaviorAnalytics } from "./intelligence/BehaviorAnalytics";
import { AbandonedCartCenter } from "./intelligence/AbandonedCartCenter";
import { AutomationRulesBuilder } from "./intelligence/AutomationRulesBuilder";
import { EmailMetricsReporting } from "./intelligence/EmailMetricsReporting";
import { SmartCampaignWizard } from "./intelligence/SmartCampaignWizard";

export const EmailIntelligenceHub = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Email Intelligence Hub</h2>
          <p className="text-muted-foreground">
            AI-powered email marketing with behavior-driven automation
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="abandoned" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Carts
          </TabsTrigger>
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            Wizard
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <BehaviorAnalytics />
        </TabsContent>

        <TabsContent value="abandoned" className="space-y-6">
          <AbandonedCartCenter />
        </TabsContent>

        <TabsContent value="wizard" className="space-y-6">
          <SmartCampaignWizard />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutomationRulesBuilder />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <EmailMetricsReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
};