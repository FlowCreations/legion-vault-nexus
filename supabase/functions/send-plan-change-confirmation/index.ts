import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlanChangeRequest {
  email: string;
  customerName: string;
  oldPlanName: string;
  newPlanName: string;
  changeType: "upgrade" | "downgrade";
  newAmount: number;
  currency: string;
  billingInterval: string;
  effectiveDate: string;
  nextBillingDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      customerName,
      oldPlanName,
      newPlanName,
      changeType,
      newAmount,
      currency,
      billingInterval,
      effectiveDate,
      nextBillingDate,
    }: PlanChangeRequest = await req.json();

    console.log("Sending plan change confirmation email to:", email);

    const formattedAmount = (newAmount / 100).toFixed(2);
    const currencySymbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
    const greeting = customerName || "Member";
    const formattedEffectiveDate = new Date(effectiveDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedNextBilling = new Date(nextBillingDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const isUpgrade = changeType === "upgrade";
    const changeTitle = isUpgrade ? "Subscription Upgraded! 🚀" : "Subscription Plan Changed";
    const changeMessage = isUpgrade
      ? `You've successfully upgraded to <strong>${newPlanName}</strong>! Get ready for even more exclusive benefits.`
      : `Your subscription has been changed to <strong>${newPlanName}</strong>.`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Change Confirmation - Sons of Legion</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                Sons of Legion
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Elite Membership
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${changeTitle}
              </h2>
              
              <p style="margin: 0 0 20px; color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.6;">
                Hello ${greeting},
              </p>

              <p style="margin: 0 0 30px; color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.6;">
                ${changeMessage}
              </p>

              <!-- Plan Change Details Box -->
              <div style="background-color: rgba(139, 0, 0, 0.1); border-left: 4px solid #DC143C; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #DC143C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Plan Change Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Previous Plan:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 500;">${oldPlanName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">New Plan:</td>
                    <td style="padding: 8px 0; color: #DC143C; font-size: 14px; text-align: right; font-weight: bold;">${newPlanName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Effective Date:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 500;">${formattedEffectiveDate}</td>
                  </tr>
                </table>
              </div>

              <!-- Billing Details Box -->
              <div style="background-color: rgba(220, 20, 60, 0.05); border: 1px solid rgba(220, 20, 60, 0.2); padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 18px; font-weight: bold;">
                  New Billing Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Amount:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-size: 20px; text-align: right; font-weight: bold;">${currencySymbol}${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Billing Cycle:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 500; text-transform: capitalize;">${billingInterval}ly</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Next Billing Date:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 500;">${formattedNextBilling}</td>
                  </tr>
                </table>
              </div>

              ${isUpgrade ? `
              <!-- Upgrade Benefits -->
              <div style="background: linear-gradient(135deg, rgba(139, 0, 0, 0.2) 0%, rgba(220, 20, 60, 0.1) 100%); padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; color: #DC143C; font-size: 16px; font-weight: bold;">
                  🎉 New Benefits Unlocked
                </h3>
                <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.6;">
                  Your upgraded membership gives you access to enhanced features, exclusive content, and priority support. Welcome to the next level!
                </p>
              </div>
              ` : ''}

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://sonsoflegion.com/membership" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(220, 20, 60, 0.3);">
                  View My Account
                </a>
              </div>

              <p style="margin: 30px 0 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6; text-align: center;">
                Questions about your plan change? Contact us at<br>
                <a href="mailto:support@sonsoflegion.com" style="color: #DC143C; text-decoration: none;">support@sonsoflegion.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: rgba(0, 0, 0, 0.3); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 10px; color: rgba(255, 255, 255, 0.6); font-size: 12px;">
                © ${new Date().getFullYear()} Sons of Legion. All rights reserved.
              </p>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 11px;">
                This is an automated confirmation email. Please do not reply.
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

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [email],
      subject: `${isUpgrade ? "🚀 " : ""}Subscription Plan ${isUpgrade ? "Upgraded" : "Changed"} - ${newPlanName}`,
      html: emailHtml,
    });

    console.log("Plan change confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending plan change confirmation email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
