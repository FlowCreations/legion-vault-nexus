import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AIContentGeneratorProps {
  campaignGoal: string;
  targetAudience: {
    name: string;
    memberCount: number;
    filters: any;
  };
  onGenerate: (content: string) => void;
}

export function AIContentGenerator({ campaignGoal, targetAudience, onGenerate }: AIContentGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("casual");
  const [includeOffer, setIncludeOffer] = useState(false);

  const handleGenerate = async () => {
    if (!campaignGoal) {
      toast({ title: "Please select a campaign goal first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-content", {
        body: {
          campaignGoal,
          targetAudience,
          tone,
          includeOffer,
        },
      });

      if (error) throw error;

      onGenerate(data.content);
      setOpen(false);
      toast({ 
        title: "AI content generated! ✨", 
        description: "Review and customize the generated content" 
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error generating content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Email Content Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="urgent">Urgent & Action-Driven</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="offer">Include Special Offer</Label>
            <Switch
              id="offer"
              checked={includeOffer}
              onCheckedChange={setIncludeOffer}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Campaign Details:</p>
            <p className="text-sm text-muted-foreground">
              Goal: {campaignGoal || "Not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              Audience: {targetAudience.name} ({targetAudience.memberCount} members)
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !campaignGoal} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email Content
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
