import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarInviteRequest {
  email: string;
  eventDetails: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, eventDetails }: CalendarInviteRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Create ICS calendar file content
    const startDateTime = new Date(eventDetails.startDate);
    const endDateTime = new Date(eventDetails.endDate);
    
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sons of Legion//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${crypto.randomUUID()}@sonsoflegion.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDateTime)}
DTEND:${formatDateForICS(endDateTime)}
SUMMARY:${eventDetails.title}
DESCRIPTION:${eventDetails.description}
LOCATION:${eventDetails.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    console.log('Sending calendar invite to:', email);

    const formattedDate = startDateTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    });
    const formattedTime = startDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { color: #f7c946; font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 30px; }
    .event-section { background-color: #1a1a1a; border: 2px solid #f7c946; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
    .event-title { color: #ffffff; font-size: 24px; font-weight: bold; margin: 0 0 15px; }
    .description { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px; }
    .divider { border: none; border-top: 1px solid #333333; margin: 20px 0; }
    .detail-label { color: #f7c946; font-size: 14px; font-weight: bold; margin: 15px 0 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { color: #ffffff; font-size: 16px; margin: 0 0 5px; }
    .instructions { background-color: #1a1a1a; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .instructions p { color: #a0a0a0; font-size: 16px; line-height: 1.8; margin: 0 0 20px; }
    .instructions ul { color: #ffffff; font-size: 16px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px; }
    .instructions li { margin-bottom: 10px; }
    .signature { color: #ffffff; font-size: 16px; text-align: center; margin: 30px 0 0; }
    .team { color: #f7c946; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://dlwyndcvnunvomgkbkhn.supabase.co/storage/v1/object/public/profile-pictures/sol-logo-new.png" alt="Sons of Legion Logo" style="width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    <div class="header">Thanks for RSVPing!</div>
    <div class="event-section">
      <h2 class="event-title">${eventDetails.title}</h2>
      <p class="description">${eventDetails.description}</p>
      <hr class="divider" />
      <p class="detail-label">📅 When</p>
      <p class="detail-value">${formattedDate}</p>
      <p class="detail-value">${formattedTime}</p>
      <p class="detail-label">📍 Where</p>
      <p class="detail-value">${eventDetails.location}</p>
    </div>
    
    <div class="instructions">
      <p style="color: #f7c946; font-size: 18px; font-weight: bold; margin-bottom: 20px;">Your spot is confirmed!</p>
      
      <p>You'll get access directly through your Sons of Legion Portal account when the event starts.</p>
      
      <p style="font-weight: bold; color: #ffffff; margin-top: 25px;">To make sure you don't miss it:</p>
      <ul>
        <li>Add this event to your calendar (attached .ics file)</li>
        <li>Check that you're logged in before the start time</li>
        <li>Join early to connect with other members in chat</li>
      </ul>
      
      <p style="margin-top: 25px;">Can't wait to see you there.</p>
    </div>
    
    <p class="signature">
      <span class="team">The SØL Team 🛡️🔥🩸</span>
    </p>
  </div>
</body>
</html>
`;

    // Send email with calendar invite using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sons of Legion <hello@sonsoflegion.com>',
        to: [email],
        subject: `You're confirmed: ${eventDetails.title}`,
        html: emailHtml,
        attachments: [
          {
            filename: 'invite.ics',
            content: btoa(icsContent),
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const data = await resendResponse.json();

    console.log("Calendar invite sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending calendar invite:", error);
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
