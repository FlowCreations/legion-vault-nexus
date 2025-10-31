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
      { date: '2026-02-11', city: 'Springfield', state: 'MO', country: 'USA', venue: 'Regency Live', ticket_link: 'https://sonsoflegion.yapsody.com/event/index/1162013/sons-of-legion-regency-live', status: 'on_sale' },
      { date: '2026-02-13', city: 'Denver', state: 'CO', country: 'USA', venue: 'Gothic Theatre', ticket_link: 'https://www.axs.com/events/538348/sons-of-legion-tickets', status: 'on_sale' },
      { date: '2026-02-14', city: 'Denver', state: 'CO', country: 'USA', venue: 'Bluebird', status: 'on_sale' },
      { date: '2026-02-14', city: 'Albuquerque', state: 'NM', country: 'USA', venue: 'El Rey Theater', status: 'on_sale' },
      { date: '2026-02-16', city: 'Phoenix', state: 'AZ', country: 'USA', venue: 'Crescent', ticket_link: 'https://www.prekindle.com/event/119869', status: 'on_sale' },
      { date: '2026-02-17', city: 'Tucson', state: 'AZ', country: 'USA', venue: 'LaRosa', ticket_link: 'https://www.larosatucson.com/events/106826', status: 'on_sale' },
      { date: '2026-02-20', city: 'Rancho Mirage', state: 'CA', country: 'USA', venue: 'Agua Caliente', ticket_link: 'https://accc.livenation.com/event/vvG1BZ93DXIvPV', status: 'on_sale' },
      { date: '2026-02-21', city: 'Ventura', state: 'CA', country: 'USA', venue: 'Ventura Music Hall', ticket_link: 'https://www.axs.com/events/538362/sons-of-legion-tickets', status: 'on_sale' },
      { date: '2026-02-23', city: 'Solana Beach', state: 'CA', country: 'USA', venue: 'Belly Up', ticket_link: 'https://www.bellyup.com/events/detail/508652', status: 'on_sale' },
      { date: '2026-02-23', city: 'Del Mar', state: 'CA', country: 'USA', venue: 'The Sound', status: 'on_sale' },
      { date: '2026-02-24', city: 'Los Angeles', state: 'CA', country: 'USA', venue: 'Troubadour', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-troubadour-tickets/14230623', status: 'on_sale' },
      { date: '2026-02-25', city: 'Los Angeles', state: 'CA', country: 'USA', venue: "Bimbo's", ticket_link: 'https://www.bimbos365club.com/event/28862145', status: 'on_sale' },
      { date: '2026-02-27', city: 'San Francisco', state: 'CA', country: 'USA', venue: "Harlow's", ticket_link: 'https://www.harlows.com/event/28862147', status: 'on_sale' },
      { date: '2026-02-28', city: 'Sacramento', state: 'CA', country: 'USA', venue: 'Hawthorne', ticket_link: 'https://www.hawthornetheater.com/event/28862149', status: 'on_sale' },
      { date: '2026-03-02', city: 'Portland', state: 'OR', country: 'USA', venue: 'Roseland', status: 'on_sale' },
      { date: '2026-03-02', city: 'Portland', state: 'OR', country: 'USA', venue: 'Neumos', ticket_link: 'https://www.neumos.com/event/28862151', status: 'on_sale' },
      { date: '2026-03-03', city: 'Seattle', state: 'WA', country: 'USA', venue: 'Neumos', ticket_link: 'https://www.neumos.com/event/28862153', status: 'on_sale' },
      { date: '2026-03-04', city: 'Seattle', state: 'WA', country: 'USA', venue: 'Hollywood', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-el-corazon-tickets/14230625', status: 'on_sale' },
      { date: '2026-03-06', city: 'Vancouver', state: 'BC', country: 'Canada', venue: 'Rickshaw', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-rickshaw-theatre-tickets/14230627', status: 'on_sale' },
      { date: '2026-03-07', city: 'Vancouver', state: 'BC', country: 'Canada', venue: 'Fine Line', ticket_link: 'https://www.axs.com/events/538364/sons-of-legion-tickets', status: 'on_sale' },
      { date: '2026-03-13', city: 'Minneapolis', state: 'MN', country: 'USA', venue: 'Mississippi Moon Bar at Diamond Jo Casino', ticket_link: 'https://www.diamondjo.com/dubuque/entertainment/sons-of-legion', status: 'on_sale' },
      { date: '2026-03-14', city: 'Dubuque', state: 'IA', country: 'USA', venue: 'Turner Hall', ticket_link: 'https://www.pabsttheatergroup.com/show/28862155', status: 'on_sale' },
      { date: '2026-03-15', city: 'Milwaukee', state: 'WI', country: 'USA', venue: 'Vogue', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-vogue-tickets/14230629', status: 'on_sale' },
      { date: '2026-03-18', city: 'Pittsburgh', state: 'PA', country: 'USA', venue: 'Roxian', ticket_link: 'https://www.roxiantheatre.com/events/detail/sons-of-legion-2026-02-18', status: 'on_sale' },
      { date: '2026-03-20', city: 'Chicago', state: 'IL', country: 'USA', venue: 'Bottom Lounge', ticket_link: 'https://www.bottomlounge.com/event/28862157', status: 'on_sale' },
      { date: '2026-03-20', city: 'Chicago', state: 'IL', country: 'USA', venue: 'Park West', status: 'on_sale' },
      { date: '2026-03-21', city: 'Ferndale', state: 'MI', country: 'USA', venue: 'Loving Touch', ticket_link: 'https://www.thelovintouch.com/event/28862159', status: 'on_sale' },
      { date: '2026-03-22', city: 'Columbus', state: 'OH', country: 'USA', venue: 'A&R Bar', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-ar-bar-tickets/14230631', status: 'on_sale' },
      { date: '2026-03-26', city: 'Toronto', state: 'ON', country: 'Canada', venue: 'Opera House', ticket_link: 'https://www.ticketweb.com/event/sons-of-legion-opera-house-tickets/14230633', status: 'on_sale' },
      { date: '2026-03-27', city: 'Montreal', state: 'QC', country: 'Canada', venue: 'Beanfield Theatre', ticket_link: 'https://www.evenko.ca/en/events/59538/sons-of-legion', status: 'on_sale' },
      { date: '2026-03-28', city: 'Boston', state: 'MA', country: 'USA', venue: 'Paradise', ticket_link: 'https://www.crossroadspresents.com/event/28862161', status: 'on_sale' },
      { date: '2026-03-31', city: 'New York', state: 'NY', country: 'USA', venue: 'Bowery', ticket_link: 'https://www.boweryballroom.com/event/28862163', status: 'on_sale' },
      { date: '2026-04-01', city: 'New York', state: 'NY', country: 'USA', venue: 'Bowery', ticket_link: 'https://www.boweryballroom.com/event/28862165', status: 'on_sale' },
      { date: '2026-04-03', city: 'Norfolk', state: 'VA', country: 'USA', venue: 'NorVa', ticket_link: 'https://www.thenorva.com/events/detail/508654', status: 'on_sale' },
      { date: '2026-04-04', city: 'Richmond', state: 'VA', country: 'USA', venue: 'National', ticket_link: 'https://www.thenationalva.com/events/detail/508656', status: 'on_sale' },
      { date: '2026-04-06', city: 'Philadelphia', state: 'PA', country: 'USA', venue: 'Underground Arts', ticket_link: 'https://www.undergroundarts.org/events/detail/508658', status: 'on_sale' },
      { date: '2026-04-07', city: 'Washington', state: 'DC', country: 'USA', venue: 'Hamilton', ticket_link: 'https://www.thehamiltondc.com/events/detail/508660', status: 'on_sale' },
      { date: '2026-04-08', city: 'Charlotte', state: 'NC', country: 'USA', venue: 'Underground', ticket_link: 'https://www.fillmoreunderground.com/event/28862167', status: 'on_sale' },
      { date: '2026-04-10', city: 'Ft Lauderdale', state: 'FL', country: 'USA', venue: 'Tortuga', status: 'on_sale' },
      { date: '2026-04-11', city: 'St. Petersburg', state: 'FL', country: 'USA', venue: 'Jannus', ticket_link: 'https://www.jannuslive.com/events/detail/508662', status: 'on_sale' },
      { date: '2026-04-12', city: 'Jacksonville', state: 'FL', country: 'USA', venue: 'FIVE', ticket_link: 'https://www.fivepoints.com/event/28862169', status: 'on_sale' },
      { date: '2026-04-16', city: 'Huntsville', state: 'AL', country: 'USA', venue: 'Mars Music Hall', status: 'on_sale' },
      { date: '2026-04-17', city: 'Biloxi', state: 'MS', country: 'USA', venue: 'IP Casino, Resort & Spa', ticket_link: 'https://www.ipcasinoresort.com/events/sons-of-legion', status: 'on_sale' },
      { date: '2026-05-06', city: 'Charlotte', state: 'NC', country: 'USA', venue: 'Evening Muse', ticket_link: 'https://www.eveningmuse.com/event/28862171', status: 'on_sale' },
      { date: '2026-05-08', city: 'Nashville', state: 'TN', country: 'USA', venue: 'Exit/In', ticket_link: 'https://www.exitin.com/event/28862173', status: 'on_sale' },
      { date: '2026-05-09', city: 'Nashville', state: 'TN', country: 'USA', venue: 'Exit/In', ticket_link: 'https://www.exitin.com/event/28862175', status: 'on_sale' },
      { date: '2026-05-10', city: 'Atlanta', state: 'GA', country: 'USA', venue: 'Buckhead Theater', ticket_link: 'https://www.buckheadtheatre.com/events/detail/508664', status: 'on_sale' },
      { date: '2026-05-12', city: 'New Orleans', state: 'LA', country: 'USA', venue: 'House of Blues', ticket_link: 'https://www.houseofblues.com/neworleans/event/28862177', status: 'on_sale' },
      { date: '2026-05-14', city: 'Houston', state: 'TX', country: 'USA', venue: 'House of Blues', ticket_link: 'https://www.houseofblues.com/houston/event/28862179', status: 'on_sale' },
      { date: '2026-05-15', city: 'Austin', state: 'TX', country: 'USA', venue: 'Scoot Inn', ticket_link: 'https://www.scootinnaustin.com/event/28862181', status: 'on_sale' },
      { date: '2026-05-16', city: 'Dallas', state: 'TX', country: 'USA', venue: 'Granada Theater', ticket_link: 'https://www.prekindle.com/event/119871', status: 'on_sale' },
      { date: '2026-05-19', city: 'Oklahoma City', state: 'OK', country: 'USA', venue: 'Tower', ticket_link: 'https://www.prekindle.com/event/119873', status: 'on_sale' },
      { date: '2026-05-20', city: 'Kansas City', state: 'MO', country: 'USA', venue: 'Madrid', ticket_link: 'https://www.themadridkc.com/event/28862183', status: 'on_sale' },
      { date: '2026-05-21', city: 'St Louis', state: 'MO', country: 'USA', venue: 'Delmar Hall', ticket_link: 'https://www.delmarhall.com/event/28862185', status: 'on_sale' },
      { date: '2026-05-21', city: 'St Louis', state: 'MO', country: 'USA', venue: 'Pageant', status: 'on_sale' },
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
