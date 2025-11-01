import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderEmailContent, getVariablesByCategory } from "@/utils/emailVariables";
import { validateChristConsciousness, calculateEthosScore } from "@/lib/christConsciousEthos";
import { Copy, Check, Sparkles, AlertTriangle } from "lucide-react";

interface EmailTemplateEditorProps {
  subject: string;
  previewText: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onPreviewTextChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}

export function EmailTemplateEditor({
  subject,
  previewText,
  body,
  onSubjectChange,
  onPreviewTextChange,
  onBodyChange,
}: EmailTemplateEditorProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const variableCategories = getVariablesByCategory();

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sampleUserData = {
    display_name: "John Doe",
    email: "john@example.com",
    ptp_score: 75,
    era_label: "Invested",
    total_spend: 125.50,
    last_purchase_date: "2025-03-15",
    favorite_track: "Running Wild",
    city: "Nashville",
    state: "Tennessee",
  };

  const renderedPreview = renderEmailContent(body, sampleUserData);
  const christConsciousValidation = validateChristConsciousness(body);
  const ethosScore = calculateEthosScore(christConsciousValidation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Section */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Enter email subject..."
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {subject.length}/100 characters (optimal: 40-60)
              </p>
            </div>

            <div>
              <Label htmlFor="preview">Preview Text</Label>
              <Input
                id="preview"
                value={previewText}
                onChange={(e) => onPreviewTextChange(e.target.value)}
                placeholder="This appears in inbox preview..."
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {previewText.length}/150 characters
              </p>
            </div>

            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="Write your email content here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Personalization Tokens */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Personalization Tokens</h3>
          <Tabs defaultValue={variableCategories[0]?.category.toLowerCase()}>
            <TabsList className="grid w-full grid-cols-4">
              {variableCategories.map((cat) => (
                <TabsTrigger key={cat.category} value={cat.category.toLowerCase()}>
                  {cat.category}
                </TabsTrigger>
              ))}
            </TabsList>
            {variableCategories.map((cat) => (
              <TabsContent key={cat.category} value={cat.category.toLowerCase()} className="space-y-2 mt-3">
                {cat.variables.map((variable) => (
                  <div key={variable.key} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{variable.label}</p>
                      <p className="text-xs text-muted-foreground">Example: {variable.example}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToken(variable.token)}
                    >
                      {copiedToken === variable.token ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        {/* Christ-Conscious Validation */}
        <Card className="p-4 border-l-4" style={{ borderColor: christConsciousValidation.passes ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Christ-Conscious Alignment
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Ethos Score</span>
              <Badge variant={ethosScore >= 75 ? "default" : ethosScore >= 50 ? "secondary" : "destructive"}>
                {ethosScore}/100
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={christConsciousValidation.scores.loveFirst ? "text-green-600" : "text-muted-foreground"}>
                {christConsciousValidation.scores.loveFirst ? "✓" : "○"} Love First
              </div>
              <div className={christConsciousValidation.scores.empowerment ? "text-green-600" : "text-muted-foreground"}>
                {christConsciousValidation.scores.empowerment ? "✓" : "○"} Empowerment
              </div>
              <div className={christConsciousValidation.scores.truthBased ? "text-green-600" : "text-muted-foreground"}>
                {christConsciousValidation.scores.truthBased ? "✓" : "○"} Truth-Based
              </div>
              <div className={christConsciousValidation.scores.manipulation ? "text-green-600" : "text-red-600"}>
                {christConsciousValidation.scores.manipulation ? "✓" : "✗"} No Manipulation
              </div>
            </div>

            {!christConsciousValidation.passes && (
              <div className="pt-2 border-t space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Suggestions:
                </p>
                {christConsciousValidation.suggestions.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {s}</p>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Live Preview
            <Badge variant="outline" className="text-xs">Sample Data</Badge>
          </h3>
          
          <div className="border rounded-lg p-4 bg-background">
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                <p className="font-semibold">{renderEmailContent(subject, sampleUserData)}</p>
              </div>

              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground mb-1">Preview Text:</p>
                <p className="text-sm text-muted-foreground">{renderEmailContent(previewText, sampleUserData)}</p>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{renderedPreview}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
