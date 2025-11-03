import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViberateApiResponse {
  rank: number;
  artist_name: string;
  country: string;
  genre: string;
  label: string;
  viberate_rank: number;
  spotify_rank: number;
  spotify_followers_1m: number;
  spotify_followers_total: number;
  spotify_streams_1m: number;
  spotify_streams_total: number;
  spotify_monthly_listeners_1m: number;
  spotify_monthly_listeners_total: number;
  spotify_playlist_reach_total: number;
  youtube_rank: number;
  youtube_subscribers_1m: number;
  youtube_subscribers_total: number;
  youtube_views_1m: number;
  youtube_views_total: number;
  youtube_likes_1m: number;
  youtube_likes_total: number;
  social_rank: number;
  tiktok_followers_1m: number;
  tiktok_followers_total: number;
  tiktok_likes_1m: number;
  tiktok_views_1m: number;
  instagram_followers_1m: number;
  instagram_followers_total: number;
  instagram_likes_1m: number;
  facebook_followers_1m: number;
  facebook_followers_total: number;
  deezer_fans_1m?: number;
  deezer_fans_total?: number;
  deezer_rank?: number;
  soundcloud_followers_1m?: number;
  soundcloud_followers_total?: number;
  soundcloud_plays_1m?: number;
  soundcloud_rank?: number;
  shazam_shazams_1m?: number;
  shazam_rank?: number;
  beatport_rank?: number;
  beatport_tracks_total?: number;
  beatport_followers?: number;
  radio_airplay_rank: number;
  radio_airplay_spins_1m: number;
  radio_airplay_countries_1m: number;
  radio_airplay_stations_1m: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Viberate sync...');

    const apiKey = Deno.env.get('VIBERATE_API_KEY');
    if (!apiKey) {
      throw new Error('VIBERATE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default artist ID for Sons of Legion
    const { artist_id = 'sons-of-legion' } = await req.json().catch(() => ({}));

    console.log(`Fetching Viberate data for artist: ${artist_id}`);

    // Fetch from Viberate API
    const apiResponse = await fetch(`https://api.viberate.com/api/v3/artist/${artist_id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`Viberate API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const viberateData: ViberateApiResponse = await apiResponse.json();
    console.log('✅ Viberate API response received for:', viberateData.artist_name);
    console.log('📊 Full API Response:', JSON.stringify(viberateData, null, 2));

    // Transform to match frontend TypeScript interfaces
    const metricsData = {
      rank: viberateData.rank || 0,
      artist: viberateData.artist_name || 'Sons of Legion',
      country: viberateData.country || 'United States',
      genre: viberateData.genre || 'Rock',
      label: viberateData.label || 'Other Indie / Unsigned',
      viberateRank: viberateData.viberate_rank || 0,
      spotify: {
        rank: viberateData.spotify_rank || 0,
        followers: viberateData.spotify_followers_total || 0,
        followersChange1m: viberateData.spotify_followers_1m || 0,
        totalStreams: viberateData.spotify_streams_total || 0,
        totalStreamsChange1m: viberateData.spotify_streams_1m || 0,
        monthlyListeners: viberateData.spotify_monthly_listeners_total || 0,
        monthlyListenersChange1m: viberateData.spotify_monthly_listeners_1m || 0,
        playlistReach: viberateData.spotify_playlist_reach_total || 0,
        playlistReachChange1m: 0,
      },
      youtube: {
        rank: viberateData.youtube_rank || 0,
        subscribers: viberateData.youtube_subscribers_total || 0,
        subscribersChange1m: viberateData.youtube_subscribers_1m || 0,
        totalViews: viberateData.youtube_views_total || 0,
        totalViewsChange1m: viberateData.youtube_views_1m || 0,
        totalLikes: viberateData.youtube_likes_total || 0,
        totalLikesChange1m: viberateData.youtube_likes_1m || 0,
      },
      tiktok: {
        rank: 0,
        followers: viberateData.tiktok_followers_total || 0,
        followersChange1m: viberateData.tiktok_followers_1m || 0,
        totalLikes: viberateData.tiktok_likes_1m || 0,
        totalViews1m: viberateData.tiktok_views_1m || 0,
      },
      instagram: {
        rank: 0,
        followers: viberateData.instagram_followers_total || 0,
        followersChange1m: viberateData.instagram_followers_1m || 0,
        totalLikes1m: viberateData.instagram_likes_1m || 0,
      },
      facebook: {
        rank: 0,
        followers: viberateData.facebook_followers_total || 0,
        followersChange1m: viberateData.facebook_followers_1m || 0,
      },
      deezer: {
        fans: viberateData.deezer_fans_total || 0,
        fansChange1m: viberateData.deezer_fans_1m || 0,
        rank: viberateData.deezer_rank || 0,
      },
      soundcloud: {
        followers: viberateData.soundcloud_followers_total || 0,
        followersChange1m: viberateData.soundcloud_followers_1m || 0,
        plays: viberateData.soundcloud_plays_1m || 0,
        rank: viberateData.soundcloud_rank || 0,
      },
      shazam: {
        shazams1m: viberateData.shazam_shazams_1m || 0,
        rank: viberateData.shazam_rank || 0,
      },
      beatport: {
        followers: viberateData.beatport_followers || 0,
        rank: viberateData.beatport_rank || 0,
      },
      socialRank: viberateData.social_rank || 0,
      radioAirplay: {
        rank: viberateData.radio_airplay_rank || 0,
        spins1m: viberateData.radio_airplay_spins_1m || 0,
        countries1m: viberateData.radio_airplay_countries_1m || 0,
        stations1m: viberateData.radio_airplay_stations_1m || 0,
      },
    };

    console.log('🔄 Transformed data structure:', JSON.stringify(metricsData, null, 2));

    // Store in database
    const { error: insertError } = await supabase
      .from('viberate_metrics')
      .insert({
        artist_id,
        artist_name: viberateData.artist_name || 'Sons of Legion',
        data: metricsData,
        synced_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Viberate data synced successfully to database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        artist: viberateData.artist_name,
        synced_at: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});