import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Upload, Search, User } from "lucide-react";
import { format } from "date-fns";
import { MessageType, DisplayDuration } from "@/types/cameo";
import { generateVideoThumbnail } from "@/utils/cameoHelpers";
import { cn } from "@/lib/utils";

interface CreateCameoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateCameoDialog = ({ open, onOpenChange, onSuccess }: CreateCameoDialogProps) => {
  const [step, setStep] = useState(1);
  const [recipientMode, setRecipientMode] = useState<"search" | "manual">("search");
  const [recipientUserId, setRecipientUserId] = useState<string>("");
  const [recipientManualName, setRecipientManualName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [messageText, setMessageText] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [displayDuration, setDisplayDuration] = useState<DisplayDuration>("permanent");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [scheduledFor, setScheduledFor] = useState<Date>();
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchFans = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, tier, location')
      .ilike('display_name', `%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 100MB",
        variant: "destructive",
      });
      return;
    }
    setVideoFile(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let videoUrl = null;
      let thumbnailUrl = null;

      // Upload video if present
      if (videoFile) {
        const fileName = `${user.id}/${Date.now()}_${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cameo-videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cameo-videos')
          .getPublicUrl(fileName);

        videoUrl = publicUrl;

        // Generate thumbnail
        try {
          const thumbnailBlob = await generateVideoThumbnail(videoFile);
          const thumbFileName = `${user.id}/${Date.now()}_thumb.jpg`;
          const { error: thumbError } = await supabase.storage
            .from('cameo-videos')
            .upload(thumbFileName, thumbnailBlob);

          if (!thumbError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('cameo-videos')
              .getPublicUrl(thumbFileName);
            thumbnailUrl = thumbUrl;
          }
        } catch (err) {
          console.error('Thumbnail generation failed:', err);
        }
      }

      const cameoData = {
        merchant_id: user.id,
        recipient_user_id: recipientMode === "search" ? recipientUserId : null,
        recipient_manual_name: recipientMode === "manual" ? recipientManualName : null,
        message_type: messageType,
        message_text: messageType === "text" || messageType === "scheduled" ? messageText : null,
        video_url: videoUrl,
        video_thumbnail_url: thumbnailUrl,
        display_duration: displayDuration,
        expires_at: displayDuration === "auto_expire" ? expiresAt?.toISOString() : null,
        scheduled_for: messageType === "scheduled" ? scheduledFor?.toISOString() : null,
        status: messageType === "scheduled" ? "scheduled" : "active",
      };

      const { data: cameo, error } = await supabase
        .from('cameos')
        .insert(cameoData)
        .select()
        .single();

      if (error) throw error;

      // Create notification record
      if (notificationEnabled && recipientUserId) {
        await supabase.from('cameo_notifications').insert({
          cameo_id: cameo.id,
          recipient_user_id: recipientUserId,
          notification_type: 'in_app',
          email_enabled: false,
        });
      }

      toast({
        title: "Cameo created!",
        description: messageType === "scheduled" ? "Your cameo will be sent as scheduled" : "Your cameo is now live",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating cameo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create cameo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setRecipientMode("search");
    setRecipientUserId("");
    setRecipientManualName("");
    setSearchQuery("");
    setSearchResults([]);
    setMessageType("text");
    setMessageText("");
    setVideoFile(null);
    setDisplayDuration("permanent");
    setExpiresAt(undefined);
    setScheduledFor(undefined);
    setNotificationEnabled(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Cameo - Step {step} of 3</DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Recipient */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <RadioGroup value={recipientMode} onValueChange={(v: any) => setRecipientMode(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="search" id="search" />
                  <Label htmlFor="search" className="cursor-pointer">Search existing fan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="cursor-pointer">Enter name manually</Label>
                </div>
              </RadioGroup>
            </div>

            {recipientMode === "search" && (
              <div className="space-y-2">
                <Label>Search Fans</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchFans(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((fan) => (
                      <div
                        key={fan.user_id}
                        onClick={() => {
                          setRecipientUserId(fan.user_id);
                          setSearchQuery(fan.display_name);
                          setSearchResults([]);
                        }}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-muted transition-colors",
                          recipientUserId === fan.user_id && "bg-primary/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {fan.avatar_url ? (
                              <img src={fan.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{fan.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {fan.tier && `${fan.tier} • `}{fan.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {recipientMode === "manual" && (
              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Enter recipient name..."
                  value={recipientManualName}
                  onChange={(e) => setRecipientManualName(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={recipientMode === "search" ? !recipientUserId : !recipientManualName}
              className="w-full"
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Message Type & Content */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <RadioGroup value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <Label htmlFor="text" className="cursor-pointer">Text Message</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video" className="cursor-pointer">Video Message</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="cursor-pointer">Scheduled Message</Label>
                </div>
              </RadioGroup>
            </div>

            {(messageType === "text" || messageType === "scheduled") && (
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Write your personalized message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {messageText.length}/1000 characters
                </p>
              </div>
            )}

            {messageType === "video" && (
              <div className="space-y-2">
                <Label>Video File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {videoFile ? videoFile.name : "Click to upload video"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Max 100MB</p>
                  </label>
                </div>
              </div>
            )}

            {messageType === "scheduled" && (
              <div className="space-y-2">
                <Label>Schedule For</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledFor ? format(scheduledFor, "PPP p") : "Pick a date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledFor}
                      onSelect={setScheduledFor}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={
                  (messageType === "text" && !messageText) ||
                  (messageType === "video" && !videoFile) ||
                  (messageType === "scheduled" && (!messageText || !scheduledFor))
                }
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Display Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Duration</Label>
              <Select value={displayDuration} onValueChange={(v: any) => setDisplayDuration(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent - Always visible</SelectItem>
                  <SelectItem value="auto_expire">Auto-expire - Set expiration date</SelectItem>
                  <SelectItem value="show_once">Show once - Disappears after viewing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {displayDuration === "auto_expire" && (
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP") : "Pick expiration date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={setExpiresAt}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="notification">Send Notification</Label>
                <p className="text-sm text-muted-foreground">
                  Email notifications disabled until email system is configured
                </p>
              </div>
              <Switch
                id="notification"
                checked={notificationEnabled}
                onCheckedChange={setNotificationEnabled}
                disabled
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (displayDuration === "auto_expire" && !expiresAt)}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Cameo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
