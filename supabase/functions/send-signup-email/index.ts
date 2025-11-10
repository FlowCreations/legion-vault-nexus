import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
}

const createSignupEmailHtml = (firstName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sons of Legion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Logo -->
          <tr>
             <td style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 40px 30px; text-align: center;">
               <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
             </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Welcome Message -->
              <h2 style="margin: 0 0 20px; color: #d4af37; font-size: 28px; font-weight: 700; line-height: 1.3;">
                Welcome to the Legion, ${firstName}! 🎸
              </h2>
              
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                You've just taken the first step into a community of real music, authentic stories, and unfiltered truth.
              </p>

              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join the <strong style="color: #d4af37;">Sons of Legion</strong> family.
              </p>

              <!-- Next Steps Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background: rgba(212, 175, 55, 0.1); border-left: 4px solid #d4af37; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px; color: #d4af37; font-size: 18px; font-weight: 700;">
                      📧 Next Step: Verify Your Email
                    </h3>
                    <p style="margin: 0; color: #c5c5c5; font-size: 15px; line-height: 1.6;">
                      In just a moment, you'll receive a <strong>verification email</strong> from our platform. Click the link in that email to activate your account and unlock full access to:
                    </p>
                    <ul style="margin: 15px 0 0; padding-left: 20px; color: #c5c5c5; font-size: 15px; line-height: 1.8;">
                      <li>Exclusive music releases and videos</li>
                      <li>Behind-the-scenes content</li>
                      <li>Community features and events</li>
                      <li>Merch and special offers</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #a5a5a5; font-size: 14px; line-height: 1.6;">
                Can't find the verification email? Check your spam folder, or reach out to us and we'll help you get sorted.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #333;">
              <p style="margin: 0 0 10px; color: #d4af37; font-size: 16px; font-weight: 600;">
                Stay Connected
              </p>
              <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.6;">
                Follow us on social media for the latest updates, new releases, and exclusive content.
              </p>
              <p style="margin: 20px 0 0; color: #666; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Sons of Legion. All rights reserved.<br>
                Keep it real. Keep it SØL.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName }: SignupEmailRequest = await req.json();
    
    console.log(`Sending signup email to ${email} (${userId})`);

    const displayName = firstName || email.split('@')[0];

    const emailHtml = createSignupEmailHtml(displayName);

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: "🎸 Welcome to Sons of Legion - Verify Your Email",
      html: emailHtml,
    });

    console.log("Signup email sent successfully:", emailResponse);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log the email send in email_logs
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: 'signup',
        recipient_email: email,
        status: 'sent'
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
