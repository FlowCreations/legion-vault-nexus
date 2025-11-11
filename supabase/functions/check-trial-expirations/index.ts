import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_PRICES: { [key: string]: number } = {
  'Rebels': 10,
  'Outlaws': 25,
  'Legionnaires': 50
};

const TIER_FEATURES: { [key: string]: string[] } = {
  'Rebels': [
    '🎥 Behind-the-scenes videos',
    '💬 Community post access',
    '🎵 Premium albums',
    '🎭 Exclusive performances'
  ],
  'Outlaws': [
    '🎥 All Rebels features',
    '📸 Gallery access',
    '🎬 Documentary content',
    '🎸 Live Studio access',
    '🎪 Advanced community features'
  ],
  'Legionnaires': [
    '⚡ All Outlaws features',
    '🎁 Merch discounts (15%)',
    '🚀 Early access to releases',
    '👑 Priority support',
    '🌟 VIP status & perks'
  ]
};

interface TrialSubscription {
  id: string;
  tenant_id: string;
  plan_type: string;
  trial_ends_at: string;
  status: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting trial expiration check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active trials
    const { data: activeTrials, error: trialsError } = await supabase
      .from('tenant_subscriptions')
      .select('id, tenant_id, plan_type, trial_ends_at, status')
      .in('status', ['trialing', 'trial'])
      .not('trial_ends_at', 'is', null);

    if (trialsError) {
      console.error('Error fetching trials:', trialsError);
      throw trialsError;
    }

    console.log(`Found ${activeTrials?.length || 0} active trials`);

    if (!activeTrials || activeTrials.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active trials found', processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let emailsSent = 0;
    const now = new Date();

    for (const trial of activeTrials as TrialSubscription[]) {
      const trialEndsAt = new Date(trial.trial_ends_at);
      const daysUntilExpiration = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Trial ${trial.id}: ${daysUntilExpiration} days until expiration`);

      // Determine which email to send
      let emailType: '3_days' | '1_day' | 'expired' | null = null;
      if (daysUntilExpiration === 3) {
        emailType = '3_days';
      } else if (daysUntilExpiration === 1) {
        emailType = '1_day';
      } else if (daysUntilExpiration <= 0 && daysUntilExpiration > -1) {
        emailType = 'expired';
      }

      if (!emailType) continue;

      // Check if email already sent for this milestone
      const { data: existingLog } = await supabase
        .from('trial_email_logs')
        .select('id')
        .eq('tenant_id', trial.tenant_id)
        .eq('subscription_id', trial.id)
        .eq('email_type', emailType)
        .single();

      if (existingLog) {
        console.log(`Email ${emailType} already sent for trial ${trial.id}`);
        continue;
      }

      // Get user details
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .eq('id', trial.tenant_id)
        .single();

      if (userError || !userProfile) {
        console.error(`Error fetching user for trial ${trial.id}:`, userError);
        continue;
      }

      const user = userProfile as UserProfile;

      // Prepare email data
      const planType = trial.plan_type || 'Rebels';
      const customerName = user.first_name 
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
        : undefined;

      const emailData = {
        email: user.email,
        customerName,
        planType,
        daysRemaining: Math.max(0, daysUntilExpiration),
        trialEndsAt: trial.trial_ends_at,
        features: TIER_FEATURES[planType] || TIER_FEATURES['Rebels'],
        price: TIER_PRICES[planType] || TIER_PRICES['Rebels']
      };

      // Send email
      console.log(`Sending ${emailType} email to ${user.email} for ${planType} trial`);
      
      const { error: emailError } = await supabase.functions.invoke('send-trial-expiration-warning', {
        body: emailData
      });

      if (emailError) {
        console.error(`Error sending email for trial ${trial.id}:`, emailError);
        continue;
      }

      // Log the email send
      const { error: logError } = await supabase
        .from('trial_email_logs')
        .insert({
          tenant_id: trial.tenant_id,
          subscription_id: trial.id,
          email_type: emailType,
          plan_type: planType,
          sent_at: now.toISOString()
        });

      if (logError) {
        console.error(`Error logging email for trial ${trial.id}:`, logError);
      } else {
        emailsSent++;
        console.log(`Successfully sent and logged ${emailType} email for trial ${trial.id}`);
      }
    }

    console.log(`Trial expiration check complete. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ 
        message: 'Trial expiration check complete',
        trialsChecked: activeTrials.length,
        emailsSent 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in check-trial-expirations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
