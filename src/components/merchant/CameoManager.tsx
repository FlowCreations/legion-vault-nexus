import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cameo } from "@/types/cameo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gift, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { CreateCameoDialog } from "./CreateCameoDialog";
import { CameoHistory } from "./CameoHistory";
import { useToast } from "@/hooks/use-toast";

export const CameoManager = () => {
  const [cameos, setCameos] = useState<Cameo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCameos();
  }, []);

  const fetchCameos = async () => {
    try {
      const { data, error } = await supabase
        .from('cameos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCameos((data || []) as Cameo[]);
    } catch (error) {
      console.error('Error fetching cameos:', error);
      toast({
        title: "Error",
        description: "Failed to load cameos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeCameos = cameos.filter(c => c.status === 'active');
  const scheduledCameos = cameos.filter(c => c.status === 'scheduled');
  const totalViews = cameos.reduce((sum, c) => sum + c.view_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Cameo Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Send personalized messages to your fans
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Cameo
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cameos</p>
              <p className="text-2xl font-bold">{cameos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCameos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">{scheduledCameos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{totalViews}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeCameos.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledCameos.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <CameoHistory cameos={activeCameos} onRefresh={fetchCameos} />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <CameoHistory cameos={scheduledCameos} onRefresh={fetchCameos} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <CameoHistory cameos={cameos} onRefresh={fetchCameos} />
        </TabsContent>
      </Tabs>

      <CreateCameoDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchCameos}
      />
    </div>
  );
};
