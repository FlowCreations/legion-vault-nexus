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

    // Create ICS calendar file content
    const startDateTime = new Date(eventDetails.startDate);
    const endDateTime = new Date(eventDetails.endDate);
    
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SØL Live Studio//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${crypto.randomUUID()}@sol-live-studio.com
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

    // Send email with calendar invite using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SØL Live Studio <onboarding@resend.dev>',
        to: [email],
        subject: `Calendar Invite: ${eventDetails.title}`,
        html: `
          <h1>${eventDetails.title}</h1>
          <p>${eventDetails.description}</p>
          <p><strong>When:</strong> ${startDateTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}</p>
          <p><strong>Where:</strong> ${eventDetails.location}</p>
          <p>The calendar invite is attached to this email. Add it to your calendar so you don't miss it!</p>
          <p>See you there!<br>The SØL Team</p>
        `,
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

    const emailResponse = await resendResponse.json();
    console.log("Calendar invite sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
