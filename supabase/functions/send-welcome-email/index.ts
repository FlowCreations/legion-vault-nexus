import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";
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
    const portalUrl = "https://sol-portal.com";

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: "🛡️ Welcome to Sons of Legion - Your Journey Begins",
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
                margin: 0;
                padding: 0;
                background-color: #0a0a0a;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .logo-container {
                text-align: center;
                margin-bottom: 40px;
              }
              .logo {
                color: #f7c946;
                font-size: 56px;
                font-weight: bold;
                margin: 0;
                letter-spacing: 4px;
              }
              .logo-subtext {
                color: #f7c946;
                font-size: 14px;
                letter-spacing: 4px;
                margin: 10px 0 0 0;
              }
              .content {
                background-color: #1a1a1a;
                border-radius: 12px;
                padding: 40px;
                border: 1px solid #333;
              }
              h1 {
                color: #ffffff;
                font-size: 32px;
                margin: 0 0 20px 0;
                font-weight: bold;
              }
              p {
                margin-bottom: 16px;
                color: #cccccc;
                font-size: 16px;
              }
              .greeting {
                color: #f7c946;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 24px;
              }
              .highlight {
                color: #f7c946;
                font-weight: bold;
              }
              .features {
                background-color: #0a0a0a;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
                border: 1px solid #333;
              }
              .feature-item {
                display: flex;
                align-items: start;
                margin-bottom: 16px;
              }
              .feature-icon {
                color: #f7c946;
                font-size: 24px;
                margin-right: 12px;
                min-width: 30px;
              }
              .feature-text {
                color: #cccccc;
                font-size: 15px;
              }
              .feature-title {
                color: #ffffff;
                font-weight: bold;
                margin-bottom: 4px;
              }
              .cta-button {
                display: inline-block;
                padding: 16px 48px;
                background: linear-gradient(135deg, #f7c946, #d4af37);
                color: #0a0a0a;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 18px;
                margin: 30px 0;
                text-align: center;
              }
              .cta-container {
                text-align: center;
              }
              .community-unlock {
                background-color: #2a2a2a;
                border-left: 4px solid #f7c946;
                padding: 20px;
                margin: 24px 0;
                border-radius: 4px;
              }
              .community-unlock p {
                margin: 0;
                color: #ffffff;
                font-size: 15px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #333;
                text-align: center;
              }
              .signature {
                color: #f7c946;
                font-size: 20px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer-text {
                font-size: 14px;
                color: #888;
              }
              .footer-link {
                color: #f7c946;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo-container">
                <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
              </div>
              
              <div class="content">
                <h1>Welcome to the Legion 🛡️</h1>
                
                <p class="greeting">Hey ${displayName},</p>

                <p>Your email is verified and your portal is now <span class="highlight">fully activated</span>.</p>

                <p>You're officially part of the Sons of Legion community — here we are united by music, purpose, and shared values.</p>

                <div class="features">
                  <div class="feature-item">
                    <div class="feature-icon">🎵</div>
                    <div class="feature-text">
                      <div class="feature-title">Full Music Library</div>
                      Stream or download all Sons of Legion music including exclusive tracks, albums, and unreleased content
                    </div>
                  </div>
                  
                  <div class="feature-item">
                    <div class="feature-icon">🎬</div>
                    <div class="feature-text">
                      <div class="feature-title">Behind-the-Scenes Videos</div>
                      Exclusive access to music videos, studio sessions, and personal stories from the journey
                    </div>
                  </div>
                  
                  <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">
                      <div class="feature-title">Personal Dashboard</div>
                      Track your journey, earn badges, and unlock rewards as you engage with the content
                    </div>
                  </div>
                  
                  <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-text">
                      <div class="feature-title">AI Guide</div>
                      Get help navigating the portal, finding content, and discovering new music instantly
                    </div>
                  </div>
                  
                  <div class="feature-item">
                    <div class="feature-icon">🛍️</div>
                    <div class="feature-text">
                      <div class="feature-title">Exclusive Merch</div>
                      Access limited-edition merchandise and apparel available only to Legion members
                    </div>
                  </div>
                </div>

                <div class="community-unlock">
                  <p><strong>🔓 Community Access:</strong> After 7 days in the portal, you'll automatically unlock access to the Legion Community Hub — where you can connect with thousands of members from around the world, share your journey, and be part of something bigger.</p>
                </div>

                <div class="cta-container">
                  <a href="${portalUrl}" class="cta-button">Enter Your Portal →</a>
                </div>

                <p>This is more than music. This is <span class="highlight">The Journey</span>.</p>

                <div class="footer">
                  <p class="signature">The SØL Team 🛡️🔥🩸</p>
                  <p style="color: #888; font-style: italic; margin: 10px 0;">#WeAreTheLegion</p>
                  <p class="footer-text">
                    <a href="https://sonsoflegion.com" class="footer-link">sonsoflegion.com</a>
                  </p>
                </div>
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
