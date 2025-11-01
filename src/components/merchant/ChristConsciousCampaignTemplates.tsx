import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Eye, Compass } from "lucide-react";

interface Template {
  id: string;
  name: string;
  icon: any;
  personalityType: string;
  subject: string;
  opening: string;
  bodyFocus: string[];
  cta: string;
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'feeling',
    name: 'Feeling (F) Template',
    icon: Heart,
    personalityType: 'INFP, ENFP, INFJ, ENFJ, ISFP, ESFP, ISFJ, ESFJ',
    subject: 'You matter to us - here\'s why',
    opening: 'Your energy in this community is a gift we don\'t take for granted.',
    bodyFocus: ['Belonging', 'Impact', 'Gratitude', 'Heart-centered connection'],
    cta: 'Join us if it feels aligned',
    color: 'hsl(var(--chart-1))'
  },
  {
    id: 'thinking',
    name: 'Thinking (T) Template',
    icon: Brain,
    personalityType: 'INTP, ENTP, INTJ, ENTJ, ISTP, ESTP, ISTJ, ESTJ',
    subject: 'The truth about [offer] - no games',
    opening: 'We respect your intelligence. Here\'s what this actually is:',
    bodyFocus: ['Value breakdown', 'Transparency', 'Logic', 'Guarantees'],
    cta: 'Decide if this serves you',
    color: 'hsl(var(--chart-2))'
  },
  {
    id: 'intuitive',
    name: 'Intuitive (N) Template',
    icon: Eye,
    personalityType: 'INFP, ENFP, INFJ, ENFJ, INTP, ENTP, INTJ, ENTJ',
    subject: 'The next chapter of our journey',
    opening: 'We\'re building something that transcends the ordinary.',
    bodyFocus: ['Vision', 'Meaning', 'Movement', 'Future possibilities'],
    cta: 'Explore what\'s possible',
    color: 'hsl(var(--chart-3))'
  },
  {
    id: 'sensing',
    name: 'Sensing (S) Template',
    icon: Compass,
    personalityType: 'ISFP, ESFP, ISFJ, ESFJ, ISTP, ESTP, ISTJ, ESTJ',
    subject: 'Here\'s exactly what you get',
    opening: 'No fluff. Just the real details you care about.',
    bodyFocus: ['Specifications', 'Shipping details', 'Sizing', 'Guarantees'],
    cta: 'See what\'s included',
    color: 'hsl(var(--chart-4))'
  }
];

interface ChristConsciousCampaignTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export function ChristConsciousCampaignTemplates({ onSelectTemplate }: ChristConsciousCampaignTemplatesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Christ-Conscious Campaign Templates</h2>
        <p className="text-muted-foreground mt-1">
          Personality-segmented templates built on love, truth, and empowerment
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="border-l-4" style={{ borderLeftColor: template.color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: template.color }} />
                  {template.name}
                </CardTitle>
                <CardDescription>
                  For: {template.personalityType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Subject Line:</p>
                  <p className="text-sm font-medium">{template.subject}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Opening:</p>
                  <p className="text-sm italic">"{template.opening}"</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Body Focus:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.bodyFocus.map((focus, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Call to Action:</p>
                  <p className="text-sm font-medium">{template.cta}</p>
                </div>

                <Button 
                  onClick={() => onSelectTemplate(template)} 
                  className="w-full mt-2"
                  variant="outline"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Christ-Conscious Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✨ <strong>Love First:</strong> Start with gratitude and acknowledgment</p>
          <p>🙏 <strong>Truth with Compassion:</strong> Speak clearly without manipulation</p>
          <p>💪 <strong>Empowerment:</strong> Honor their power to choose</p>
          <p>🌟 <strong>Light:</strong> Illuminate their path, don't push them down it</p>
        </CardContent>
      </Card>
    </div>
  );
}
