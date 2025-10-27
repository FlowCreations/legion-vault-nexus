import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AutomationFunnelProps {
  automationId: string;
}

export const AutomationFunnel = ({ automationId }: AutomationFunnelProps) => {
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunnelData();
  }, [automationId]);

  const loadFunnelData = async () => {
    try {
      const { data: automation } = await supabase
        .from('automation_sequences')
        .select('*')
        .eq('id', automationId)
        .single();

      if (!automation) return;

      const { data: enrollments } = await supabase
        .from('automation_enrollments')
        .select('id')
        .eq('automation_id', automationId);

      const steps = (automation.steps as any[]) || [];
      const enrollmentIds = enrollments?.map(e => e.id) || [];

      const funnelSteps = await Promise.all(
        steps.map(async (step, index) => {
          const { data: executions } = await supabase
            .from('automation_step_executions')
            .select('*')
            .eq('step_index', index)
            .in('enrollment_id', enrollmentIds);

          const completed = executions?.filter(e => e.status === 'completed').length || 0;
          const total = enrollmentIds.length;

          return {
            name: step.name || `Step ${index + 1}`,
            type: step.type,
            reached: total,
            completed: completed,
            conversionRate: total > 0 ? (completed / total) * 100 : 0
          };
        })
      );

      setFunnelData(funnelSteps);
    } catch (error) {
      console.error('Error loading funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading funnel...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Funnel</CardTitle>
        <CardDescription>Step-by-step conversion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {funnelData.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{step.name}</span>
                <span className="text-sm text-muted-foreground">
                  {step.completed} / {step.reached} ({step.conversionRate.toFixed(1)}%)
                </span>
              </div>
              
              <div className="h-12 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
                  style={{ width: `${step.conversionRate}%` }}
                >
                  {step.conversionRate > 10 && `${step.conversionRate.toFixed(1)}%`}
                </div>
              </div>

              {index < funnelData.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {funnelData.length > 1 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Drop-off Analysis</h4>
            {funnelData
              .map((step, index) => ({
                step,
                dropOff: index > 0 ? funnelData[index - 1].completed - step.completed : 0
              }))
              .filter(item => item.dropOff > 0)
              .sort((a, b) => b.dropOff - a.dropOff)
              .slice(0, 3)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm">{item.step.name}</span>
                  <Badge variant="destructive">{item.dropOff} users lost</Badge>
                </div>
              ))
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};
