import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    birthdayMonth: "",
    birthdayDay: "",
    musicConnection: "",
    replayDriver: "",
    coreIdentity: "",
    artistLoyalty: "",
    purchaseDriver: "",
    experiencePreference: "",
  });

  const calculatePersonalityScores = () => {
    const scores = {
      p_e: 0.5, p_i: 0.5,
      p_s: 0.5, p_n: 0.5,
      p_t: 0.5, p_f: 0.5,
      p_j: 0.5, p_p: 0.5,
      assertiveness: 0.5
    };

    // E/I from questions 1 and 6
    if (formData.musicConnection === 'share_friends') scores.p_e += 0.3;
    if (formData.musicConnection === 'listen_alone') scores.p_i += 0.3;
    if (formData.experiencePreference === 'live_shows') scores.p_e += 0.2;
    if (formData.experiencePreference === 'listening_sessions') scores.p_i += 0.2;
    if (formData.experiencePreference === 'depends') {
      scores.p_e += 0.1;
      scores.p_i += 0.1;
    }

    // S/N from questions 2 and 3
    if (formData.replayDriver === 'rhythm_production') scores.p_s += 0.25;
    if (formData.replayDriver === 'energy_mood') scores.p_n += 0.25;
    if (formData.coreIdentity === 'real_stories') scores.p_s += 0.25;
    if (formData.coreIdentity === 'ideas_vision') scores.p_n += 0.25;

    // T/F from questions 1, 2, and 5
    if (formData.musicConnection === 'study_lyrics') scores.p_t += 0.2;
    if (formData.musicConnection === 'feel_deeply') scores.p_f += 0.2;
    if (formData.replayDriver === 'message_lyrics') scores.p_t += 0.2;
    if (formData.replayDriver === 'emotion_story') scores.p_f += 0.2;
    if (formData.purchaseDriver === 'values') scores.p_f += 0.2;
    if (formData.purchaseDriver === 'quality_unique') scores.p_t += 0.2;

    // J/P from questions 4 and 5
    if (formData.artistLoyalty === 'consistency') scores.p_j += 0.25;
    if (formData.artistLoyalty === 'evolution') scores.p_p += 0.25;
    if (formData.purchaseDriver === 'exclusivity') scores.p_j += 0.25;
    if (formData.purchaseDriver === 'gut_feeling') scores.p_p += 0.25;

    // Normalize complementary pairs to sum to 1
    scores.p_i = 1 - scores.p_e;
    scores.p_n = 1 - scores.p_s;
    scores.p_f = 1 - scores.p_t;
    scores.p_p = 1 - scores.p_j;

    // Calculate assertiveness based on decision style
    if (formData.purchaseDriver === 'gut_feeling') scores.assertiveness = 0.7;
    if (formData.artistLoyalty === 'evolution') scores.assertiveness += 0.1;

    return scores;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const scores = calculatePersonalityScores();
      
      // Store birthday in user_profiles if user is logged in
      if (user?.id && formData.birthdayMonth && formData.birthdayDay) {
        const birthdate = `2000-${formData.birthdayMonth.padStart(2, '0')}-${formData.birthdayDay.padStart(2, '0')}`;
        await supabase
          .from('user_profiles')
          .update({ birthdate })
          .eq('user_id', user.id);
      }

      // Store survey event
      await supabase.from('user_events').insert({
        event_type: 'personality_survey_completed',
        event_data: { ...formData, scores },
        user_id: user?.id || null,
        session_id: sessionStorage.getItem('sol_session_id'),
        page_url: window.location.pathname,
      });

      // Calculate MBTI type
      const mbti_type = `${scores.p_e > scores.p_i ? 'E' : 'I'}${scores.p_s > scores.p_n ? 'S' : 'N'}${scores.p_t > scores.p_f ? 'T' : 'F'}${scores.p_j > scores.p_p ? 'J' : 'P'}`;

      // Store personality profile if user is logged in
      if (user?.id) {
        await supabase
          .from('personality_profiles')
          .upsert({
            user_id: user.id,
            ...scores,
            mbti_type,
            confidence_score: 0.65, // Survey-based confidence
            survey_responses: formData,
            last_computed: new Date().toISOString(),
          });

        // Trigger full personality prediction to blend survey + behavioral data
        await supabase.functions.invoke('predict-personality', {
          body: { userId: user.id }
        });
      }

      toast.success("🎁 Thanks! Enjoy 50% off digital items.");
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
              <Label className="text-base mb-3 block">🎂 When's your birthday?</Label>
              <p className="text-sm text-muted-foreground mb-3">We'll send you special birthday offers!</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Select value={formData.birthdayMonth} onValueChange={(val) => setFormData({ ...formData, birthdayMonth: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                        <SelectItem key={month} value={String(idx + 1)}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Day"
                    value={formData.birthdayDay}
                    onChange={(e) => setFormData({ ...formData, birthdayDay: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">🎧 How do you usually connect with music you love?</Label>
            <RadioGroup value={formData.musicConnection} onValueChange={(val) => setFormData({ ...formData, musicConnection: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="listen_alone" id="music-alone" className="mt-1" />
                <Label htmlFor="music-alone" className="font-normal cursor-pointer flex-1">I listen alone and get lost in it</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="share_friends" id="music-share" className="mt-1" />
                <Label htmlFor="music-share" className="font-normal cursor-pointer flex-1">I share it or play it with friends</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="study_lyrics" id="music-study" className="mt-1" />
                <Label htmlFor="music-study" className="font-normal cursor-pointer flex-1">I study the lyrics or sound design</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="feel_deeply" id="music-feel" className="mt-1" />
                <Label htmlFor="music-feel" className="font-normal cursor-pointer flex-1">I feel it deeply and let it move me</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">💭 When a song hits you, what makes you hit replay?</Label>
            <RadioGroup value={formData.replayDriver} onValueChange={(val) => setFormData({ ...formData, replayDriver: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="emotion_story" id="replay-emotion" className="mt-1" />
                <Label htmlFor="replay-emotion" className="font-normal cursor-pointer flex-1">The emotion or story behind it</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="message_lyrics" id="replay-message" className="mt-1" />
                <Label htmlFor="replay-message" className="font-normal cursor-pointer flex-1">The message or lyrics</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="rhythm_production" id="replay-rhythm" className="mt-1" />
                <Label htmlFor="replay-rhythm" className="font-normal cursor-pointer flex-1">The rhythm / production</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="energy_mood" id="replay-energy" className="mt-1" />
                <Label htmlFor="replay-energy" className="font-normal cursor-pointer flex-1">The energy or mood it creates</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">🎨 Which statement describes you best?</Label>
            <RadioGroup value={formData.coreIdentity} onValueChange={(val) => setFormData({ ...formData, coreIdentity: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="ideas_vision" id="core-ideas" className="mt-1" />
                <Label htmlFor="core-ideas" className="font-normal cursor-pointer flex-1">I'm drawn to ideas, meaning, and future vision</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="real_stories" id="core-stories" className="mt-1" />
                <Label htmlFor="core-stories" className="font-normal cursor-pointer flex-1">I connect to real-life stories, details, and authenticity</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">⚡ What do you look for most in a band or artist you follow?</Label>
            <RadioGroup value={formData.artistLoyalty} onValueChange={(val) => setFormData({ ...formData, artistLoyalty: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="consistency" id="loyalty-consistency" className="mt-1" />
                <Label htmlFor="loyalty-consistency" className="font-normal cursor-pointer flex-1">Consistency and a clear message</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="evolution" id="loyalty-evolution" className="mt-1" />
                <Label htmlFor="loyalty-evolution" className="font-normal cursor-pointer flex-1">Creativity and constant evolution</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">🧭 When you're deciding to buy merch or tickets, what influences you most?</Label>
            <RadioGroup value={formData.purchaseDriver} onValueChange={(val) => setFormData({ ...formData, purchaseDriver: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="values" id="purchase-values" className="mt-1" />
                <Label htmlFor="purchase-values" className="font-normal cursor-pointer flex-1">Supporting artists who speak to my values</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="quality_unique" id="purchase-quality" className="mt-1" />
                <Label htmlFor="purchase-quality" className="font-normal cursor-pointer flex-1">The quality or uniqueness of the product</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="exclusivity" id="purchase-exclusive" className="mt-1" />
                <Label htmlFor="purchase-exclusive" className="font-normal cursor-pointer flex-1">Limited edition or exclusivity</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="gut_feeling" id="purchase-gut" className="mt-1" />
                <Label htmlFor="purchase-gut" className="font-normal cursor-pointer flex-1">A gut feeling — if it feels right in the moment</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Label className="text-base mb-3 block">🌍 What describes you best when it comes to experiences?</Label>
            <RadioGroup value={formData.experiencePreference} onValueChange={(val) => setFormData({ ...formData, experiencePreference: val })}>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="live_shows" id="exp-live" className="mt-1" />
                <Label htmlFor="exp-live" className="font-normal cursor-pointer flex-1">I love live shows and shared energy</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="listening_sessions" id="exp-listening" className="mt-1" />
                <Label htmlFor="exp-listening" className="font-normal cursor-pointer flex-1">I prefer deep personal listening sessions</Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="depends" id="exp-depends" className="mt-1" />
                <Label htmlFor="exp-depends" className="font-normal cursor-pointer flex-1">Depends on my mood</Label>
              </div>
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.birthdayMonth && formData.birthdayDay;
      case 2:
        return formData.musicConnection;
      case 3:
        return formData.replayDriver;
      case 4:
        return formData.coreIdentity;
      case 5:
        return formData.artistLoyalty;
      case 6:
        return formData.purchaseDriver;
      case 7:
        return formData.experiencePreference;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎁 Unlock 50% Off Digital Items</DialogTitle>
          <DialogDescription className="text-base">
            Sons of Legion Personality + Fan Survey - Help us personalize your experience!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
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
          {step < 7 ? (
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