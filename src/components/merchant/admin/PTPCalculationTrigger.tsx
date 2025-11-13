import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const PTPCalculationTrigger = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const calculatePTPScores = async () => {
    setIsCalculating(true);
    setResults(null);
    
    try {
      console.log('Starting PTP calculation for all users...');
      
      const { data, error } = await supabase.functions.invoke('compute-ptp-scores-daily', {
        body: {}
      });

      if (error) throw error;

      console.log('PTP calculation results:', data);
      setResults(data);

      toast({
        title: 'PTP Scores Calculated',
        description: `Processed ${data.processed} users successfully`,
      });
    } catch (error) {
      console.error('Error calculating PTP scores:', error);
      toast({
        title: 'Calculation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculate PTP Scores</CardTitle>
        <CardDescription>
          Compute current PTP scores for all active members in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={calculatePTPScores} 
          disabled={isCalculating}
          className="w-full"
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run PTP Calculation
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Results</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Processed:</div>
              <div className="font-medium">{results.processed}</div>
              
              <div>Errors:</div>
              <div className="font-medium text-red-500">{results.errors}</div>
              
              <div>Streaks Updated:</div>
              <div className="font-medium">{results.streaksUpdated}</div>
              
              <div>Timestamp:</div>
              <div className="text-xs text-muted-foreground">
                {new Date(results.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {results && results.errors > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium">Some users failed to process</div>
              <div className="text-muted-foreground">
                Check edge function logs for details
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
