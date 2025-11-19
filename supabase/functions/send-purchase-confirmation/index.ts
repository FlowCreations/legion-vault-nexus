import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  purchaseId: string;
  email: string;
  customerName?: string;
  productName: string;
  productType: string;
  productId?: string;
  amountTotal: number;
  currency: string;
  orderNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      customerName,
      productName,
      productType,
      productId,
      amountTotal,
      currency,
      orderNumber,
    }: PurchaseConfirmationRequest = await req.json();

    console.log("Sending purchase confirmation to:", email);

    const greeting = customerName ? `Hey ${customerName.split(" ")[0]},` : "Hey there,";
    const formattedAmount = (amountTotal / 100).toFixed(2);
    const currencySymbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Determine next steps and CTA based on product type
    let nextStepsMessage = "";
    let ctaText = "";
    let ctaLink = "";

    if (productType === "album") {
      nextStepsMessage = `Your album "${productName}" is now unlocked and ready to play! Head over to your music library to start listening.`;
      ctaText = "Listen Now";
      ctaLink = productId 
        ? `https://sonsoflegion.com/music/album/${productId}`
        : "https://sonsoflegion.com/music";
    } else if (productType === "merch") {
      nextStepsMessage = `Your order for "${productName}" is being prepared! You'll receive a shipping confirmation with tracking information soon.`;
      ctaText = "View Order";
      ctaLink = "https://sonsoflegion.com/merch";
    } else {
      nextStepsMessage = `Your purchase of "${productName}" is complete! Access your content anytime from your account.`;
      ctaText = "Access Your Purchase";
      ctaLink = "https://sonsoflegion.com";
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Confirmation - Sons of Legion</title>
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
          Thank You For Your Purchase! 🛡️
        </h1>
        
        <!-- Greeting -->
        <p style="color: #f7c946; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
          ${greeting}
        </p>
        
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
          Your order has been confirmed and you're all set! We're excited to have you as part of the Legion.
        </p>
        
        <!-- Order Details Card -->
        <div style="background-color: #0a0a0a; padding: 24px; border-radius: 8px; margin: 0 0 32px 0;">
          <h2 style="color: #f7c946; font-size: 18px; margin: 0 0 20px 0; font-weight: bold;">
            Order Summary
          </h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #999999; font-size: 14px;">Order Number:</td>
              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: bold;">
                #${orderNumber}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999999; font-size: 14px;">Product:</td>
              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">
                ${productName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999999; font-size: 14px;">Amount Paid:</td>
              <td style="padding: 8px 0; color: #f7c946; font-size: 16px; text-align: right; font-weight: bold;">
                ${currencySymbol}${formattedAmount}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999999; font-size: 14px;">Date:</td>
              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">
                ${date}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- What's Next Section -->
        <div style="background-color: #2a2a2a; border-left: 4px solid #f7c946; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
          <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">
            What's Next?
          </h3>
          <p style="color: #cccccc; margin: 0; font-size: 15px; line-height: 1.6;">
            ${nextStepsMessage}
          </p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 0 0 32px 0;">
          <a href="${ctaLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f7c946, #d4af37); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; transition: transform 0.2s;">
            ${ctaText}
          </a>
        </div>
        
        <!-- Support Section -->
        <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 0 0 32px 0; text-align: center;">
          <p style="color: #999999; font-size: 14px; margin: 0 0 8px 0;">
            Questions about your order?
          </p>
          <p style="color: #f7c946; font-size: 14px; margin: 0;">
            Contact us at <a href="mailto:hello@sonsoflegion.com" style="color: #f7c946; text-decoration: none;">hello@sonsoflegion.com</a>
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
      subject: `Your Purchase is Confirmed! Order #${orderNumber}`,
      html: emailHtml,
    });

    console.log("Purchase confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purchase-confirmation function:", error);
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
