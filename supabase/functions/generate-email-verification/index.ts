import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  userId: string;
  email: string;
  firstName?: string;
}

const createVerificationEmailHtml = (firstName: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);">
    
    <!-- Header with Logo -->
    <div style="text-align: center; padding: 40px 20px 20px; background: linear-gradient(135deg, #D4AF37 0%, #F4E5B8 50%, #D4AF37 100%);">
      <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px; background: rgba(212, 175, 55, 0.05); border-top: 2px solid #D4AF37; border-bottom: 2px solid #D4AF37;">
      <h1 style="color: #fff; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
        Verify Your Email
      </h1>
      
      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hey ${firstName},
      </p>
      
      <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Welcome to the Legion! You're just one step away from joining our community. Click the button below to verify your email and unlock access to exclusive content, live shows, and more.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #F4E5B8 50%, #D4AF37 100%); color: #000; text-decoration: none; font-weight: bold; font-size: 18px; border-radius: 8px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
          VERIFY EMAIL
        </a>
      </div>

      <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
        This verification link expires in 24 hours
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 30px; text-align: center; background: #0a0a0a;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
        Can't click the button? Copy and paste this link into your browser:
      </p>
      <p style="color: #D4AF37; font-size: 12px; word-break: break-all; margin: 0 0 20px 0;">
        ${verificationUrl}
      </p>
      
      <p style="color: #666; font-size: 12px; margin: 20px 0 0 0;">
        If you didn't create an account, you can safely ignore this email.
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
        <p style="color: #D4AF37; font-size: 12px; margin: 0; letter-spacing: 2px;">
          SONS OF LEGION
        </p>
        <p style="color: #666; font-size: 11px; margin: 5px 0 0 0;">
          © ${new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName = "there" }: VerificationRequest = await req.json();

    console.log("Generating verification for:", { userId, email });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate secure verification token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    // Store verification token
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: userId,
        token,
        email,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification token:", insertError);
      throw insertError;
    }

    // Create verification URL
    const verificationUrl = `${req.headers.get("origin") || "https://sonsoflegion.com"}/verify-email?token=${token}`;

    // Send verification email
    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <hello@sonsoflegion.com>",
      to: [email],
      subject: "Verify Your Email - Sons of Legion",
      html: createVerificationEmailHtml(firstName, verificationUrl),
    });

    console.log("Verification email sent:", emailResponse);

    // Log the email send
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: "verification",
      recipient_email: email,
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-email-verification:", error);
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
