import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderEmailContent, getVariablesByCategory } from "@/utils/emailVariables";
import { Copy, Check } from "lucide-react";

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
