import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Users, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface SubjectLineSuggestion {
  subject: string;
  targetPersonalities: string[];
  predictedOpenRate: number;
  strategy: string;
  charCount: number;
}

interface SubjectLineGeneratorProps {
  onSelect: (subject: string) => void;
  currentSubject?: string;
}

export function SubjectLineGenerator({ onSelect, currentSubject }: SubjectLineGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SubjectLineSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Form state
  const [campaignType, setCampaignType] = useState("product_launch");
  const [tone, setTone] = useState(50); // 0 = urgent, 100 = casual
  const [keywords, setKeywords] = useState("");

  // Mock audience personality data (in production, fetch from actual user data)
  const audienceBreakdown = {
    ENFP: 18,
    INFJ: 15,
    ENTP: 12,
    ISFJ: 10,
    ISTJ: 10,
    ENFJ: 9,
    INTP: 8,
    ESFJ: 7,
    Other: 11
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subject-lines', {
        body: {
          campaignType,
          tone: tone < 33 ? 'urgent' : tone < 66 ? 'balanced' : 'casual',
          targetAudience: audienceBreakdown,
          keywords: keywords.trim() || null
        }
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
      toast({
        title: "✨ Subject Lines Generated",
        description: `Created ${data.suggestions.length} AI-optimized variations`,
      });
    } catch (error: any) {
      console.error('Error generating subject lines:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate subject lines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (subject: string, index: number) => {
    navigator.clipboard.writeText(subject);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Subject line copied to clipboard",
    });
  };

  const getOpenRateColor = (rate: number) => {
    if (rate >= 0.35) return "text-green-600";
    if (rate >= 0.25) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getOpenRateLabel = (rate: number) => {
    if (rate >= 0.35) return "Excellent";
    if (rate >= 0.25) return "Good";
    return "Average";
  };

  return (
    <div className="space-y-6">
      {/* Audience Overview */}
      <Card className="p-4 bg-secondary/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Target Audience</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(audienceBreakdown).slice(0, 5).map(([type, percentage]) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}: {percentage}%
            </Badge>
          ))}
        </div>
      </Card>

      {/* Generation Controls */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-type">Campaign Type</Label>
          <Select value={campaignType} onValueChange={setCampaignType}>
            <SelectTrigger id="campaign-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product_launch">Product Launch</SelectItem>
              <SelectItem value="tour_announcement">Tour Announcement</SelectItem>
              <SelectItem value="album_release">Album Release</SelectItem>
              <SelectItem value="exclusive_content">Exclusive Content</SelectItem>
              <SelectItem value="community_update">Community Update</SelectItem>
              <SelectItem value="sale_promotion">Sale/Promotion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-16">Urgent</span>
            <Slider
              value={[tone]}
              onValueChange={(values) => setTone(values[0])}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">Casual</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords (optional)</Label>
          <Input
            id="keywords"
            placeholder="e.g., exclusive, limited, new album"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating AI Suggestions...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Subject Lines
            </>
          )}
        </Button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Generated Suggestions
          </h3>
          
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="p-4 hover:border-primary/50 transition-colors">
              <div className="space-y-3">
                {/* Subject Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-base leading-relaxed">
                      {suggestion.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.charCount} characters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(suggestion.subject, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelect(suggestion.subject)}
                    >
                      Use This
                    </Button>
                  </div>
                </div>

                {/* Strategy */}
                <p className="text-sm text-muted-foreground italic">
                  {suggestion.strategy}
                </p>

                {/* Metrics Row */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  {/* Target Personalities */}
                  <div className="flex gap-1 flex-wrap">
                    {suggestion.targetPersonalities.slice(0, 3).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>

                  {/* Predicted Open Rate */}
                  <div className="ml-auto flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${getOpenRateColor(suggestion.predictedOpenRate)}`} />
                    <span className={`text-sm font-medium ${getOpenRateColor(suggestion.predictedOpenRate)}`}>
                      {(suggestion.predictedOpenRate * 100).toFixed(0)}% 
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getOpenRateLabel(suggestion.predictedOpenRate)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !generating && (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Configure your campaign settings and click "Generate Subject Lines" to get AI-powered suggestions
          </p>
        </Card>
      )}
    </div>
  );
}
