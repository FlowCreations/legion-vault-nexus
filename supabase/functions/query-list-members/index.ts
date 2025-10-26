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
    const { filterRules, countOnly = false, limit = 1000 } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build the query based on filter rules
    let query = supabaseClient
      .from('user_profiles')
      .select('user_id, email, ptp_current, ptp_status, era_current, era_label, total_spend, subscription_tier', { count: 'exact' });

    // Apply filter conditions
    if (filterRules?.conditions) {
      const operator = filterRules.operator || 'AND';
      
      filterRules.conditions.forEach((condition: any) => {
        const { field, operator: condOperator, value } = condition;
        
        switch (condOperator) {
          case '>':
            query = query.gt(field, value);
            break;
          case '<':
            query = query.lt(field, value);
            break;
          case '>=':
            query = query.gte(field, value);
            break;
          case '<=':
            query = query.lte(field, value);
            break;
          case '=':
            query = query.eq(field, value);
            break;
          case '!=':
            query = query.neq(field, value);
            break;
          case 'contains':
            query = query.ilike(field, `%${value}%`);
            break;
        }
      });
    }

    if (!countOnly) {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    if (countOnly) {
      return new Response(
        JSON.stringify({ count: count || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ members: data, count: count || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error querying list members:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
