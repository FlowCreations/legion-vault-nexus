import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialEmailRequest {
  email: string;
  customerName?: string;
  planType: string;
  daysRemaining: number;
  trialEndsAt: string;
  features: string[];
  price: number;
}

const getTierFeatures = (planType: string): string[] => {
  const features: { [key: string]: string[] } = {
    'Rebels': [
      '🎥 Behind-the-scenes videos',
      '💬 Community post access',
      '🎵 Premium albums',
      '🎭 Exclusive performances'
    ],
    'Outlaws': [
      '🎥 All Rebels features',
      '📸 Gallery access',
      '🎬 Documentary content',
      '🎸 Live Studio access',
      '🎪 Advanced community features'
    ],
    'Legionnaires': [
      '⚡ All Outlaws features',
      '🎁 Merch discounts (15%)',
      '🚀 Early access to releases',
      '👑 Priority support',
      '🌟 VIP status & perks'
    ]
  };
  return features[planType] || features['Rebels'];
};

const getEmailContent = (data: TrialEmailRequest): { subject: string; html: string } => {
  const { customerName, planType, daysRemaining, trialEndsAt, features, price } = data;
  const formattedDate = new Date(trialEndsAt).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  if (daysRemaining === 3) {
    return {
      subject: `⏰ Your ${planType} Trial Ends in 3 Days - Here's What You Get!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f7c946 0%, #d4af37 100%);">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: bold;">Sons of Legion</h1>
                    </td>
                  </tr>
                  
                  <!-- Countdown Banner -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #2a2a2a; border-bottom: 3px solid #f7c946;">
                      <div style="text-align: center;">
                        <p style="margin: 0 0 10px; color: #f7c946; font-size: 16px; font-weight: 600; letter-spacing: 1px;">YOUR TRIAL ENDS IN</p>
                        <h2 style="margin: 0; color: #ffffff; font-size: 48px; font-weight: bold;">3 DAYS</h2>
                        <p style="margin: 10px 0 0; color: #cccccc; font-size: 14px;">${formattedDate}</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Greeting -->
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">Hey ${customerName || 'there'}! 👋</h2>
                      <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
                        You've been experiencing all the exclusive content and benefits of our <span style="color: #f7c946; font-weight: 600;">${planType}</span> tier. In just 3 days, your trial will end.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Features Section -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <h3 style="margin: 0 0 20px; color: #f7c946; font-size: 20px;">What You'll Keep Forever:</h3>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${features.map(feature => `
                          <tr>
                            <td style="padding: 12px; background-color: #2a2a2a; border-radius: 8px; margin-bottom: 10px;">
                              <p style="margin: 0; color: #ffffff; font-size: 16px;">${feature}</p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                        `).join('')}
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Pricing -->
                  <tr>
                    <td style="padding: 30px 40px; text-align: center; background-color: #2a2a2a;">
                      <p style="margin: 0 0 10px; color: #cccccc; font-size: 14px;">Continue for only</p>
                      <h3 style="margin: 0; color: #f7c946; font-size: 36px; font-weight: bold;">$${price}/month</h3>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 13px;">Cancel anytime, no commitment required</p>
                    </td>
                  </tr>
                  
                  <!-- CTA Buttons -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/checkout?plan=${planType.toLowerCase()}" 
                               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f7c946 0%, #d4af37 100%); color: #0a0a0a; text-decoration: none; font-size: 18px; font-weight: bold; border-radius: 8px; margin-bottom: 15px;">
                              Continue My ${planType} Membership
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/pricing" 
                               style="display: inline-block; padding: 12px 30px; background-color: transparent; color: #f7c946; text-decoration: none; font-size: 14px; border: 2px solid #f7c946; border-radius: 8px;">
                              Explore Other Plans
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Social Proof -->
                  <tr>
                    <td style="padding: 20px 40px 40px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        ⭐ Join 10,000+ Legion Members experiencing exclusive content
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #2a2a2a;">
                      <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                        Questions? Reply to this email or visit our support page.<br>
                        You're receiving this because you started a ${planType} trial.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };
  } else if (daysRemaining === 1) {
    return {
      subject: `⚡ Last Chance: Your ${planType} Trial Ends Tomorrow!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 2px solid #f7c946;">
                  <!-- Urgent Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #d4af37 0%, #f7c946 100%);">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: bold;">⚡ LAST CHANCE ⚡</h1>
                    </td>
                  </tr>
                  
                  <!-- Countdown -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #2a2a2a;">
                      <div style="text-align: center;">
                        <h2 style="margin: 0; color: #f7c946; font-size: 52px; font-weight: bold;">24 HOURS</h2>
                        <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px;">Until your ${planType} access expires</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Message -->
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">Don't lose access, ${customerName || 'friend'}!</h2>
                      <p style="margin: 0 0 20px; color: #cccccc; font-size: 16px; line-height: 1.6;">
                        Tomorrow at this time, you'll lose access to all your exclusive <span style="color: #f7c946; font-weight: 600;">${planType}</span> benefits.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- What You'll Lose -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <div style="background-color: #2a2a2a; border-left: 4px solid #f7c946; padding: 20px; border-radius: 8px;">
                        <h3 style="margin: 0 0 15px; color: #f7c946; font-size: 18px;">Tomorrow You'll Lose Access To:</h3>
                        ${features.map(feature => `
                          <p style="margin: 8px 0; color: #ffffff; font-size: 15px;">❌ ${feature}</p>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Comparison -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="48%" style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; vertical-align: top;">
                            <h4 style="margin: 0 0 15px; color: #999999; font-size: 16px; text-align: center;">Free Tier</h4>
                            <p style="margin: 5px 0; color: #666666; font-size: 14px;">Basic content only</p>
                            <p style="margin: 5px 0; color: #666666; font-size: 14px;">Limited access</p>
                            <p style="margin: 5px 0; color: #666666; font-size: 14px;">No exclusives</p>
                          </td>
                          <td width="4%"></td>
                          <td width="48%" style="background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%); padding: 20px; border-radius: 8px; border: 2px solid #f7c946; vertical-align: top;">
                            <h4 style="margin: 0 0 15px; color: #f7c946; font-size: 16px; text-align: center;">${planType} ⭐</h4>
                            <p style="margin: 5px 0; color: #ffffff; font-size: 14px;">All exclusive content</p>
                            <p style="margin: 5px 0; color: #ffffff; font-size: 14px;">Full community access</p>
                            <p style="margin: 5px 0; color: #ffffff; font-size: 14px;">Premium features</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Pricing -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center;">
                      <h3 style="margin: 0; color: #f7c946; font-size: 36px; font-weight: bold;">Only $${price}/month</h3>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 13px;">Less than a cup of coffee per week</p>
                    </td>
                  </tr>
                  
                  <!-- Strong CTA -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/checkout?plan=${planType.toLowerCase()}" 
                               style="display: inline-block; padding: 20px 50px; background: linear-gradient(135deg, #f7c946 0%, #d4af37 100%); color: #0a0a0a; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(247, 201, 70, 0.3);">
                              🔒 Secure My Access Now
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #2a2a2a;">
                      <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                        Your trial expires ${formattedDate}<br>
                        Need more time? <a href="mailto:support@sonsoflegion.com" style="color: #f7c946;">Contact us</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };
  } else {
    // Expiration day (0 days)
    return {
      subject: `😔 Your ${planType} Trial Has Expired - But You Can Still Join!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #666666 0%, #999999 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">We miss you already! 😔</h1>
                    </td>
                  </tr>
                  
                  <!-- Status -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #2a2a2a;">
                      <div style="text-align: center;">
                        <p style="margin: 0 0 10px; color: #cccccc; font-size: 16px;">Your ${planType} trial has ended</p>
                        <h2 style="margin: 0; color: #999999; font-size: 18px; font-weight: normal;">${formattedDate}</h2>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Message -->
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">Hey ${customerName || 'there'},</h2>
                      <p style="margin: 0 0 20px; color: #cccccc; font-size: 16px; line-height: 1.6;">
                        Your <span style="color: #f7c946; font-weight: 600;">${planType}</span> trial has come to an end, but the good news is you can jump right back in anytime!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- What They're Missing -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <div style="background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); border: 2px solid #f7c946; padding: 25px; border-radius: 12px;">
                        <h3 style="margin: 0 0 20px; color: #f7c946; font-size: 20px; text-align: center;">Here's What You're Missing Right Now:</h3>
                        ${features.map(feature => `
                          <p style="margin: 12px 0; color: #ffffff; font-size: 16px; padding-left: 10px;">✨ ${feature}</p>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Testimonial -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <div style="background-color: #2a2a2a; padding: 20px; border-left: 4px solid #f7c946; border-radius: 8px;">
                        <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; font-style: italic;">
                          "Being a ${planType} member has completely transformed how I connect with the music and the community. It's worth every penny!"
                        </p>
                        <p style="margin: 0; color: #f7c946; font-size: 13px;">— Current ${planType} Member</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Pricing -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #cccccc; font-size: 14px;">Rejoin for only</p>
                      <h3 style="margin: 0; color: #f7c946; font-size: 40px; font-weight: bold;">$${price}/month</h3>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 13px;">Cancel anytime • No commitment • Full access instantly</p>
                    </td>
                  </tr>
                  
                  <!-- CTA -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/checkout?plan=${planType.toLowerCase()}" 
                               style="display: inline-block; padding: 20px 50px; background: linear-gradient(135deg, #f7c946 0%, #d4af37 100%); color: #0a0a0a; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px; margin-bottom: 15px;">
                              🎵 Reactivate My ${planType} Membership
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top: 15px;">
                            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/pricing" 
                               style="display: inline-block; padding: 14px 35px; background-color: transparent; color: #f7c946; text-decoration: none; font-size: 15px; border: 2px solid #f7c946; border-radius: 8px;">
                              Or Start with Rebels Instead
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #2a2a2a;">
                      <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                        Have questions? <a href="mailto:support@sonsoflegion.com" style="color: #f7c946;">Let's chat</a><br>
                        You can reactivate your membership anytime.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: TrialEmailRequest = await req.json();
    console.log('Sending trial expiration warning:', { 
      email: data.email, 
      planType: data.planType, 
      daysRemaining: data.daysRemaining 
    });

    const features = data.features.length > 0 ? data.features : getTierFeatures(data.planType);
    const { subject, html } = getEmailContent({ ...data, features });

    const emailResponse = await resend.emails.send({
      from: "Sons of Legion <onboarding@resend.dev>",
      to: [data.email],
      subject,
      html,
    });

    console.log('Trial expiration email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error sending trial expiration warning:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
