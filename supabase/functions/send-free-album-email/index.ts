import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FreeAlbumEmailRequest {
  email: string;
  name: string;
  phone?: string;
  zipCode?: string;
}

const createFreeAlbumEmailHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Power Album</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Logo -->
          <tr>
             <td style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 40px 30px; text-align: center;">
               <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
             </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Welcome Message -->
              <h2 style="margin: 0 0 20px; color: #d4af37; font-size: 28px; font-weight: 700; line-height: 1.3;">
                🎸 Power Album Unlocked!
              </h2>
              
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                Welcome to the Legion, ${name}! Your free Power album is ready.
              </p>

              <p style="margin: 0 0 30px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                Go to the music section and listen now. You'll have instant access to the full <strong style="color: #d4af37;">POWER</strong> album in your music library. Stream it and download any track you want.
              </p>

              <!-- Next Steps Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background: rgba(212, 175, 55, 0.1); border-left: 4px solid #d4af37; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px; color: #d4af37; font-size: 18px; font-weight: 700;">
                      📧 Next Steps:
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #c5c5c5; font-size: 15px; line-height: 1.8;">
                      <li><strong>Visit the Music section</strong> on our portal</li>
                      <li>Find the Power album and <strong>hover over any track</strong> to see the download button</li>
                      <li>Download and enjoy!</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- What's Next -->
              <h3 style="margin: 30px 0 15px; color: #d4af37; font-size: 20px; font-weight: 700;">
                🔓 Community Access
              </h3>
              
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                After 7 days in the portal, you'll automatically unlock access to the Legion Community Hub — where you can connect with thousands of members from around the world, share your journey, and be part of something bigger.
              </p>

              <!-- CTA Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 25px; text-align: center;">
                    <a href="https://sol-portal.com" style="display: inline-block; background: #0a0a0a; color: #d4af37; font-size: 18px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                      Enter Your Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #e5e5e5; font-size: 16px; line-height: 1.6; text-align: center;">
                This is more than music. This is <strong style="color: #d4af37;">The Journey</strong>.
              </p>

              <p style="margin: 30px 0 0; color: #a5a5a5; font-size: 14px; line-height: 1.6;">
                Rock on,<br>
                <strong style="color: #d4af37;">The Sons of Legion</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(212, 175, 55, 0.05); padding: 30px 40px; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.2);">
              <p style="margin: 0 0 15px; color: #888; font-size: 13px; line-height: 1.5;">
                © ${new Date().getFullYear()} Sons of Legion. All rights reserved.
              </p>
              <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.5;">
                Questions? Contact us at <a href="mailto:info@sonsoflegion.com" style="color: #d4af37; text-decoration: none;">info@sonsoflegion.com</a>
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, phone, zipCode }: FreeAlbumEmailRequest = await req.json();

    console.log('Sending free album email to:', email);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [email],
      subject: "🎸 Your Free Power Album is Ready!",
      html: createFreeAlbumEmailHtml(name),
    });

    console.log('Free album email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Free album email sent successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-free-album-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});
