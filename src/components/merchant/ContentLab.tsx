import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Sparkles, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoFrames } from "@/utils/videoFrameExtractor";
import { ContentAnalysisResults } from "./ContentAnalysisResults";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram Reels" },
  { value: "youtube-shorts", label: "YouTube Shorts" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter/X" },
] as const;

export const ContentLab = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [platform, setPlatform] = useState<string>("tiktok");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a video file under 500MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4, MOV, WebM)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !videoTitle || !platform) {
      toast({
        title: "Missing information",
        description: "Please select a video, title, and target platform",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to analyze videos");
      }

      // Extract frames
      setAnalysisProgress(20);
      toast({
        title: "Extracting frames",
        description: "Analyzing your video content...",
      });

      const { frames, metadata } = await extractVideoFrames(selectedFile, 5);
      
      setAnalysisProgress(50);
      toast({
        title: "Analyzing with AI",
        description: "This may take 1-2 minutes...",
      });

      // Call edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-content-performance', {
        body: {
          videoTitle,
          platform,
          frames: frames.map(f => ({
            timestamp: f.timestamp,
            image: f.dataUrl.split(',')[1] // Remove data:image/jpeg;base64, prefix
          })),
          metadata
        }
      });

      if (error) throw error;

      setAnalysisProgress(90);

      // Save to database
      const { error: saveError } = await supabase
        .from('content_analyses')
        .insert({
          merchant_id: user.id,
          video_title: videoTitle,
          video_url: selectedFile.name,
          video_duration: Math.round(metadata.duration),
          overall_score: Math.round(data.overallScore),
          hook_score: Math.round(data.hookScore),
          pacing_score: Math.round(data.pacingScore),
          visual_score: Math.round(data.visualScore),
          predicted_dropoff_points: data.dropoffPoints,
          recommendations: data.recommendations,
          frame_analysis: { platform, ...data.frameAnalysis }
        });

      if (saveError) throw saveError;

      setAnalysisProgress(100);
      setAnalysisResults(data);

      toast({
        title: "Analysis complete!",
        description: "Your content has been analyzed successfully",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Content Lab
        </h2>
        <p className="text-muted-foreground mt-1">
          Upload videos and get platform-specific AI analysis on engagement, drop-off predictions, and viral potential
        </p>
      </div>

      {!analysisResults ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <Label htmlFor="platform">Target Platform</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={isAnalyzing}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="video-upload">Upload Video</Label>
              <div className="mt-2">
                <label
                  htmlFor="video-upload"
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isAnalyzing
                      ? 'bg-muted cursor-not-allowed'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Video className="h-12 w-12 text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, MOV, WebM (max 500MB)
                      </p>
                    </div>
                  )}
                  <input
                    id="video-upload"
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileSelect}
                    disabled={isAnalyzing}
                  />
                </label>
              </div>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analyzing...</span>
                  <span className="font-medium">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || !videoTitle || !platform || isAnalyzing}
              className="w-full gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Video...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze for {PLATFORMS.find(p => p.value === platform)?.label}
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={() => {
              setAnalysisResults(null);
              setSelectedFile(null);
              setVideoTitle("");
            }}
            variant="outline"
          >
            Analyze Another Video
          </Button>
          
          <ContentAnalysisResults
            videoTitle={videoTitle}
            platform={PLATFORMS.find(p => p.value === platform)?.label || platform}
            videoDuration={analysisResults.metadata?.duration || 0}
            overallScore={analysisResults.overallScore}
            hookScore={analysisResults.hookScore}
            pacingScore={analysisResults.pacingScore}
            visualScore={analysisResults.visualScore}
            dropoffPoints={analysisResults.dropoffPoints || []}
            recommendations={analysisResults.recommendations || []}
            platformInsights={analysisResults.platformInsights}
          />
        </div>
      )}
    </div>
  );
};
