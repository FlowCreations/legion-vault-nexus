import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  email: string;
  customerName: string;
  planName: string;
  cancelledAt: string;
  accessUntil: string;
  cancellationReason?: string;
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
      cancelledAt,
      accessUntil,
      cancellationReason 
    }: CancellationEmailRequest = await req.json();

    console.log("Sending cancellation confirmation to:", email);

    const feedbackUrl = `https://forms.gle/your-feedback-form`; // Replace with actual feedback form
    const reactivateUrl = `${Deno.env.get("VITE_SUPABASE_URL") || "https://dlwyndcvnunvomgkbkhn.supabase.co"}/subscribe`;

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: "We're Sorry to See You Go - Special Offer Inside",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #0a0a0a;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #1a1a1a;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #fff;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .content {
              padding: 40px 30px;
              color: #e0e0e0;
            }
            h1 {
              color: #fff;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            h2 {
              color: #DC143C;
              font-size: 20px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .info-box {
              background-color: #252525;
              border-left: 4px solid #DC143C;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #333;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #999;
            }
            .info-value {
              color: #fff;
            }
            .cta-button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
              color: #fff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .secondary-button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #252525;
              color: #DC143C !important;
              text-decoration: none;
              border-radius: 6px;
              border: 2px solid #DC143C;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .offer-box {
              background: linear-gradient(135deg, rgba(139, 0, 0, 0.2) 0%, rgba(220, 20, 60, 0.2) 100%);
              border: 2px solid #DC143C;
              padding: 25px;
              margin: 30px 0;
              border-radius: 8px;
              text-align: center;
            }
            .offer-title {
              font-size: 22px;
              font-weight: bold;
              color: #fff;
              margin-bottom: 10px;
            }
            .offer-subtitle {
              color: #DC143C;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .benefits {
              background-color: #252525;
              padding: 20px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .benefit-item {
              padding: 10px 0;
              border-bottom: 1px solid #333;
              color: #e0e0e0;
            }
            .benefit-item:last-child {
              border-bottom: none;
            }
            .benefit-item::before {
              content: "✓ ";
              color: #DC143C;
              font-weight: bold;
              margin-right: 8px;
            }
            .footer {
              background-color: #0a0a0a;
              padding: 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .footer a {
              color: #DC143C;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">Sons of Legion</h1>
            </div>
            
            <div class="content">
              <h1>We're Sorry to See You Go, ${customerName}</h1>
              
              <p>Your subscription has been cancelled. We understand that circumstances change, and we respect your decision.</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Plan:</span>
                  <span class="info-value">${planName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cancelled On:</span>
                  <span class="info-value">${new Date(cancelledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Access Until:</span>
                  <span class="info-value">${new Date(accessUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              <p><strong>Good news:</strong> You still have access to all ${planName} features until ${new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Make the most of your remaining time!</p>
              
              <h2>Help Us Improve</h2>
              <p>We'd love to know what led to your decision. Your feedback helps us create a better experience for our community.</p>
              <div style="text-align: center;">
                <a href="${feedbackUrl}" class="secondary-button">Share Your Feedback</a>
              </div>
              
              <div class="offer-box">
                <div class="offer-title">🎁 Exclusive Win-Back Offer</div>
                <div class="offer-subtitle">Come Back & Get 25% Off</div>
                <p style="color: #e0e0e0; margin: 15px 0;">We'd love to have you back in the Legion. Reactivate within 30 days and get <strong style="color: #fff;">25% off your first month</strong>.</p>
                
                <div class="benefits">
                  <div class="benefit-item">Full access to exclusive content and community</div>
                  <div class="benefit-item">Priority support from the Sons of Legion team</div>
                  <div class="benefit-item">Early access to new features and releases</div>
                  <div class="benefit-item">Members-only events and live sessions</div>
                </div>
                
                <div style="margin-top: 20px;">
                  <a href="${reactivateUrl}" class="cta-button">Reactivate & Save 25%</a>
                </div>
                <p style="color: #999; font-size: 14px; margin-top: 15px;">Offer expires in 30 days from cancellation date</p>
              </div>
              
              <h2>What You'll Miss</h2>
              <p>As a reminder, here's what you're losing access to after ${new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}:</p>
              <ul style="color: #e0e0e0; line-height: 1.8;">
                <li>Exclusive members-only content and videos</li>
                <li>Direct access to the Sons of Legion community</li>
                <li>Live streaming events and Q&A sessions</li>
                <li>Premium music tracks and early releases</li>
                <li>Behind-the-scenes content and updates</li>
              </ul>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">If you have any questions or need assistance, our team is here to help. Just reply to this email.</p>
              
              <p>Stay strong,<br><strong style="color: #DC143C;">The Sons of Legion Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This email confirms your subscription cancellation.</p>
              <p>Sons of Legion | <a href="#">Contact Support</a> | <a href="#">Visit Website</a></p>
              <p style="margin-top: 15px; color: #555;">© ${new Date().getFullYear()} Sons of Legion. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Cancellation confirmation sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-cancellation-confirmation function:", error);
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
