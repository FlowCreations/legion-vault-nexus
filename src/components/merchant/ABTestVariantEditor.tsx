import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface Variant {
  name: string;
  subject: string;
  body: string;
  percentage: number;
}

interface ABTestVariantEditorProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
}

export const ABTestVariantEditor = ({ variants, onVariantsChange }: ABTestVariantEditorProps) => {
  const addVariant = () => {
    const newPercentage = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map(v => ({ ...v, percentage: newPercentage }));
    
    onVariantsChange([
      ...updatedVariants,
      {
        name: String.fromCharCode(65 + variants.length),
        subject: '',
        body: '',
        percentage: newPercentage
      }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    
    const updated = variants.filter((_, i) => i !== index);
    const newPercentage = Math.floor(100 / updated.length);
    onVariantsChange(updated.map(v => ({ ...v, percentage: newPercentage })));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onVariantsChange(updated);
  };

  return (
    <div className="space-y-4">
      {variants.map((variant, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Variant {variant.name}</h4>
              <Badge variant="secondary">{variant.percentage}% of audience</Badge>
            </div>
            {variants.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label>Subject Line</Label>
              <Input
                value={variant.subject}
                onChange={(e) => updateVariant(index, 'subject', e.target.value)}
                placeholder="Enter subject line..."
              />
            </div>
            
            <div>
              <Label>Email Body</Label>
              <Textarea
                value={variant.body}
                onChange={(e) => updateVariant(index, 'body', e.target.value)}
                placeholder="Enter email content..."
                rows={8}
              />
            </div>
          </div>
        </Card>
      ))}
      
      {variants.length < 4 && (
        <Button variant="outline" onClick={addVariant} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Variant {String.fromCharCode(65 + variants.length)}
        </Button>
      )}
    </div>
  );
};
