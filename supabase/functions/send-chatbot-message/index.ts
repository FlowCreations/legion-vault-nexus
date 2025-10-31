import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Get active chatbot templates
    const { data: templates, error: templatesError } = await supabase
      .from('chatbot_templates')
      .select('*')
      .eq('active', true);

    if (templatesError) throw templatesError;
    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active chatbot templates found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select a random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Construct message with link if provided
    let message = template.message;
    if (template.link_url && template.link_text) {
      message += ` [${template.link_text}](${template.link_url})`;
    }

    // Insert bot message into chat
    const { error: chatError } = await supabase
      .from('livestream_chat')
      .insert({
        event_id: eventId,
        username: 'Sons of Legion Bot',
        message: message,
        is_bot: true,
      });

    if (chatError) throw chatError;

    console.log(`Chatbot message sent for event ${eventId}: ${message}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Chatbot message sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending chatbot message:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});