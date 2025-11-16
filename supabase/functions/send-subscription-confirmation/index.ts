import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionConfirmationRequest {
  email: string;
  firstName: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  trialEnd?: string;
  nextBillingDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, planName, amount, currency, interval, trialEnd, nextBillingDate }: SubscriptionConfirmationRequest = await req.json();

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);

    const trialSection = trialEnd ? `
      <div class="trial-box">
        <h3>🎁 Your Free Trial</h3>
        <p>You're starting with a <strong>7-day free trial</strong>!</p>
        <p>Trial ends: <strong>${new Date(trialEnd).toLocaleDateString()}</strong></p>
        <p style="font-size: 14px; color: #888;">You won't be charged until ${new Date(trialEnd).toLocaleDateString()}</p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to the Legion!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #000000;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #1a1a1a;
              border: 2px solid #D4AF37;
            }
            .header {
              background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 2px solid #D4AF37;
            }
            .header h1 {
              color: #D4AF37;
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .header p {
              color: #ffffff;
              margin: 10px 0 0;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
              background-color: #0a0a0a;
            }
            .content h2 {
              color: #D4AF37;
              font-size: 24px;
              margin-top: 0;
            }
            .content p {
              color: #ffffff;
              margin: 15px 0;
            }
            .trial-box {
              background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
              border: 2px solid #D4AF37;
              border-radius: 8px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }
            .trial-box h3 {
              color: #D4AF37;
              margin-top: 0;
              font-size: 20px;
            }
            .trial-box p {
              margin: 10px 0;
              color: #ffffff;
            }
            .plan-details {
              background-color: #1a1a1a;
              border-left: 4px solid #D4AF37;
              padding: 20px;
              margin: 25px 0;
            }
            .plan-details h3 {
              color: #D4AF37;
              margin-top: 0;
              font-size: 18px;
            }
            .plan-details p {
              margin: 10px 0;
              color: #ffffff;
            }
            .plan-badge {
              display: inline-block;
              background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
              color: #000000;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 18px;
              margin: 10px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
              color: #000000;
              text-decoration: none;
              padding: 15px 40px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .features {
              margin: 30px 0;
            }
            .features ul {
              list-style: none;
              padding: 0;
            }
            .features li {
              padding: 10px 0;
              color: #ffffff;
              border-bottom: 1px solid #333333;
            }
            .features li:before {
              content: "✓ ";
              color: #D4AF37;
              font-weight: bold;
              margin-right: 10px;
            }
            .footer {
              text-align: center;
              padding: 30px 20px;
              color: #888888;
              font-size: 12px;
              border-top: 1px solid #333333;
              background-color: #000000;
            }
            .footer a {
              color: #D4AF37;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 WELCOME TO THE LEGION!</h1>
              <p>You're now a ${planName} member</p>
            </div>
            <div class="content">
              <h2>Hey ${firstName},</h2>
              <p>Thank you for joining Sons of Legion! You're now part of an exclusive community with access to premium content, behind-the-scenes footage, and so much more.</p>
              
              ${trialSection}
              
              <div class="plan-details">
                <h3>Your Subscription Details</h3>
                <p><strong>Plan:</strong> <span class="plan-badge">${planName}</span></p>
                <p><strong>Price:</strong> ${formattedAmount}/${interval}</p>
                <p><strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString()}</p>
              </div>

              <div class="features">
                <h3 style="color: #D4AF37;">What You Get:</h3>
                <ul>
                  <li>Exclusive behind-the-scenes content</li>
                  <li>Early access to new releases</li>
                  <li>Community features and direct messaging</li>
                  <li>Premium albums and performances</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('//', '//dlwyndcvnunvomgkbkhn.')}/profile" class="cta-button">
                  Go to Your Profile
                </a>
              </div>

              <p>If you have any questions, reach out to us at <a href="mailto:hello@sonsoflegion.com" style="color: #D4AF37;">hello@sonsoflegion.com</a></p>
              
              <p style="margin-top: 30px;">Welcome to the family! 🚀</p>
            </div>
            <div class="footer">
              <p><strong>Sons of Legion</strong></p>
              <p>Manage your subscription anytime in your <a href="${Deno.env.get('SUPABASE_URL')?.replace('//', '//dlwyndcvnunvomgkbkhn.')}/profile">profile settings</a></p>
              <p style="margin-top: 20px;">Questions? Email us at <a href="mailto:hello@sonsoflegion.com">hello@sonsoflegion.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Sons of Legion <welcome@sonsoflegion.com>",
      to: [email],
      subject: `🎉 Welcome to ${planName} - Sons of Legion`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending subscription confirmation:", error);
      throw error;
    }

    console.log("Subscription confirmation sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
