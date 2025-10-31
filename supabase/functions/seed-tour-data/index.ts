import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TourShow {
  date: string;
  city: string;
  state?: string;
  country: string;
  venue: string;
  ticket_link?: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Tour data from the PDF
    const tourData: TourShow[] = [
      { date: '2026-02-11', city: 'Springfield', state: 'MO', country: 'USA', venue: 'Regency Live', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-13', city: 'Denver', state: 'CO', country: 'USA', venue: 'Gothic Theatre', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-14', city: 'Denver', state: 'CO', country: 'USA', venue: 'Bluebird', status: 'on_sale' },
      { date: '2026-02-14', city: 'Albuquerque', state: 'NM', country: 'USA', venue: 'El Rey Theater', status: 'on_sale' },
      { date: '2026-02-16', city: 'Phoenix', state: 'AZ', country: 'USA', venue: 'Crescent', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-17', city: 'Tucson', state: 'AZ', country: 'USA', venue: 'LaRosa', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-20', city: 'Rancho Mirage', state: 'CA', country: 'USA', venue: 'Agua Caliente', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-21', city: 'Ventura', state: 'CA', country: 'USA', venue: 'Ventura Music Hall', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-23', city: 'Solana Beach', state: 'CA', country: 'USA', venue: 'Belly Up', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-23', city: 'Del Mar', state: 'CA', country: 'USA', venue: 'The Sound', status: 'on_sale' },
      { date: '2026-02-24', city: 'Los Angeles', state: 'CA', country: 'USA', venue: 'Troubadour', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-25', city: 'Los Angeles', state: 'CA', country: 'USA', venue: "Bimbo's", ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-27', city: 'San Francisco', state: 'CA', country: 'USA', venue: "Harlow's", ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-02-28', city: 'Sacramento', state: 'CA', country: 'USA', venue: 'Hawthorne', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-02', city: 'Portland', state: 'OR', country: 'USA', venue: 'Roseland', status: 'on_sale' },
      { date: '2026-03-02', city: 'Portland', state: 'OR', country: 'USA', venue: 'Neumos', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-03', city: 'Seattle', state: 'WA', country: 'USA', venue: 'Neumos', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-04', city: 'Seattle', state: 'WA', country: 'USA', venue: 'Hollywood', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-06', city: 'Vancouver', state: 'BC', country: 'Canada', venue: 'Rickshaw', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-07', city: 'Vancouver', state: 'BC', country: 'Canada', venue: 'Fine Line', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-13', city: 'Minneapolis', state: 'MN', country: 'USA', venue: 'Mississippi Moon Bar at Diamond Jo Casino', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-14', city: 'Dubuque', state: 'IA', country: 'USA', venue: 'Turner Hall', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-15', city: 'Milwaukee', state: 'WI', country: 'USA', venue: 'Vogue', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-18', city: 'Pittsburgh', state: 'PA', country: 'USA', venue: 'Roxian', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-20', city: 'Chicago', state: 'IL', country: 'USA', venue: 'Bottom Lounge', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-21', city: 'Indianapolis', state: 'IN', country: 'USA', venue: 'HI-FI', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-23', city: 'Detroit', state: 'MI', country: 'USA', venue: 'El Club', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-24', city: 'Columbus', state: 'OH', country: 'USA', venue: 'Skully\'s', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-25', city: 'Cleveland', state: 'OH', country: 'USA', venue: 'Grog Shop', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-27', city: 'Buffalo', state: 'NY', country: 'USA', venue: 'Mohawk Place', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-28', city: 'Toronto', state: 'ON', country: 'Canada', venue: 'Horseshoe Tavern', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-03-30', city: 'Montreal', state: 'QC', country: 'Canada', venue: 'Foufounes Électriques', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-04-01', city: 'Boston', state: 'MA', country: 'USA', venue: 'Paradise Rock Club', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-04-02', city: 'New York', state: 'NY', country: 'USA', venue: 'Bowery Ballroom', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-04-03', city: 'Philadelphia', state: 'PA', country: 'USA', venue: 'Underground Arts', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-04-04', city: 'Baltimore', state: 'MD', country: 'USA', venue: 'Ottobar', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
      { date: '2026-04-05', city: 'Washington', state: 'DC', country: 'USA', venue: 'Black Cat', ticket_link: 'https://www.ticketmaster.com', status: 'on_sale' },
    ];

    // Insert tour data
    const { error } = await supabase
      .from('tour_shows')
      .insert(tourData);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully seeded ${tourData.length} tour shows` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
