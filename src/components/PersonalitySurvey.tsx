import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PersonalitySurveyProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalitySurvey = ({ isOpen, onClose }: PersonalitySurveyProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    birthday: "",
    higherPower: "",
    zodiacSign: "",
    socialPreference: "",
    decisionMaking: "",
    planningStyle: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Store survey responses
      await supabase.from('user_events').insert({
        event_type: 'personality_survey_completed',
        event_data: formData,
        user_id: user?.id || null,
        session_id: sessionStorage.getItem('sol_session_id'),
        page_url: window.location.pathname,
      });

      // Calculate initial personality indicators from survey
      const personalityIndicators = {
        // E/I: Social preference
        p_e: formData.socialPreference === 'group' ? 0.7 : 0.3,
        p_i: formData.socialPreference === 'alone' ? 0.7 : 0.3,
        // S/N: Based on planning style
        p_s: formData.planningStyle === 'detailed' ? 0.7 : 0.3,
        p_n: formData.planningStyle === 'flexible' ? 0.7 : 0.3,
        // T/F: Decision making
        p_t: formData.decisionMaking === 'logic' ? 0.7 : 0.3,
        p_f: formData.decisionMaking === 'feelings' ? 0.7 : 0.3,
        // J/P: Planning style
        p_j: formData.planningStyle === 'detailed' ? 0.7 : 0.3,
        p_p: formData.planningStyle === 'flexible' ? 0.7 : 0.3,
        assertiveness: formData.decisionMaking === 'logic' ? 0.6 : 0.5,
      };

      // Store initial personality prediction if user is logged in
      if (user?.id) {
        await supabase.functions.invoke('predict-personality', {
          body: { userId: user.id }
        });
      }

      toast.success("Thanks for completing the survey! Enjoy 50% off digital items.");
      onClose();
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error("Failed to submit survey");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Where are you from?</Label>
              <Input
                id="location"
                placeholder="City, State or Country"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="birthday">Birthday (Optional)</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">Do you believe in a higher power?</Label>
              <RadioGroup value={formData.higherPower} onValueChange={(val) => setFormData({ ...formData, higherPower: val })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="higher-yes" />
                  <Label htmlFor="higher-yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="higher-no" />
                  <Label htmlFor="higher-no" className="font-normal cursor-pointer">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="higher-unsure" />
                  <Label htmlFor="higher-unsure" className="font-normal cursor-pointer">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">What's your zodiac sign?</Label>
              <Input
                placeholder="e.g., Aries, Taurus, Gemini..."
                value={formData.zodiacSign}
                onChange={(e) => setFormData({ ...formData, zodiacSign: e.target.value })}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">When recharging, do you prefer...</Label>
              <RadioGroup value={formData.socialPreference} onValueChange={(val) => setFormData({ ...formData, socialPreference: val })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="social-group" />
                  <Label htmlFor="social-group" className="font-normal cursor-pointer">Being around people</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alone" id="social-alone" />
                  <Label htmlFor="social-alone" className="font-normal cursor-pointer">Spending time alone</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">When making decisions, you rely more on...</Label>
              <RadioGroup value={formData.decisionMaking} onValueChange={(val) => setFormData({ ...formData, decisionMaking: val })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="logic" id="decision-logic" />
                  <Label htmlFor="decision-logic" className="font-normal cursor-pointer">Logic and facts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feelings" id="decision-feelings" />
                  <Label htmlFor="decision-feelings" className="font-normal cursor-pointer">Feelings and values</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">Do you prefer...</Label>
              <RadioGroup value={formData.planningStyle} onValueChange={(val) => setFormData({ ...formData, planningStyle: val })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="plan-detailed" />
                  <Label htmlFor="plan-detailed" className="font-normal cursor-pointer">Detailed plans and structure</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="plan-flexible" />
                  <Label htmlFor="plan-flexible" className="font-normal cursor-pointer">Flexibility and spontaneity</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.location.length > 0;
      case 2:
        return formData.higherPower.length > 0;
      case 3:
        return formData.socialPreference && formData.decisionMaking && formData.planningStyle;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎁 Unlock 50% Off Digital Items</DialogTitle>
          <DialogDescription className="text-base">
            Help us personalize your experience! Complete this quick survey to unlock exclusive discounts on all digital content.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {renderStep()}
        </div>

        <div className="flex justify-between gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="ml-auto"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="ml-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Unlock Discount'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
