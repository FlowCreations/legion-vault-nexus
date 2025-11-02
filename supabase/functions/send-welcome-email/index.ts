import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName }: WelcomeEmailRequest = await req.json();

    const displayName = firstName || "there";
    const portalUrl = `${req.headers.get("origin") || "https://sonsoflegion.com"}/`;

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to your JRNY Portal",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 {
                color: #1a1a1a;
                font-size: 28px;
                margin-bottom: 20px;
                font-weight: bold;
              }
              h2 {
                color: #333;
                font-size: 20px;
                margin-top: 30px;
                margin-bottom: 15px;
              }
              p {
                margin-bottom: 15px;
                color: #555;
              }
              .cta-button {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #d4af37, #f4e5a1);
                color: #1a1a1a;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 25px 0;
                text-align: center;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 14px;
                color: #888;
                text-align: center;
              }
              .signature {
                margin-top: 30px;
                font-style: italic;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to your JRNY Portal</h1>
              
              <p>Hey ${displayName},</p>

              <h2>You're in.</h2>

              <p>Your portal is now open — and <strong>Power</strong> is unlocked for you to stream or download anytime.</p>

              <p>Inside, you'll find the full music library, behind-the-scenes videos, and your own personal dashboard. There's even an AI guide in the corner if you need help finding your way.</p>

              <p><strong>And here's the best part</strong> — after your first week inside, the Legion Community opens automatically. That's where you'll be able to chat and connect with other members from around the world.</p>

              <a href="${portalUrl}" class="cta-button">Enter the Portal</a>

              <p>Welcome to The Journey.</p>

              <p class="signature">— Sons of Legion 🛡🔥🩸 #WeAreTheLegion</p>

              <div class="footer">
                © Sons of Legion | <a href="https://sonsoflegion.com" style="color: #d4af37;">sonsoflegion.com</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Schedule community unlock email for 7 days from now
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 7);

    await supabaseClient.from("scheduled_emails").insert({
      user_id: userId,
      email_type: "community_unlock",
      scheduled_for: scheduledDate.toISOString(),
      email_data: {
        email,
        firstName: displayName,
      },
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
