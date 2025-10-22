import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, TrendingDown, Clock, Download, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DropoffPoint {
  timestamp: number;
  risk: number;
  reason: string;
}

interface Recommendation {
  timestamp: number;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisResultsProps {
  videoTitle: string;
  platform: string;
  videoDuration: number;
  overallScore: number;
  hookScore: number;
  pacingScore: number;
  visualScore: number;
  dropoffPoints: DropoffPoint[];
  recommendations: Recommendation[];
  platformInsights?: {
    bestPlatforms?: string[];
    formatRecommendations?: string[];
    viralPotential?: number;
  };
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const getRiskColor = (risk: number): string => {
  if (risk >= 70) return "bg-red-500/20 border-red-500";
  if (risk >= 40) return "bg-yellow-500/20 border-yellow-500";
  return "bg-green-500/20 border-green-500";
};

const getPriorityColor = (priority: string): string => {
  if (priority === "high") return "destructive";
  if (priority === "medium") return "secondary";
  return "outline";
};

export const ContentAnalysisResults = ({
  videoTitle,
  platform,
  videoDuration,
  overallScore,
  hookScore,
  pacingScore,
  visualScore,
  dropoffPoints,
  recommendations,
  platformInsights,
}: AnalysisResultsProps) => {
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-6">
      {/* Overall Scores */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Analysis Results: {videoTitle}</h3>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {platform}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </p>
            <Progress value={overallScore} className="mt-2" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Hook Strength</p>
            <p className={`text-3xl font-bold ${getScoreColor(hookScore)}`}>
              {hookScore}
            </p>
            <Progress value={hookScore} className="mt-2" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Pacing</p>
            <p className={`text-3xl font-bold ${getScoreColor(pacingScore)}`}>
              {pacingScore}
            </p>
            <Progress value={pacingScore} className="mt-2" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Visual Engagement</p>
            <p className={`text-3xl font-bold ${getScoreColor(visualScore)}`}>
              {visualScore}
            </p>
            <Progress value={visualScore} className="mt-2" />
          </div>
        </div>
      </Card>

      {/* Platform-Specific Insights */}
      {platformInsights && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Platform Optimization Insights
          </h3>
          <div className="space-y-4">
            {platformInsights.viralPotential !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Viral Potential on {platform}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(platformInsights.viralPotential)}`}>
                    {platformInsights.viralPotential}%
                  </span>
                </div>
                <Progress value={platformInsights.viralPotential} />
              </div>
            )}
            
            {platformInsights.bestPlatforms && platformInsights.bestPlatforms.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Also Recommended For:</p>
                <div className="flex flex-wrap gap-2">
                  {platformInsights.bestPlatforms.map((p, idx) => (
                    <Badge key={idx} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {platformInsights.formatRecommendations && platformInsights.formatRecommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Format Recommendations:</p>
                <ul className="space-y-1">
                  {platformInsights.formatRecommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Timeline Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Drop-off Risk Timeline
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>0:00</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            {dropoffPoints.map((point, idx) => {
              const position = (point.timestamp / videoDuration) * 100;
              return (
                <div
                  key={idx}
                  className={`absolute top-0 bottom-0 w-1 ${
                    point.risk >= 70 ? 'bg-red-500' : point.risk >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ left: `${position}%` }}
                  title={`${formatTime(point.timestamp)}: ${point.reason}`}
                />
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" /> Low Risk
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" /> Medium Risk
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" /> High Risk
            </span>
          </div>
        </div>
      </Card>

      {/* Drop-off Points Details */}
      {dropoffPoints.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Predicted Drop-off Points
          </h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {dropoffPoints
                .sort((a, b) => b.risk - a.risk)
                .map((point, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${getRiskColor(point.risk)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{formatTime(point.timestamp)}</span>
                        <Badge variant="outline">{point.risk}% risk</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{point.reason}</p>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actionable Recommendations
          </h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {sortedRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{formatTime(rec.timestamp)}</span>
                        <Badge variant={getPriorityColor(rec.priority) as any}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm">{rec.suggestion}</p>
                    </div>
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Analysis
        </Button>
      </div>
    </div>
  );
};
