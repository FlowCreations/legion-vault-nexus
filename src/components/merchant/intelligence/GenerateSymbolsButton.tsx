import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GenerateSymbolsButton() {
  const [generating, setGenerating] = useState(false);

  const generateSymbols = async () => {
    setGenerating(true);
    toast.info('Generating luxurious symbols...', { description: 'This may take 30-60 seconds' });

    try {
      const symbolTypes = ['epiphany', 'oracle', 'catalyst'];
      
      for (const symbolType of symbolTypes) {
        const { data, error } = await supabase.functions.invoke('generate-intelligence-symbols', {
          body: { symbolType }
        });

        if (error) throw error;

        if (data?.imageUrl) {
          // Download and save the image
          const base64Data = data.imageUrl.split(',')[1];
          const blob = await fetch(data.imageUrl).then(r => r.blob());
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${symbolType}-symbol.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success(`${symbolType.charAt(0).toUpperCase() + symbolType.slice(1)} symbol generated!`);
        }
      }

      toast.success('All symbols generated successfully!', {
        description: 'Please upload the downloaded images to replace the current symbols'
      });

    } catch (error: any) {
      console.error('Error generating symbols:', error);
      toast.error('Failed to generate symbols', {
        description: error.message
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateSymbols}
      disabled={generating}
      variant="outline"
      className="gap-2"
    >
      <Sparkles className="w-4 h-4" />
      {generating ? 'Generating Premium Symbols...' : 'Generate Luxury Symbols'}
    </Button>
  );
}
