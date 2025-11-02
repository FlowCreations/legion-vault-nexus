import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommunityUnlockEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: CommunityUnlockEmailRequest = await req.json();

    const displayName = firstName || "there";
    const communityUrl = `${req.headers.get("origin") || "https://sonsoflegion.com"}/community`;

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [email],
      subject: "The Legion Community is Now Open",
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
              .highlight {
                background-color: #fff8e1;
                padding: 20px;
                border-left: 4px solid #d4af37;
                margin: 20px 0;
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
              <h1>🎉 The Legion Community is Now Open</h1>
              
              <p>Hey ${displayName},</p>

              <p>You've been with us for a week now, and it's time to unlock the next level of your journey.</p>

              <div class="highlight">
                <p><strong>The Legion Community is now open to you.</strong></p>
                <p>Inside, you can:</p>
                <ul>
                  <li>Connect with other members from around the world</li>
                  <li>Share music and experiences</li>
                  <li>Earn exclusive badges</li>
                  <li>Get early access to new releases</li>
                  <li>Participate in members-only events</li>
                </ul>
              </div>

              <a href="${communityUrl}" class="cta-button">Enter the Community</a>

              <p>This is where the journey gets even better. We're glad you're here.</p>

              <p class="signature">— Sons of Legion 🛡🔥🩸 #WeAreTheLegion</p>

              <div class="footer">
                © Sons of Legion | <a href="https://sonsoflegion.com" style="color: #d4af37;">sonsoflegion.com</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Community unlock email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-community-unlock-email function:", error);
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
