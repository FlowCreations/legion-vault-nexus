import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, TrendingUp, Users, Sparkles, DollarSign, Target, Zap } from "lucide-react";
import { toast } from "sonner";

interface Avatar {
  id: string;
  avatar_name: string;
  description: string;
  confidence_score: number;
  member_count: number;
  core_demographic: any;
  psychographic_personality: any;
  behavioral_patterns: any;
  emotional_energy_profile: any;
  cultural_symbolic_affinities: any;
  socioeconomic_context: any;
  experiential_aspirational: any;
  predictive_signals: any;
  conversion_predictions: any;
}

export default function AvatarArchetypes() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avatar_archetypes')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      setAvatars(data || []);
      if (data && data.length > 0) {
        setSelectedAvatar(data[0]);
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-avatar-archetypes');
      
      if (error) throw error;
      
      toast.success(`Generated ${data.count} avatar archetypes!`);
      await fetchAvatars();
    } catch (error: any) {
      console.error('Error generating avatars:', error);
      toast.error('Failed to generate avatars: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const getArchetypeColor = (archetype: string) => {
    const colors: Record<string, string> = {
      'Warrior': 'hsl(0, 70%, 50%)',
      'Healer': 'hsl(120, 50%, 50%)',
      'Visionary': 'hsl(260, 60%, 60%)',
      'Lover': 'hsl(340, 70%, 55%)',
      'Creator': 'hsl(30, 70%, 50%)',
      'Rebel': 'hsl(300, 60%, 50%)',
      'Sage': 'hsl(200, 50%, 50%)',
      'Magician': 'hsl(280, 65%, 55%)',
    };
    return colors[archetype] || 'hsl(var(--primary))';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading avatar intelligence...</p>
        </div>
      </div>
    );
  }

  if (avatars.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Brain className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
        <h3 className="text-2xl font-bold mb-3">No Personality Data Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Generate personality profiles for your members to enable AI-powered engagement.
          We'll analyze behavioral data, interests, and emotional patterns to create detailed avatar archetypes.
        </p>
        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          size="lg"
          className="bg-gradient-to-r from-primary via-accent to-primary-glow"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Generating Avatars...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Personality Profiles
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {avatars.map((avatar) => (
          <Card
            key={avatar.id}
            className={`p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedAvatar?.id === avatar.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedAvatar(avatar)}
            style={{
              borderTopColor: getArchetypeColor(avatar.emotional_energy_profile?.energy_archetype || 'Warrior'),
              borderTopWidth: '4px',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{avatar.avatar_name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {avatar.description}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className="ml-2"
                style={{
                  backgroundColor: `${getArchetypeColor(avatar.emotional_energy_profile?.energy_archetype || 'Warrior')}20`,
                  color: getArchetypeColor(avatar.emotional_energy_profile?.energy_archetype || 'Warrior'),
                }}
              >
                {avatar.emotional_energy_profile?.energy_archetype || 'Unknown'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-card/50 rounded-lg">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold">{avatar.member_count}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="text-center p-3 bg-card/50 rounded-lg">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-accent" />
                <div className="text-2xl font-bold">
                  {Math.round(avatar.conversion_predictions?.conversion_probability * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <Badge variant="outline">
                {avatar.psychographic_personality?.mbti_type || 'N/A'}
              </Badge>
              <Badge variant="outline">
                {avatar.core_demographic?.age_range || 'Unknown'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Avatar Details */}
      {selectedAvatar && (
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{selectedAvatar.avatar_name}</h2>
              <p className="text-muted-foreground">{selectedAvatar.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(selectedAvatar.confidence_score * 100)}%
              </div>
            </div>
          </div>

          <Tabs defaultValue="psychographic" className="mt-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="psychographic">
                <Brain className="h-4 w-4 mr-2" />
                Personality
              </TabsTrigger>
              <TabsTrigger value="behavioral">
                <Zap className="h-4 w-4 mr-2" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="emotional">
                <Heart className="h-4 w-4 mr-2" />
                Emotional
              </TabsTrigger>
              <TabsTrigger value="conversion">
                <Target className="h-4 w-4 mr-2" />
                Conversion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="psychographic" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Core Personality
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">MBTI Type</span>
                      <Badge>{selectedAvatar.psychographic_personality?.mbti_type}</Badge>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Love Language</span>
                      <span className="font-medium">{selectedAvatar.psychographic_personality?.love_language}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Motivation</span>
                      <span className="font-medium">{selectedAvatar.psychographic_personality?.motivation_driver}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Conflict Style</span>
                      <span className="font-medium">{selectedAvatar.psychographic_personality?.conflict_style}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Big Five Traits</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedAvatar.psychographic_personality?.big_five || {}).map(([trait, value]: [string, any]) => (
                      <div key={trait}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{trait}</span>
                          <span className="font-medium">{Math.round(value * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-sm font-semibold text-destructive mb-1">Core Fear</div>
                  <div>{selectedAvatar.psychographic_personality?.core_fear}</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm font-semibold text-primary mb-1">Core Desire</div>
                  <div>{selectedAvatar.psychographic_personality?.core_desire}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="behavioral" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Avg Listen Time</div>
                  <div className="text-2xl font-bold">{selectedAvatar.behavioral_patterns?.avg_listen_time_min?.toFixed(1)} min</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Replay Rate</div>
                  <div className="text-2xl font-bold">{Math.round((selectedAvatar.behavioral_patterns?.replay_rate || 0) * 100)}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Engagement</div>
                  <div className="text-2xl font-bold">{Math.round((selectedAvatar.behavioral_patterns?.engagement_stability || 0) * 100)}%</div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Engagement Patterns</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Comment Tone</span>
                      <Badge variant="outline">{selectedAvatar.behavioral_patterns?.comment_tone}</Badge>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Purchase Style</span>
                      <span className="font-medium capitalize">{selectedAvatar.behavioral_patterns?.purchase_cadence}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Ad Response</span>
                      <span className="font-medium capitalize">{selectedAvatar.behavioral_patterns?.ad_click_type}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Active Hours</span>
                      <span className="font-medium capitalize">{selectedAvatar.behavioral_patterns?.active_hours}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Platform Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAvatar.behavioral_patterns?.preferred_platforms?.map((platform: string) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="emotional" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Emotional Profile
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-card/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Dominant Emotions</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedAvatar.emotional_energy_profile?.dominant_emotions?.map((emotion: string) => (
                          <Badge key={emotion} variant="outline">{emotion}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Intensity</div>
                        <div className="text-xl font-bold">
                          {Math.round((selectedAvatar.emotional_energy_profile?.emotional_intensity || 0) * 100)}%
                        </div>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Consistency</div>
                        <div className="text-xl font-bold">
                          {Math.round((selectedAvatar.emotional_energy_profile?.sentiment_consistency || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Journey & Theme</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-sm font-semibold text-primary mb-1">Energy Archetype</div>
                      <div className="text-lg font-bold">{selectedAvatar.emotional_energy_profile?.energy_archetype}</div>
                    </div>
                    <div className="p-4 bg-card/50 rounded-lg">
                      <div className="text-sm font-semibold mb-1">Journey Stage</div>
                      <div>{selectedAvatar.emotional_energy_profile?.emotional_journey_stage}</div>
                    </div>
                    <div className="p-4 bg-card/50 rounded-lg">
                      <div className="text-sm font-semibold mb-1">Healing Theme</div>
                      <div className="text-sm">{selectedAvatar.emotional_energy_profile?.healing_theme}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Aspirations & Limitations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-card/50 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Life Stage</div>
                    <Badge className="capitalize">{selectedAvatar.experiential_aspirational?.life_stage}</Badge>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-sm font-semibold text-primary mb-2">Core Aspiration</div>
                    <div className="capitalize">{selectedAvatar.experiential_aspirational?.core_aspiration}</div>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="text-sm font-semibold text-destructive mb-2">Limiting Emotion</div>
                    <div className="capitalize">{selectedAvatar.experiential_aspirational?.limiting_emotion}</div>
                  </div>
                  <div className="p-4 bg-card/50 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Dream Identity</div>
                    <div className="text-sm">{selectedAvatar.experiential_aspirational?.dream_identity}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <DollarSign className="h-5 w-5 mb-2 text-primary" />
                  <div className="text-sm text-muted-foreground mb-1">Est. LTV</div>
                  <div className="text-2xl font-bold">
                    ${selectedAvatar.conversion_predictions?.avg_customer_value_est?.toFixed(2)}
                  </div>
                </Card>
                <Card className="p-4">
                  <Target className="h-5 w-5 mb-2 text-accent" />
                  <div className="text-sm text-muted-foreground mb-1">Conversion</div>
                  <div className="text-2xl font-bold">
                    {Math.round((selectedAvatar.conversion_predictions?.conversion_probability || 0) * 100)}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Best CTA</div>
                  <Badge className="text-base">{selectedAvatar.conversion_predictions?.best_cta_type}</Badge>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Channel</div>
                  <Badge variant="outline" className="text-base">
                    {selectedAvatar.conversion_predictions?.best_follow_up_channel}
                  </Badge>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Optimal Strategy</h4>
                  <div className="space-y-2">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-sm font-semibold text-primary mb-1">Ad Tone</div>
                      <div className="capitalize">{selectedAvatar.conversion_predictions?.optimal_ad_tone}</div>
                    </div>
                    <div className="p-4 bg-card/50 rounded-lg">
                      <div className="text-sm font-semibold mb-1">Funnel Entry</div>
                      <div>{selectedAvatar.conversion_predictions?.best_funnel_entry}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Demographic Context</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Income Band</span>
                      <span className="font-medium">{selectedAvatar.socioeconomic_context?.income_band_inferred}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Education</span>
                      <span className="font-medium">{selectedAvatar.socioeconomic_context?.education_level_inferred}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-card/50 rounded-lg">
                      <span className="text-sm">Career Field</span>
                      <span className="font-medium capitalize">{selectedAvatar.socioeconomic_context?.career_field_cluster}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Regenerate Button */}
      <div className="text-center pt-6">
        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          variant="outline"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Regenerating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Avatars
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
