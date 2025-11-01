import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getMBTIDescription, getPersonalityColor } from "@/lib/personalityRules";
import type { PersonalityProfile } from "@/types/personality";

interface PersonalityProfileViewProps {
  profile: PersonalityProfile;
}

export const PersonalityProfileView = ({ profile }: PersonalityProfileViewProps) => {
  const dimensions = [
    { label: 'Extraverted', value: profile.p_e * 100, opposite: 'Introverted' },
    { label: 'Sensing', value: profile.p_s * 100, opposite: 'Intuitive' },
    { label: 'Thinking', value: profile.p_t * 100, opposite: 'Feeling' },
    { label: 'Judging', value: profile.p_j * 100, opposite: 'Perceiving' },
  ];

  const confidenceLevel = profile.confidence_score >= 0.7 ? 'High' : profile.confidence_score >= 0.5 ? 'Medium' : 'Low';
  const confidenceColor = profile.confidence_score >= 0.7 ? 'bg-green-500' : profile.confidence_score >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500';

  return (
    <div className="space-y-6">
      {/* MBTI Type Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl" style={{ color: profile.mbti_type ? getPersonalityColor(profile.mbti_type) : undefined }}>
                {profile.mbti_type || 'Unknown'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {profile.mbti_type ? getMBTIDescription(profile.mbti_type) : 'No personality type determined yet'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Confidence</div>
              <Badge className={confidenceColor}>
                {confidenceLevel} ({Math.round(profile.confidence_score * 100)}%)
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Personality Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Personality Dimensions</CardTitle>
          <CardDescription>Behavioral and survey-based personality indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={dim.value > 50 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {dim.label}
                </span>
                <span className={dim.value < 50 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {dim.opposite}
                </span>
              </div>
              <div className="relative">
                <Progress value={dim.value} className="h-3" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                {Math.round(dim.value)}% - {Math.round(100 - dim.value)}%
              </div>
            </div>
          ))}

          {/* Assertiveness */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>Assertiveness</span>
              <span className="font-semibold">{Math.round(profile.assertiveness * 100)}%</span>
            </div>
            <Progress value={profile.assertiveness * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Survey Responses */}
      {profile.survey_responses && Object.keys(profile.survey_responses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Survey Responses</CardTitle>
            <CardDescription>Raw responses from personality survey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(profile.survey_responses).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="font-medium text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-foreground">
                    {String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Last Computed</div>
            <div className="font-medium">
              {new Date(profile.last_computed).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Profile Created</div>
            <div className="font-medium">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};