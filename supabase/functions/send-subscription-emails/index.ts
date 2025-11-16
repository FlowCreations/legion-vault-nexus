import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  firstName: string;
  eventType: 'subscription_created' | 'subscription_renewed' | 'subscription_canceled';
  planName: string;
  amount?: number;
  nextBillingDate?: string;
}

const createSubscriptionEmailHtml = (
  firstName: string, 
  eventType: string, 
  planName: string,
  amount?: number,
  nextBillingDate?: string
) => {
  let heading = '';
  let message = '';
  
  if (eventType === 'subscription_created') {
    heading = `Welcome to ${planName}, ${firstName}! 🎸`;
    message = `
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        Your subscription has been successfully activated! You now have full access to all ${planName} features.
      </p>
      ${amount ? `
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        <strong>Plan:</strong> ${planName}<br>
        <strong>Amount:</strong> $${(amount / 100).toFixed(2)}/month<br>
        ${nextBillingDate ? `<strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString()}` : ''}
      </p>
      ` : ''}
    `;
  } else if (eventType === 'subscription_renewed') {
    heading = `Your ${planName} Subscription Has Been Renewed 🎉`;
    message = `
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        Your subscription has been successfully renewed. Thank you for your continued support!
      </p>
      ${amount ? `
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        <strong>Amount Charged:</strong> $${(amount / 100).toFixed(2)}<br>
        ${nextBillingDate ? `<strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString()}` : ''}
      </p>
      ` : ''}
    `;
  } else {
    heading = `We're Sorry to See You Go, ${firstName}`;
    message = `
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        Your ${planName} subscription has been canceled. You'll continue to have access until the end of your current billing period.
      </p>
      <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        We'd love to have you back anytime. You can resubscribe at any time from your profile.
      </p>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventType === 'subscription_created' ? 'Subscription Activated' : eventType === 'subscription_renewed' ? 'Subscription Renewed' : 'Subscription Canceled'}</title>
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
              
              <h2 style="margin: 0 0 20px; color: #d4af37; font-size: 28px; font-weight: 700; line-height: 1.3;">
                ${heading}
              </h2>
              
              ${message}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://sonsoflegion.com/profile" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                      View Your Profile
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 30px 40px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; text-align: center;">
                Sons of Legion 🛡️🔥🩸
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                Questions? Email us at <a href="mailto:hello@sonsoflegion.com" style="color: #d4af37; text-decoration: none;">hello@sonsoflegion.com</a>
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, eventType, planName, amount, nextBillingDate }: SubscriptionEmailRequest = await req.json();

    console.log('[send-subscription-emails] Sending email:', { email, eventType, planName });

    const emailHtml = createSubscriptionEmailHtml(firstName, eventType, planName, amount, nextBillingDate);

    let subject = '';
    if (eventType === 'subscription_created') {
      subject = `Welcome to ${planName} - Sons of Legion`;
    } else if (eventType === 'subscription_renewed') {
      subject = `Your ${planName} Subscription Has Been Renewed`;
    } else {
      subject = `Subscription Canceled - Sons of Legion`;
    }

    const { data, error } = await resend.emails.send({
      from: 'Sons of Legion <hello@sonsoflegion.com>',
      to: [email],
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('[send-subscription-emails] Resend error:', error);
      throw error;
    }

    console.log('[send-subscription-emails] Email sent successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error('[send-subscription-emails] Error:', error);
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
