import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommunityUnlockRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: CommunityUnlockRequest = await req.json();

    const displayName = firstName || "there";
    const communityUrl = `${req.headers.get("origin") || "https://sonsoflegion.com"}/community`;

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: "🎉 Your Legion Community Access is Now Active!",
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
              .highlight-box {
                background-color: #f9f9f9;
                border-left: 4px solid #d4af37;
                padding: 15px;
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
              ul {
                margin: 15px 0;
                padding-left: 20px;
              }
              li {
                margin-bottom: 10px;
                color: #555;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎉 Welcome to the Legion Community!</h1>
              
              <p>Hey ${displayName},</p>

              <p>It's been a week since you joined the portal — and now <strong>the doors to the Legion Community are open</strong>.</p>

              <div class="highlight-box">
                <p><strong>What's waiting for you inside:</strong></p>
                <ul>
                  <li>Connect with Legion members from around the world</li>
                  <li>Join live discussions and community events</li>
                  <li>Share your journey and get support from the tribe</li>
                  <li>Access exclusive community-only content and updates</li>
                  <li>Direct messaging with fellow members</li>
                </ul>
              </div>

              <p>This is where the real magic happens — where you'll find your people, build connections, and be part of something bigger.</p>

              <a href="${communityUrl}" class="cta-button">Enter the Community</a>

              <p><strong>Community Guidelines:</strong></p>
              <ul>
                <li>Be respectful and supportive of all members</li>
                <li>Keep conversations positive and constructive</li>
                <li>No spam or self-promotion without permission</li>
                <li>What happens in the Legion, stays in the Legion</li>
              </ul>

              <p>We can't wait to see you in there.</p>

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
