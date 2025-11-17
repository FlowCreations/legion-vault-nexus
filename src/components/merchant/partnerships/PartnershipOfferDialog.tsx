import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Portal {
  id: string;
  name: string;
  avatar_url: string;
  portal_followers: number;
  social_followers: number;
}

interface PartnershipOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPortal: Portal;
}

export function PartnershipOfferDialog({ open, onOpenChange, targetPortal }: PartnershipOfferDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    coreDemographic: "",
    genderMale: "",
    genderFemale: "",
    genderOther: "",
    primaryLocation: "",
    audienceBehaviors: "",
    standsFor: [] as string[],
    avoids: [] as string[],
    partnershipType: "",
    offering: "",
    lookingFor: "",
    duration: "",
    compensation: "",
    personalMessage: ""
  });

  const [standsForInput, setStandsForInput] = useState("");
  const [avoidsInput, setAvoidsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's profile data to pre-fill
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('ethos, non_negotiables')
          .eq('artist_id', user.id)
          .maybeSingle();

        if (profile || affiliate) {
          const location = profile?.location || "";
          const ethos = affiliate?.ethos ? affiliate.ethos.split(',').map(v => v.trim()) : [];
          const avoids = affiliate?.non_negotiables || [];
          
          setFormData(prev => ({
            ...prev,
            primaryLocation: location,
            standsFor: ethos,
            avoids: avoids
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchProfileData();
    }
  }, [open, user]);

  const handleAddTag = (field: 'standsFor' | 'avoids', value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    
    if (field === 'standsFor') setStandsForInput("");
    if (field === 'avoids') setAvoidsInput("");
  };

  const handleRemoveTag = (field: 'standsFor' | 'avoids', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.partnershipType) {
      toast.error("Please select a partnership type");
      return;
    }

    if (formData.compensation && !/^\d+$/.test(formData.compensation.trim())) {
      toast.error("Compensation must be a number only (e.g., 500, 1000)");
      return;
    }

    if (formData.personalMessage.split(' ').length > 500) {
      toast.error("Personal message must be 500 words or less");
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Submit to backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Partnership offer submitted successfully!", {
        description: `Your offer to ${targetPortal.name} has been sent.`
      });
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        coreDemographic: "",
        genderMale: "",
        genderFemale: "",
        genderOther: "",
        primaryLocation: "",
        audienceBehaviors: "",
        standsFor: [],
        avoids: [],
        partnershipType: "",
        offering: "",
        lookingFor: "",
        duration: "",
        compensation: "",
        personalMessage: ""
      });
    } catch (error) {
      toast.error("Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = formData.personalMessage.split(' ').filter(w => w.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Partnership Offer</DialogTitle>
          <DialogDescription>
            Send a detailed partnership proposal to collaborate and grow together
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Portal Info */}
          <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={targetPortal.avatar_url} alt={targetPortal.name} />
              <AvatarFallback>{targetPortal.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{targetPortal.name}</p>
              <p className="text-sm text-muted-foreground">
                {(targetPortal.portal_followers / 1000).toFixed(1)}K followers • {(targetPortal.social_followers / 1000).toFixed(0)}K social reach
              </p>
            </div>
          </div>

          {/* Partnership Details - MOVED TO TOP */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Partnership Details</h3>

            <div className="space-y-2">
              <Label htmlFor="partnershipType">Partnership Type *</Label>
              <Select value={formData.partnershipType} onValueChange={(value) => setFormData(prev => ({ ...prev, partnershipType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partnership type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cross-promotion">Cross-promotion</SelectItem>
                  <SelectItem value="affiliate">Affiliate marketing</SelectItem>
                  <SelectItem value="co-content">Co-content creation</SelectItem>
                  <SelectItem value="event">Event collaboration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offering">What You're Offering</Label>
              <Textarea
                id="offering"
                placeholder="Describe what you bring to the partnership..."
                rows={3}
                value={formData.offering}
                onChange={(e) => setFormData(prev => ({ ...prev, offering: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookingFor">What You're Looking For</Label>
              <Textarea
                id="lookingFor"
                placeholder="Describe what you hope to gain from this partnership..."
                rows={3}
                value={formData.lookingFor}
                onChange={(e) => setFormData(prev => ({ ...prev, lookingFor: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration/Timeline</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 3 months, ongoing, one-time"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensation">Commission/Compensation ($ amount)</Label>
                <Input
                  id="compensation"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 500, 1000"
                  value={formData.compensation}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Enter flat rate amount (numbers only)</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="personalMessage">Personal Message to Partner</Label>
                <span className={`text-xs ${wordCount > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {wordCount} / 500 words
                </span>
              </div>
              <Textarea
                id="personalMessage"
                placeholder="Write a personal message explaining why you'd like to partner with them..."
                rows={5}
                value={formData.personalMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, personalMessage: e.target.value }))}
              />
            </div>
          </div>

          {/* Your Portal Information - MOVED TO BOTTOM */}
          <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">Your Portal Information (Auto-filled from Profile)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="coreDemographic">Core Demographic</Label>
              <Input
                id="coreDemographic"
                placeholder="e.g., Ages 25-34, Urban professionals, Creative industry workers"
                value={formData.coreDemographic}
                onChange={(e) => setFormData(prev => ({ ...prev, coreDemographic: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">This should come from your demographics data</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="genderMale">Male %</Label>
                <Input
                  id="genderMale"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.genderMale}
                  onChange={(e) => setFormData(prev => ({ ...prev, genderMale: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genderFemale">Female %</Label>
                <Input
                  id="genderFemale"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.genderFemale}
                  onChange={(e) => setFormData(prev => ({ ...prev, genderFemale: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genderOther">Other %</Label>
                <Input
                  id="genderOther"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.genderOther}
                  onChange={(e) => setFormData(prev => ({ ...prev, genderOther: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryLocation">Primary Country/Region</Label>
              <Input
                id="primaryLocation"
                placeholder="Your location"
                value={formData.primaryLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryLocation: e.target.value }))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Auto-filled from your profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audienceBehaviors">Your Audience Behaviors</Label>
              <Textarea
                id="audienceBehaviors"
                placeholder="Describe key behavioral patterns of your audience..."
                rows={3}
                value={formData.audienceBehaviors}
                onChange={(e) => setFormData(prev => ({ ...prev, audienceBehaviors: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">This should come from your analytics</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="standsFor">What You Stand For</Label>
              <div className="flex flex-wrap gap-2">
                {formData.standsFor.map((tag, idx) => (
                  <Badge key={idx} variant="default" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag('standsFor', idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  id="standsFor"
                  placeholder="Add a value and press Enter"
                  value={standsForInput}
                  onChange={(e) => setStandsForInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag('standsFor', standsForInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddTag('standsFor', standsForInput)}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Auto-filled from your ethos/profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avoids">What You Avoid</Label>
              <div className="flex flex-wrap gap-2">
                {formData.avoids.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag('avoids', idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  id="avoids"
                  placeholder="Add a boundary and press Enter"
                  value={avoidsInput}
                  onChange={(e) => setAvoidsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag('avoids', avoidsInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddTag('avoids', avoidsInput)}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Auto-filled from your ethos/profile</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
