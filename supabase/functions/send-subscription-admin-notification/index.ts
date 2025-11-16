import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  subscriptionId: string;
  trialEnd?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, planName, amount, currency, subscriptionId, trialEnd }: AdminNotificationRequest = await req.json();

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);

    const trialText = trialEnd ? `<p><strong>Trial End:</strong> ${new Date(trialEnd).toLocaleDateString()}</p>` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Subscription - Sons of Legion</title>
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
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .content {
              padding: 40px 30px;
              background-color: #0a0a0a;
            }
            .content h2 {
              color: #D4AF37;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .info-box {
              background-color: #1a1a1a;
              border-left: 4px solid #D4AF37;
              padding: 20px;
              margin: 20px 0;
            }
            .info-box p {
              margin: 10px 0;
              color: #ffffff;
            }
            .info-box strong {
              color: #D4AF37;
            }
            .plan-badge {
              display: inline-block;
              background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
              color: #000000;
              padding: 8px 16px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 16px;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #888888;
              font-size: 12px;
              border-top: 1px solid #333333;
              background-color: #000000;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 NEW SUBSCRIPTION</h1>
            </div>
            <div class="content">
              <h2>A new member has joined the Legion!</h2>
              
              <div class="info-box">
                <p><strong>Member:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Plan:</strong> <span class="plan-badge">${planName}</span></p>
                <p><strong>Amount:</strong> ${formattedAmount}/month</p>
                ${trialText}
                <p><strong>Subscription ID:</strong> <code style="color: #D4AF37;">${subscriptionId}</code></p>
              </div>
              
              <p style="color: #ffffff; margin-top: 30px;">
                View full details in your Stripe dashboard.
              </p>
            </div>
            <div class="footer">
              <p>Sons of Legion | Admin Notification</p>
              <p>This is an automated notification. Do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Sons of Legion <notifications@sonsoflegion.com>",
      to: ["hello@sonsoflegion.com"],
      subject: `🎉 New Subscription: ${planName} - ${userName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }

    console.log("Admin notification sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-admin-notification:", error);
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
