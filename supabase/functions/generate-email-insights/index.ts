import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Generating email insights...');
    
    // Get campaign data
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('*')
      .not('analytics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Get email sends data
    const { data: sends } = await supabase
      .from('email_sends')
      .select('*')
      .limit(10000);
    
    // Get ERA/PTP scores
    const { data: scores } = await supabase
      .from('era_ptp_scores_daily')
      .select('*')
      .order('date', { ascending: false })
      .limit(5000);
    
    const insights: any[] = [];
    
    // Insight 1: Optimal Send Time Analysis
    if (sends && sends.length > 0) {
      const sendTimeAnalysis = analyzeSendTimes(sends);
      if (sendTimeAnalysis) {
        insights.push({
          insight_type: 'send_time_optimization',
          insight_title: sendTimeAnalysis.title,
          insight_description: sendTimeAnalysis.description,
          insight_data: sendTimeAnalysis.data,
          confidence_score: sendTimeAnalysis.confidence,
          actionable_steps: sendTimeAnalysis.actions
        });
      }
    }
    
    // Insight 2: Subject Line Patterns
    if (campaigns && campaigns.length > 10) {
      const subjectAnalysis = analyzeSubjectLines(campaigns);
      if (subjectAnalysis) {
        insights.push({
          insight_type: 'subject_line_optimization',
          insight_title: subjectAnalysis.title,
          insight_description: subjectAnalysis.description,
          insight_data: subjectAnalysis.data,
          confidence_score: subjectAnalysis.confidence,
          actionable_steps: subjectAnalysis.actions
        });
      }
    }
    
    // Insight 3: High-Value Segment Identification
    if (scores && scores.length > 0) {
      const segmentAnalysis = analyzeHighValueSegments(scores, sends || []);
      if (segmentAnalysis) {
        insights.push({
          insight_type: 'segment_opportunity',
          insight_title: segmentAnalysis.title,
          insight_description: segmentAnalysis.description,
          insight_data: segmentAnalysis.data,
          confidence_score: segmentAnalysis.confidence,
          actionable_steps: segmentAnalysis.actions
        });
      }
    }
    
    // Insight 4: Engagement Trend
    if (campaigns && campaigns.length > 5) {
      const trendAnalysis = analyzeEngagementTrend(campaigns);
      if (trendAnalysis) {
        insights.push({
          insight_type: 'engagement_trend',
          insight_title: trendAnalysis.title,
          insight_description: trendAnalysis.description,
          insight_data: trendAnalysis.data,
          confidence_score: trendAnalysis.confidence,
          actionable_steps: trendAnalysis.actions
        });
      }
    }
    
    // Save insights to database
    for (const insight of insights) {
      await supabase.from('ai_email_insights').insert(insight);
    }
    
    console.log(`Generated ${insights.length} insights`);
    
    return new Response(
      JSON.stringify({ success: true, insights_count: insights.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function analyzeSendTimes(sends: any[]) {
  const opensByHour: { [key: number]: { opens: number; total: number } } = {};
  
  sends.forEach(send => {
    if (!send.sent_at) return;
    
    const hour = new Date(send.sent_at).getHours();
    if (!opensByHour[hour]) {
      opensByHour[hour] = { opens: 0, total: 0 };
    }
    opensByHour[hour].total++;
    if (send.opened_at) opensByHour[hour].opens++;
  });
  
  let bestHour = 0;
  let bestRate = 0;
  
  Object.entries(opensByHour).forEach(([hour, stats]) => {
    const rate = stats.opens / stats.total;
    if (rate > bestRate && stats.total >= 10) {
      bestRate = rate;
      bestHour = parseInt(hour);
    }
  });
  
  if (bestRate === 0) return null;
  
  const avgRate = sends.filter(s => s.opened_at).length / sends.length;
  const improvement = ((bestRate / avgRate) - 1) * 100;
  
  return {
    title: 'Peak Engagement Window Detected',
    description: `Your subscribers open emails ${improvement.toFixed(0)}% more at ${bestHour}:00`,
    data: {
      best_hour: bestHour,
      open_rate: (bestRate * 100).toFixed(1),
      improvement_vs_avg: improvement.toFixed(1),
      sample_size: opensByHour[bestHour].total
    },
    confidence: Math.min(opensByHour[bestHour].total / 100, 0.95),
    actions: [
      `Schedule next campaign for ${bestHour}:00`,
      'A/B test this time slot vs your current schedule',
      'Set up automation rules to send at optimal times per subscriber'
    ]
  };
}

function analyzeSubjectLines(campaigns: any[]) {
  const withEmoji = campaigns.filter(c => /[\u{1F300}-\u{1F9FF}]/u.test(c.subject));
  const withNumbers = campaigns.filter(c => /\d/.test(c.subject));
  const withUrgency = campaigns.filter(c => /(now|today|limited|hurry|ends)/i.test(c.subject));
  
  const avgOpenRate = campaigns.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / campaigns.length;
  
  const emojiAvg = withEmoji.length > 0 
    ? withEmoji.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / withEmoji.length 
    : 0;
  
  const numberAvg = withNumbers.length > 0
    ? withNumbers.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / withNumbers.length
    : 0;
  
  const urgencyAvg = withUrgency.length > 0
    ? withUrgency.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / withUrgency.length
    : 0;
  
  let bestPattern = 'standard';
  let bestPerformance = avgOpenRate;
  
  if (emojiAvg > bestPerformance) {
    bestPattern = 'emoji';
    bestPerformance = emojiAvg;
  }
  if (numberAvg > bestPerformance) {
    bestPattern = 'numbers';
    bestPerformance = numberAvg;
  }
  if (urgencyAvg > bestPerformance) {
    bestPattern = 'urgency';
    bestPerformance = urgencyAvg;
  }
  
  if (bestPattern === 'standard') return null;
  
  const improvement = ((bestPerformance / avgOpenRate) - 1) * 100;
  
  const descriptions = {
    emoji: 'Subject lines with emojis perform better',
    numbers: 'Subject lines with numbers drive higher opens',
    urgency: 'Urgency-driven subject lines boost engagement'
  };
  
  return {
    title: 'High-Performing Subject Line Pattern',
    description: `${descriptions[bestPattern as keyof typeof descriptions]} (+${improvement.toFixed(0)}% open rate)`,
    data: {
      pattern: bestPattern,
      avg_performance: bestPerformance.toFixed(1),
      improvement: improvement.toFixed(1),
      sample_size: campaigns.length
    },
    confidence: Math.min(campaigns.length / 20, 0.9),
    actions: [
      `Use ${bestPattern} in next subject line`,
      'A/B test this pattern against your standard approach',
      `Review top-performing campaigns with ${bestPattern}`
    ]
  };
}

function analyzeHighValueSegments(scores: any[], sends: any[]) {
  const highPTP = scores.filter(s => s.ptp > 70);
  const mediumPTP = scores.filter(s => s.ptp >= 40 && s.ptp <= 70);
  
  if (highPTP.length === 0) return null;
  
  const highPTPPercentage = (highPTP.length / scores.length) * 100;
  
  return {
    title: 'High-Intent Segment Identified',
    description: `${highPTP.length} subscribers (${highPTPPercentage.toFixed(0)}%) show strong purchase intent (PTP > 70)`,
    data: {
      high_ptp_count: highPTP.length,
      medium_ptp_count: mediumPTP.length,
      percentage_high_intent: highPTPPercentage.toFixed(1),
      avg_ptp: (scores.reduce((sum, s) => sum + s.ptp, 0) / scores.length).toFixed(0)
    },
    confidence: Math.min(highPTP.length / 100, 0.92),
    actions: [
      'Create exclusive campaign for high PTP segment',
      'Offer early access or VIP perks to this group',
      'Track conversion rates to validate segment value',
      'Set up automation to capture these subscribers at peak intent'
    ]
  };
}

function analyzeEngagementTrend(campaigns: any[]) {
  const sorted = [...campaigns].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const half = Math.floor(sorted.length / 2);
  const recentHalf = sorted.slice(half);
  const olderHalf = sorted.slice(0, half);
  
  const recentAvg = recentHalf.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, c) => sum + (parseFloat(c.analytics?.open_rate) || 0), 0) / olderHalf.length;
  
  const change = ((recentAvg / olderAvg) - 1) * 100;
  
  if (Math.abs(change) < 5) return null;
  
  const trend = change > 0 ? 'improving' : 'declining';
  
  return {
    title: trend === 'improving' ? 'Engagement Trending Up' : 'Engagement Alert',
    description: `Recent campaigns show ${Math.abs(change).toFixed(0)}% ${trend} open rates`,
    data: {
      trend,
      recent_avg: recentAvg.toFixed(1),
      previous_avg: olderAvg.toFixed(1),
      change_percent: change.toFixed(1),
      sample_size: campaigns.length
    },
    confidence: Math.min(campaigns.length / 15, 0.88),
    actions: trend === 'improving' 
      ? [
          'Double down on what\'s working',
          'Document successful patterns',
          'Scale up campaign frequency carefully'
        ]
      : [
          'Review recent campaigns for quality issues',
          'Consider list hygiene (remove inactive subscribers)',
          'Test new subject line patterns',
          'Audit email content relevance'
        ]
  };
}
