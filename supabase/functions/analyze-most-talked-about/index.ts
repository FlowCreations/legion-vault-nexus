import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

    const { days = 30 } = await req.json().catch(() => ({ days: 30 }));
    
    console.log(`[Most Talked About] Analyzing last ${days} days`);

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch search queries
    const { data: searches, error: searchError } = await supabase
      .from('search_queries')
      .select('query_text')
      .gte('created_at', since.toISOString());

    if (searchError) throw searchError;

    // Fetch community posts
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('content')
      .gte('created_at', since.toISOString());

    if (postsError) throw postsError;

    // Fetch community messages
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('content')
      .gte('created_at', since.toISOString());

    if (messagesError) throw messagesError;

    // Fetch agent interactions
    const { data: agentMessages, error: agentError } = await supabase
      .from('agent_interactions')
      .select('user_message')
      .gte('created_at', since.toISOString())
      .not('user_message', 'is', null);

    if (agentError) throw agentError;

    console.log('[Most Talked About] Data collected:', {
      searches: searches?.length || 0,
      posts: posts?.length || 0,
      messages: messages?.length || 0,
      agentMessages: agentMessages?.length || 0
    });

    // Combine all text
    const allText: string[] = [];
    
    searches?.forEach(s => allText.push(s.query_text));
    posts?.forEach(p => allText.push(p.content));
    messages?.forEach(m => allText.push(m.content));
    agentMessages?.forEach(a => allText.push(a.user_message));

    // Simple keyword extraction (count word frequency)
    const wordCounts = new Map<string, { count: number; sources: Set<string> }>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'this', 'that', 'with', 'was', 'as', 'by', 'be', 'from', 'are', 'how', 'what', 'when', 'where', 'why', 'can', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'my', 'your', 'i', 'you', 'we', 'they', 'them', 'me', 'him', 'her']);

    allText.forEach((text, idx) => {
      const source = idx < (searches?.length || 0) ? 'search' :
                     idx < (searches?.length || 0) + (posts?.length || 0) ? 'posts' :
                     idx < (searches?.length || 0) + (posts?.length || 0) + (messages?.length || 0) ? 'messages' : 'agent';
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      words.forEach(word => {
        const existing = wordCounts.get(word);
        if (existing) {
          existing.count++;
          existing.sources.add(source);
        } else {
          wordCounts.set(word, { count: 1, sources: new Set([source]) });
        }
      });
    });

    // Get top 10 topics
    const topics = Array.from(wordCounts.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sources: Array.from(data.sources),
        relevance: data.count * data.sources.size // Weight by both frequency and breadth
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(({ topic, count, sources }) => ({
        topic,
        mentions: count,
        sources,
        category: categorize(topic)
      }));

    console.log('[Most Talked About] Top topics:', topics.slice(0, 5));

    return new Response(
      JSON.stringify({ topics, totalTextSamples: allText.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Most Talked About] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function categorize(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes('tour') || lowerTopic.includes('show') || lowerTopic.includes('concert') || lowerTopic.includes('ticket')) {
    return 'tour';
  }
  if (lowerTopic.includes('merch') || lowerTopic.includes('shirt') || lowerTopic.includes('hat') || lowerTopic.includes('hoodie')) {
    return 'merch';
  }
  if (lowerTopic.includes('song') || lowerTopic.includes('music') || lowerTopic.includes('album') || lowerTopic.includes('track')) {
    return 'music';
  }
  if (lowerTopic.includes('video') || lowerTopic.includes('watch') || lowerTopic.includes('stream')) {
    return 'video';
  }
  
  return 'general';
}