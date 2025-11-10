import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyRequest = await req.json();

    console.log("Verifying token:", token.substring(0, 10) + "...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .is("verified_at", null)
      .single();

    if (fetchError || !verification) {
      console.error("Verification not found:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired verification token" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    if (now > expiresAt) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Verification token has expired" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark email as verified in auth.users
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (updateAuthError) {
      console.error("Error updating auth user:", updateAuthError);
      throw updateAuthError;
    }

    // Mark verification as complete
    const { error: updateVerifyError } = await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateVerifyError) {
      console.error("Error updating verification record:", updateVerifyError);
      throw updateVerifyError;
    }

    // Log successful verification
    await supabase.from("email_logs").insert({
      user_id: verification.user_id,
      email_type: "verification_complete",
      recipient_email: verification.email,
      status: "sent",
    });

    console.log("Email verified successfully for user:", verification.user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully",
        userId: verification.user_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-token:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
