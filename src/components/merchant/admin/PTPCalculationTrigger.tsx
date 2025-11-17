import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const PTPCalculationTrigger = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResults, setEnrichResults] = useState<any>(null);
  const [isAnalyzingPayday, setIsAnalyzingPayday] = useState(false);
  const [paydayResults, setPaydayResults] = useState<any>(null);
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

  const enrichEconomicData = async () => {
    setIsEnriching(true);
    setEnrichResults(null);
    
    try {
      console.log('Starting economic data enrichment...');
      
      const { data, error } = await supabase.functions.invoke('enrich-user-economic-data', {
        body: { enrichAll: true }
      });

      if (error) throw error;

      console.log('Economic enrichment results:', data);
      setEnrichResults(data);

      toast({
        title: 'Economic Data Enriched',
        description: `Enriched ${data.enriched} users successfully`,
      });
    } catch (error) {
      console.error('Error enriching economic data:', error);
      toast({
        title: 'Enrichment Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const analyzePaydayPatterns = async () => {
    setIsAnalyzingPayday(true);
    setPaydayResults(null);
    
    try {
      console.log('Starting payday pattern analysis...');
      
      const { data, error } = await supabase.functions.invoke('analyze-payday-patterns', {
        body: { analyzeAll: true }
      });

      if (error) throw error;

      console.log('Payday analysis results:', data);
      setPaydayResults(data);

      toast({
        title: 'Payday Patterns Analyzed',
        description: `Analyzed ${data.analyzed} users, detected ${data.results?.length || 0} patterns`,
      });
    } catch (error) {
      console.error('Error analyzing payday patterns:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingPayday(false);
    }
  };

  return (
    <div className="space-y-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Economic Data Enrichment</CardTitle>
          <CardDescription>
            Enrich user profiles with income estimates and purchasing power based on area codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={enrichEconomicData} 
            disabled={isEnriching}
            className="w-full"
          >
            {isEnriching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Enrich Economic Data
              </>
            )}
          </Button>

          {enrichResults && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Results</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Enriched:</div>
                <div className="font-medium">{enrichResults.enriched}</div>
                
                <div>Skipped (no phone):</div>
                <div className="font-medium text-muted-foreground">{enrichResults.skipped}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payday Pattern Analysis</CardTitle>
          <CardDescription>
            Analyze purchase timing to detect when users typically get paid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={analyzePaydayPatterns} 
            disabled={isAnalyzingPayday}
            className="w-full"
          >
            {isAnalyzingPayday ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Analyze Payday Patterns
              </>
            )}
          </Button>

          {paydayResults && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Results</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Users Analyzed:</div>
                <div className="font-medium">{paydayResults.analyzed}</div>
                
                <div>Patterns Detected:</div>
                <div className="font-medium text-green-500">
                  {paydayResults.results?.length || 0}
                </div>
              </div>
              
              {paydayResults.results && paydayResults.results.length > 0 && (
                <div className="mt-3 space-y-1 text-xs">
                  <div className="font-medium">Sample Patterns:</div>
                  {paydayResults.results.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="text-muted-foreground">
                      • Day {r.primaryPayday}
                      {r.secondaryPayday && ` & ${r.secondaryPayday}`}
                      {' '}({r.payrollCycle}, {r.confidence}% confidence)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
