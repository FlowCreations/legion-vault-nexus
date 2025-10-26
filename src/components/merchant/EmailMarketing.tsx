import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, BarChart3, Zap, FileText } from "lucide-react";

export const EmailMarketing = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingList, setEditingList] = useState<any>(null);
  const [deletingList, setDeletingList] = useState<any>(null);
  const [smartListsCreated, setSmartListsCreated] = useState(false);

  useEffect(() => {
    if (activeTab === "lists") {
      loadLists();
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
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
                <div className="text-2xl font-bold">0</div>
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

        <TabsContent value="lists">
          <Card>
            <CardHeader>
              <CardTitle>Email Lists</CardTitle>
              <CardDescription>Create segments based on user behavior and attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">List management coming in Phase 2</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Send broadcast emails to your segments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Campaign builder coming in Phase 3</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card>
            <CardHeader>
              <CardTitle>Automation Sequences</CardTitle>
              <CardDescription>Build behavior-triggered email flows</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Automation builder coming in Phase 4</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Pre-built templates for common scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Template library coming in Phase 3</p>
            </CardContent>
          </Card>
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
