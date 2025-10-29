import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, BarChart3, Zap, Plus, Loader2, ShoppingCart, Star, Mail as MailIcon, Brain, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmailListBuilder } from "./EmailListBuilder";
import { EmailListCard } from "./EmailListCard";
import { CampaignBuilder } from "./CampaignBuilder";
import { CampaignAnalytics } from "./CampaignAnalytics";
import { createSmartLists } from "./SmartListTemplates";
import { AutomationBuilder } from "./AutomationBuilder";
import { AUTOMATION_TEMPLATES } from "./AutomationTemplates";
import { Switch } from "@/components/ui/switch";
import { TunepipeSyncButton } from "./TunepipeSyncButton";
import { AIEmailIntelligence } from "./AIEmailIntelligence";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const EmailMarketing = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [lists, setLists] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showCampaignAnalytics, setShowCampaignAnalytics] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<any>(null);
  const [deletingList, setDeletingList] = useState<any>(null);
  const [smartListsCreated, setSmartListsCreated] = useState(false);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = useState(false);
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [autoEngageEnabled, setAutoEngageEnabled] = useState(false);

  // Load auto-engage status on mount
  useEffect(() => {
    const loadAutoEngageStatus = async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("flag_name", "auto_engage_fans")
        .single();
      
      if (data) {
        setAutoEngageEnabled(data.enabled);
      }
    };
    
    loadAutoEngageStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "lists") {
      loadLists();
    } else if (activeTab === "campaigns") {
      loadCampaigns();
    } else if (activeTab === "automations") {
      loadAutomations();
    }
  }, [activeTab]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLists(data || []);
      
      if (data && data.length === 0 && !smartListsCreated) {
        await createSmartLists();
        setSmartListsCreated(true);
        loadLists();
      }
    } catch (error: any) {
      toast.error("Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast.error("Failed to load campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadAutomations = async () => {
    setLoadingAutomations(true);
    try {
      const { data, error } = await supabase
        .from('automation_sequences')
        .select(`
          *,
          enrollments:automation_enrollments(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const automationsWithCounts = (data || []).map(automation => ({
        ...automation,
        enrollments_count: automation.enrollments?.[0]?.count || 0
      }));
      
      setAutomations(automationsWithCounts);
    } catch (error: any) {
      toast.error("Failed to load automations");
    } finally {
      setLoadingAutomations(false);
    }
  };

  const createFromTemplate = async (templateName: string) => {
    const template = AUTOMATION_TEMPLATES.find(t => t.name === templateName);
    if (!template) return;

    try {
      const { data, error } = await supabase
        .from('automation_sequences')
        .insert({
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_rules: template.trigger_rules as any || {},
          steps: template.steps as any,
          is_active: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Created automation: ${template.name}`);
      setEditingAutomationId(data.id);
      setShowAutomationBuilder(true);
    } catch (error: any) {
      toast.error("Failed to create automation from template");
    }
  };

  const toggleAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;

    const newStatus = !automation.is_active;

    try {
      const { error } = await supabase
        .from('automation_sequences')
        .update({ is_active: newStatus })
        .eq('id', automationId);

      if (error) throw error;

      toast.success(newStatus ? 'Automation activated' : 'Automation deactivated');
      loadAutomations();
    } catch (error: any) {
      toast.error('Failed to update automation status');
    }
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;
    
    try {
      const { error } = await supabase
        .from('email_lists')
        .delete()
        .eq('id', deletingList.id);
      
      if (error) throw error;
      toast.success("List deleted successfully");
      loadLists();
    } catch (error: any) {
      toast.error("Failed to delete list");
    } finally {
      setDeletingList(null);
    }
  };

  const handleAutoEngageToggle = async (checked: boolean) => {
    setAutoEngageEnabled(checked);
    
    try {
      // Update feature flag in database
      const { error } = await supabase
        .from("feature_flags")
        .upsert({
          flag_name: "auto_engage_fans",
          enabled: checked,
        });

      if (error) throw error;

      if (checked) {
        toast.success("Auto-Engage Fans activated", {
          description: "JRNY is now analyzing fan behavior and will auto-send smart campaigns"
        });
      } else {
        toast("Auto-Engage Fans disabled", {
          description: "Automatic fan engagement paused"
        });
      }
    } catch (error) {
      console.error("Error toggling auto-engage:", error);
      setAutoEngageEnabled(!checked); // Revert on error
      toast.error("Failed to update Auto-Engage setting");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Intelligence</h2>
          <p className="text-muted-foreground mt-2">
            Behavior-driven email campaigns powered by ERA/PTP scoring
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lists
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end mb-4">
            <TunepipeSyncButton onSyncComplete={() => {
              loadLists();
              loadCampaigns();
            }} />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">All opted-in users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automations.filter(a => a.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Running sequences</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Email Intelligence</CardTitle>
              <CardDescription>
                Build behavior-driven email campaigns that automatically target the right fans at the right time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Main Funnel (Universal Lifecycle)</h4>
                <p className="text-sm text-muted-foreground">
                  Everyone who opts in enters this sequence: welcome message → nurture → offer. This is your global onboarding flow.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Personalized Funnels (Behavior-Triggered)</h4>
                <p className="text-sm text-muted-foreground">
                  Target specific cohorts based on ERA/PTP scores, purchases, engagement, and more:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Hot PTP ({'>'}70): Ready to buy, send VIP offers</li>
                  <li>NYC T-Shirt Buyers: Upsell signed vinyl</li>
                  <li>High engagement, no purchase: Convert to buyers</li>
                  <li>Abandoned cart: Recovery sequence</li>
                </ul>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Next Steps:</span> Create your first email list, design a campaign, or set up an automation sequence.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence">
          <AIEmailIntelligence />
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Email Lists</h2>
              <p className="text-muted-foreground">Create and manage segmented audiences</p>
            </div>
            <Button onClick={() => { setEditingList(null); setIsBuilderOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
              <p className="text-muted-foreground mb-4">Create your first email list to get started</p>
              <Button onClick={() => setIsBuilderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <EmailListCard
                  key={list.id}
                  list={list}
                  onEdit={() => { setEditingList(list); setIsBuilderOpen(true); }}
                  onDelete={() => setDeletingList(list)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          {showCampaignBuilder ? (
            <CampaignBuilder
              onClose={() => setShowCampaignBuilder(false)}
              onSave={() => {
                setShowCampaignBuilder(false);
                loadCampaigns();
              }}
            />
          ) : showCampaignAnalytics ? (
            <div>
              <Button variant="outline" className="mb-4" onClick={() => setShowCampaignAnalytics(null)}>
                ← Back
              </Button>
              <CampaignAnalytics campaignId={showCampaignAnalytics} />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Campaigns</CardTitle>
                    <CardDescription>Send broadcast emails to your segments</CardDescription>
                  </div>
                  <Button onClick={() => setShowCampaignBuilder(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCampaigns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setShowCampaignAnalytics(c.id)}
                        className="p-4 border rounded hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{c.name}</h4>
                            <p className="text-sm text-muted-foreground">{c.subject}</p>
                          </div>
                          <Badge>{c.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="automations">
          {showAutomationBuilder ? (
            <AutomationBuilder
              automationId={editingAutomationId || undefined}
              isNew={!editingAutomationId}
              onClose={() => {
                setShowAutomationBuilder(false);
                setEditingAutomationId(null);
              }}
              onSave={() => {
                setShowAutomationBuilder(false);
                setEditingAutomationId(null);
                loadAutomations();
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Automation Sequences</h2>
                  <p className="text-muted-foreground">
                    Behavior-driven email flows that run automatically
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            When ON, JRNY analyzes fan activity across your portal — merch views, music plays, 
                            event interest, and more — to identify who's prime to purchase. It automatically sends 
                            thoughtful touchpoints that match each fan's intent — boosting sales without over-messaging.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <label 
                      htmlFor="auto-engage-toggle" 
                      className={cn(
                        "text-sm font-medium cursor-pointer transition-colors",
                        autoEngageEnabled ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      Auto-Engage Fans
                    </label>
                    
                    <Switch
                      id="auto-engage-toggle"
                      checked={autoEngageEnabled}
                      onCheckedChange={handleAutoEngageToggle}
                      className={cn(
                        "data-[state=checked]:bg-green-600",
                        autoEngageEnabled && "shadow-lg shadow-green-600/30"
                      )}
                    />
                  </div>
                  
                  <Button onClick={() => {
                    setEditingAutomationId(null);
                    setShowAutomationBuilder(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Automation
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Start from a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors" 
                    onClick={() => createFromTemplate('Welcome Series')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MailIcon className="h-5 w-5" />
                        Welcome Series
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Onboard new subscribers with a 3-email series
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => createFromTemplate('Abandoned Cart Recovery')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShoppingCart className="h-5 w-5" />
                        Abandoned Cart
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Recover sales with timely reminders
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => createFromTemplate('VIP Engagement Flow')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="h-5 w-5" />
                        VIP Engagement
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Nurture your top fans with exclusive content
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => createFromTemplate('Re-engagement Campaign')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-5 w-5" />
                        Re-engagement
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Win back inactive subscribers
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Your Automations</h3>
                {loadingAutomations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : automations.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first automation or start from a template
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {automations.map((automation) => (
                      <Card key={automation.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg">{automation.name}</h4>
                              <Badge variant={automation.is_active ? "default" : "secondary"}>
                                {automation.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {automation.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {automation.enrollments_count} enrolled
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {automation.trigger_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {automation.steps?.length || 0} steps
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAutomationId(automation.id);
                                setShowAutomationBuilder(true);
                              }}
                            >
                              Edit
                            </Button>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {automation.is_active ? "On" : "Off"}
                              </span>
                              <Switch
                                checked={automation.is_active}
                                onCheckedChange={() => toggleAutomation(automation.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EmailListBuilder
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onListCreated={loadLists}
        editingList={editingList}
      />

      <AlertDialog open={!!deletingList} onOpenChange={() => setDeletingList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingList?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
