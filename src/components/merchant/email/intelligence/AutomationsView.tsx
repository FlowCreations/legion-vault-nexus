import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, Clock, Users, TrendingUp, Play, Pause, Settings,
  Zap, Target, Heart, ShoppingBag, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailStep } from "@/types/automation";

interface AutomationWithStats {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  steps: any[];
  is_active: boolean;
  status: 'active' | 'paused';
  emailsSent: number;
  openRate: string;
  clickRate: string;
  conversionRate: string;
  subscribers: number;
}

export function AutomationsView() {
  const navigate = useNavigate();
  const [activeAutomations, setActiveAutomations] = useState<AutomationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailStep | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      const { data: automations, error } = await supabase
        .from('automation_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stats for each automation
      const automationsWithStats = await Promise.all(
        (automations || []).map(async (automation) => {
          const { data: executions } = await supabase
            .from('automation_step_executions')
            .select('*')
            .eq('enrollment_id', automation.id);

          const { data: enrollments } = await supabase
            .from('automation_enrollments')
            .select('*');

          const emailsSent = executions?.filter(e => e.step_type === 'email' && e.status === 'completed').length || 0;
          const opened = executions?.filter(e => {
            const result = e.result as any;
            return result?.opened;
          }).length || 0;
          const clicked = executions?.filter(e => {
            const result = e.result as any;
            return result?.clicked;
          }).length || 0;
          const converted = executions?.filter(e => {
            const result = e.result as any;
            return result?.converted;
          }).length || 0;

          return {
            id: automation.id,
            name: automation.name,
            description: automation.description || '',
            trigger_type: automation.trigger_type,
            steps: automation.steps as any[],
            is_active: automation.is_active,
            status: (automation.is_active ? 'active' : 'paused') as 'active' | 'paused',
            emailsSent,
            openRate: emailsSent > 0 ? ((opened / emailsSent) * 100).toFixed(1) : '0.0',
            clickRate: emailsSent > 0 ? ((clicked / emailsSent) * 100).toFixed(1) : '0.0',
            conversionRate: emailsSent > 0 ? ((converted / emailsSent) * 100).toFixed(1) : '0.0',
            subscribers: enrollments?.filter(e => e.automation_id === automation.id).length || 0
          };
        })
      );

      setActiveAutomations(automationsWithStats);
    } catch (error: any) {
      console.error('Error loading automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const viewEmailContent = (step: EmailStep) => {
    setSelectedEmail(step);
    setShowEmailDialog(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getIcon = (name: string) => {
    if (name.includes('Welcome')) return Mail;
    if (name.includes('Cart')) return ShoppingBag;
    if (name.includes('VIP')) return Heart;
    return Target;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading automations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Automations</p>
                <p className="text-2xl font-bold">{activeAutomations.filter(a => a.status === 'active').length}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">
                  {activeAutomations.reduce((sum, a) => sum + a.emailsSent, 0).toLocaleString()}
                </p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                <p className="text-2xl font-bold">
                  {activeAutomations.length > 0 
                    ? (activeAutomations.reduce((sum, a) => sum + parseFloat(a.openRate), 0) / activeAutomations.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">
                  {activeAutomations.reduce((sum, a) => sum + a.subscribers, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Automations</h3>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage All
          </Button>
        </div>

        {activeAutomations.map((automation) => {
          const Icon = getIcon(automation.name);
          return (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{automation.name}</CardTitle>
                        <Badge 
                          variant={automation.status === 'active' ? 'default' : 'secondary'}
                          className={automation.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {automation.status === 'active' ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardDescription>{automation.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/merchant?tab=automations&edit=${automation.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Emails Sent</p>
                    <p className="text-lg font-semibold">{automation.emailsSent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Open Rate</p>
                    <p className="text-lg font-semibold text-green-600">{automation.openRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Click Rate</p>
                    <p className="text-lg font-semibold text-blue-600">{automation.clickRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Conversion</p>
                    <p className="text-lg font-semibold text-purple-600">{automation.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Subscribers</p>
                    <p className="text-lg font-semibold">{automation.subscribers.toLocaleString()}</p>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{automation.steps.length} steps</span>
                      <span className="mx-2">•</span>
                      <span>Trigger: {automation.trigger_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex gap-2">
                      {automation.steps.filter((s: any) => s.type === 'email').map((emailStep: any, idx: number) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          onClick={() => viewEmailContent(emailStep)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Email {idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Email Content Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.name}</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                <p className="text-base mt-1">{selectedEmail.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Body</label>
                <div className="mt-1 p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>
              {selectedEmail.sendTimeOptimization && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Send time optimization enabled</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
