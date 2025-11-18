import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[CONTACT-EMAIL] Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, subject, message }: ContactFormRequest = await req.json();
    
    console.log(`[CONTACT-EMAIL] Processing contact form from ${firstName} ${lastName} (${email})`);

    // Send email to Sons of Legion
    const emailResponse = await resend.emails.send({
      from: "Sons of Legion Contact Form <onboarding@resend.dev>",
      to: ["sonsoflegionmusic@gmail.com"],
      reply_to: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${firstName} ${lastName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">
              ${message}
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            This message was sent via the Sons of Legion contact form
          </p>
        </div>
      `,
    });

    console.log("[CONTACT-EMAIL] Email sent successfully:", emailResponse);

    // Send auto-reply to the person who filled out the form
    await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [email],
      subject: "Thanks for reaching out to Sons of Legion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 2px;">
              SONS OF LEGION
            </h1>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
            Thank you for reaching out!
          </h2>
          
          <p style="line-height: 1.6; color: #333;">
            Hi ${firstName},
          </p>
          
          <p style="line-height: 1.6; color: #333;">
            We have received your message and will get back to you as soon as possible.
          </p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Your message:</strong></p>
            <p style="margin: 5px 0; color: #666;">${subject}</p>
          </div>
          
          <p style="line-height: 1.6; color: #333;">
            Best regards,<br>
            Sons of Legion
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            Sons of Legion | Nashville, TN
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[CONTACT-EMAIL] Error:", error);
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
