import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye, Heart, Zap } from "lucide-react";

export const IntelligenceFlowDiagram = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Intelligence Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Oracle */}
          <div className="flex-1 p-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-purple-500">Oracle</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Predicts purchase likelihood and revenue forecasts
            </p>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

          {/* Epiphany */}
          <div className="flex-1 p-4 rounded-lg border-2 border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-blue-500">Epiphany</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Reveals emotional states and community patterns
            </p>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

          {/* Catalyst */}
          <div className="flex-1 p-4 rounded-lg border-2 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-emerald-500">Catalyst</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Deploys automated personalized campaigns
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>How it works:</strong> Oracle predicts → Epiphany understands → Catalyst acts
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
