import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RenewalReminderRequest {
  email: string;
  customerName?: string;
  planName: string;
  amountTotal: number;
  currency: string;
  renewalDate: number;
  subscriptionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      customerName,
      planName,
      amountTotal,
      currency,
      renewalDate,
      subscriptionId,
    }: RenewalReminderRequest = await req.json();

    console.log("Sending renewal reminder to:", email);

    const greeting = customerName ? `Hey ${customerName.split(" ")[0]},` : "Hey there,";
    const formattedAmount = (amountTotal / 100).toFixed(2);
    const currencySymbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
    const renewalDateFormatted = new Date(renewalDate * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Renewal Reminder - Sons of Legion</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion" style="width: 200px; height: auto;" />
      </div>
      
      <!-- Main Content Card -->
      <div style="background-color: #1a1a1a; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
        
        <!-- Header -->
        <h1 style="color: #ffffff; margin: 0 0 20px 0; font-size: 28px; font-weight: bold; text-align: center;">
          Your Membership Renews Soon 🛡️
        </h1>
        
        <!-- Greeting -->
        <p style="color: #f7c946; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
          ${greeting}
        </p>
        
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
          This is a friendly reminder that your <strong style="color: #f7c946;">Sons of Legion</strong> membership will automatically renew in <strong style="color: #f7c946;">3 days</strong>.
        </p>
        
        <!-- Renewal Details Card -->
        <div style="background-color: #0a0a0a; padding: 28px; border-radius: 8px; margin: 0 0 32px 0; border: 2px solid #f7c946;">
          <h2 style="color: #f7c946; font-size: 18px; margin: 0 0 24px 0; font-weight: bold; text-align: center;">
            Renewal Details
          </h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #999999; font-size: 15px;">Plan:</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 15px; text-align: right; font-weight: bold;">
                ${planName}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #999999; font-size: 15px;">Renewal Date:</td>
              <td style="padding: 12px 0; color: #f7c946; font-size: 16px; text-align: right; font-weight: bold;">
                ${renewalDateFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #999999; font-size: 15px;">Amount Due:</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 18px; text-align: right; font-weight: bold;">
                ${currencySymbol}${formattedAmount}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Info Box -->
        <div style="background-color: #2a2a2a; border-left: 4px solid #f7c946; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
          <h3 style="color: #f7c946; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">
            ✓ What This Means
          </h3>
          <p style="color: #cccccc; margin: 0; font-size: 15px; line-height: 1.6;">
            Your subscription will automatically renew on <strong>${renewalDateFormatted}</strong>, and you'll continue to enjoy uninterrupted access to all exclusive content, music, and community features.
          </p>
        </div>
        
        <!-- Benefits Reminder -->
        <div style="background-color: #0a0a0a; padding: 24px; border-radius: 8px; margin: 0 0 32px 0;">
          <h3 style="color: #f7c946; margin: 0 0 16px 0; font-size: 17px; font-weight: bold;">
            Your Membership Includes:
          </h3>
          <ul style="color: #cccccc; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 24px;">
            <li style="margin-bottom: 8px;">🎵 Unlimited access to all music and albums</li>
            <li style="margin-bottom: 8px;">🎥 Exclusive behind-the-scenes content</li>
            <li style="margin-bottom: 8px;">💬 Private Legion community access</li>
            <li style="margin-bottom: 8px;">🎁 Early access to merch and tickets</li>
            <li style="margin-bottom: 8px;">📱 Live chat and exclusive Q&As</li>
          </ul>
        </div>
        
        <!-- CTA Buttons -->
        <div style="text-align: center; margin: 0 0 32px 0;">
          <p style="color: #999999; font-size: 14px; margin: 0 0 16px 0;">
            No action needed - your membership will renew automatically.
          </p>
          <a href="${Deno.env.get('VITE_SUPABASE_URL')}/profile" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f7c946, #d4af37); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 8px 12px 8px;">
            Manage Subscription
          </a>
        </div>
        
        <!-- Payment Method Section -->
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 0 0 32px 0; text-align: center;">
          <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">
            Update Payment Method
          </h3>
          <p style="color: #cccccc; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
            Need to update your payment information? You can manage your payment method anytime from your account settings.
          </p>
          <a href="${Deno.env.get('VITE_SUPABASE_URL')}/profile" style="color: #f7c946; text-decoration: none; font-weight: bold; font-size: 15px;">
            Update Payment Method →
          </a>
        </div>
        
        <!-- Cancel Info -->
        <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 0 0 32px 0; text-align: center;">
          <p style="color: #999999; font-size: 13px; margin: 0 0 8px 0; line-height: 1.6;">
            Don't want to renew? You can cancel anytime before ${renewalDateFormatted} from your subscription settings. You'll keep access until the end of your current billing period.
          </p>
          <a href="${Deno.env.get('VITE_SUPABASE_URL')}/profile" style="color: #f7c946; text-decoration: none; font-size: 13px;">
            View Cancellation Options
          </a>
        </div>
        
        <!-- Support Section -->
        <div style="background-color: #2a2a2a; border-left: 4px solid #f7c946; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
          <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">
            Questions?
          </h3>
          <p style="color: #cccccc; margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;">
            Our team is here to help if you have any questions about your renewal or membership.
          </p>
          <p style="color: #f7c946; font-size: 14px; margin: 0;">
            Email: <a href="mailto:hello@sonsoflegion.com" style="color: #f7c946; text-decoration: none;">hello@sonsoflegion.com</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #333333; text-align: center;">
          <p style="color: #f7c946; font-size: 20px; font-weight: bold; margin: 0 0 8px 0;">
            The SØL Team 🛡️🔥🩸
          </p>
          <p style="color: #888888; font-style: italic; margin: 0; font-size: 14px;">
            #WeAreTheLegion
          </p>
        </div>
        
      </div>
      
      <!-- Footer Links -->
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666666; font-size: 12px; margin: 0 0 12px 0;">
          © ${new Date().getFullYear()} Sons of Legion. All rights reserved.
        </p>
        <p style="color: #666666; font-size: 12px; margin: 0;">
          <a href="https://sonsoflegion.com" style="color: #f7c946; text-decoration: none; margin: 0 8px;">Website</a> |
          <a href="https://instagram.com/sonsoflegion" style="color: #f7c946; text-decoration: none; margin: 0 8px;">Instagram</a> |
          <a href="https://twitter.com/sonsoflegion" style="color: #f7c946; text-decoration: none; margin: 0 8px;">Twitter</a>
        </p>
      </div>
      
    </div>
  </body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: `⏰ Your Legion Membership Renews in 3 Days`,
      html: emailHtml,
    });

    console.log("Renewal reminder email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-renewal-reminder function:", error);
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
