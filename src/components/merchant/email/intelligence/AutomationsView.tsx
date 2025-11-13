import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, Clock, Users, TrendingUp, Play, Pause, Settings,
  Zap, Target, Heart, ShoppingBag
} from "lucide-react";
import { AUTOMATION_TEMPLATES } from "../../AutomationTemplates";
import { useNavigate } from "react-router-dom";

export function AutomationsView() {
  const navigate = useNavigate();
  // Mock active automations - in real app, fetch from database
  const activeAutomations = AUTOMATION_TEMPLATES.map((template, index) => ({
    ...template,
    id: `auto-${index}`,
    status: index === 0 || index === 2 ? 'active' : 'paused',
    emailsSent: Math.floor(Math.random() * 500) + 50,
    openRate: (Math.random() * 30 + 20).toFixed(1),
    clickRate: (Math.random() * 15 + 5).toFixed(1),
    conversionRate: (Math.random() * 5 + 1).toFixed(1),
    subscribers: Math.floor(Math.random() * 1000) + 100
  }));

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getIcon = (name: string) => {
    if (name.includes('Welcome')) return Mail;
    if (name.includes('Cart')) return ShoppingBag;
    if (name.includes('VIP')) return Heart;
    return Target;
  };

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
                  {(activeAutomations.reduce((sum, a) => sum + parseFloat(a.openRate), 0) / activeAutomations.length).toFixed(1)}%
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Navigate to automations tab in EmailMarketing
                      navigate('/merchant?tab=automations');
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{automation.steps.length} steps</span>
                    <span className="mx-2">•</span>
                    <span>Trigger: {automation.trigger_type.replace('_', ' ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
