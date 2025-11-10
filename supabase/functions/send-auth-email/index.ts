import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') as string;
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const createPasswordResetEmailHtml = (resetLink: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .logo-container { text-align: center; margin-bottom: 30px; }
    .logo { color: #f7c946; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 2px; }
    .logo-subtext { color: #f7c946; font-size: 14px; letter-spacing: 3px; margin: 5px 0 0 0; }
    .header { color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 30px 0 20px; }
    .text { color: #a0a0a0; font-size: 16px; line-height: 24px; margin: 16px 0; }
    .button { background-color: #f7c946; border-radius: 8px; color: #0a0a0a; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; padding: 16px 32px; margin: 24px 0; }
    .footer-text { color: #666666; font-size: 14px; line-height: 20px; margin: 24px 0; }
    .divider { border-top: 1px solid #333333; margin: 32px 0; }
    .footer { text-align: center; margin-top: 32px; }
    .footer-brand { color: #f7c946; font-weight: bold; font-size: 18px; margin: 16px 0; }
    .footer-link { color: #f7c946; font-size: 14px; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    
    <h2 class="header">Reset Your Password</h2>
    
    <p class="text">
      We received a request to reset the password for your Sons of Legion account (${userEmail}).
    </p>
    
    <a href="${resetLink}" class="button">
      Reset Password
    </a>
    
    <p class="text">
      This link will expire in 1 hour for security reasons.
    </p>
    
    <p class="footer-text">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>
    
    <hr class="divider" />
    
    <div class="footer">
      <p class="footer-brand">
        Sons of Legion 🛡️🔥🩸
      </p>
      <p>
        <a href="https://sonsoflegion.com" class="footer-link">
          Visit our website
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const createEmailConfirmationHtml = (confirmLink: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .logo-container { text-align: center; margin-bottom: 30px; }
    .logo { color: #f7c946; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 2px; }
    .logo-subtext { color: #f7c946; font-size: 14px; letter-spacing: 3px; margin: 5px 0 0 0; }
    .header { color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 30px 0 20px; }
    .text { color: #a0a0a0; font-size: 16px; line-height: 24px; margin: 16px 0; }
    .button { background-color: #f7c946; border-radius: 8px; color: #0a0a0a; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; padding: 16px 32px; margin: 24px 0; }
    .footer-text { color: #666666; font-size: 14px; line-height: 20px; margin: 24px 0; }
    .divider { border-top: 1px solid #333333; margin: 32px 0; }
    .footer { text-align: center; margin-top: 32px; }
    .footer-brand { color: #f7c946; font-weight: bold; font-size: 18px; margin: 16px 0; }
    .footer-link { color: #f7c946; font-size: 14px; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    
    <h2 class="header">Welcome to the Sons of Legion!</h2>
    
    <p class="text">
      Thank you for joining us, ${userEmail}. We're excited to have you in the Legion.
    </p>
    
    <p class="text">
      To complete your registration and activate your account, please verify your email address by clicking the button below:
    </p>
    
    <a href="${confirmLink}" class="button">
      Verify Email Address
    </a>
    
    <p class="text">
      This link will expire in 24 hours for security reasons.
    </p>
    
    <p class="footer-text">
      If you didn't create an account with Sons of Legion, you can safely ignore this email.
    </p>
    
    <hr class="divider" />
    
    <div class="footer">
      <p class="footer-brand">
        Sons of Legion 🛡️🔥🩸
      </p>
      <p>
        <a href="https://sonsoflegion.com" class="footer-link">
          Visit our website
        </a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 400 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('Received auth email webhook');
    
    // Verify webhook signature if secret is configured
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      try {
        wh.verify(payload, headers);
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    const webhookData = JSON.parse(payload);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = webhookData;

    console.log('Processing email for:', user.email, 'Type:', email_action_type);

    // Handle both signup confirmation and password recovery emails
    if (email_action_type !== 'recovery' && email_action_type !== 'signup') {
      console.log('Skipping unhandled email type:', email_action_type);
      return new Response(JSON.stringify({ message: 'Email type not handled by custom template' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Build the verification/reset link
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const verifyLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Generate HTML email based on type
    const html = email_action_type === 'recovery' 
      ? createPasswordResetEmailHtml(verifyLink, user.email)
      : createEmailConfirmationHtml(verifyLink, user.email);

    const subject = email_action_type === 'recovery'
      ? 'Reset Your Sons of Legion Password'
      : 'Verify Your Sons of Legion Email';

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sons of Legion <hello@sonsoflegion.com>',
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log(`${email_action_type === 'recovery' ? 'Password reset' : 'Email confirmation'} sent successfully to:`, user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
