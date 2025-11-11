import { supabase } from '@/integrations/supabase/client';

export type CommunityMemberPoint = {
  id: string;
  displayName: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/**
 * Check if Heartbeat integration is enabled
 */
export async function isHeartbeatEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', 'enable_heartbeat_integration')
      .single();
    
    if (error) {
      console.error('Error checking heartbeat flag:', error);
      return false;
    }
    
    return data?.enabled ?? false;
  } catch (error) {
    console.error('Failed to check heartbeat flag:', error);
    return false;
  }
}

/**
 * Fetches community members from the directory with their location data.
 * This uses the same data source as the community hub member directory.
 */
export async function fetchCommunityMembers(): Promise<CommunityMemberPoint[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, location, latitude, longitude, heartbeat_member_id')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(560);

    if (error) {
      console.error('Error fetching community members:', error);
      return [];
    }

    if (!data) return [];

    // Normalize the data into our expected format
    return data.map((member, index) => {
      // Parse location string if available (e.g., "Nashville, TN, USA")
      const locationParts = member.location?.split(',').map((s) => s.trim()) || [];
      
      return {
        id: member.user_id || member.heartbeat_member_id || `member-${index}`,
        displayName: member.display_name || 'Community Member',
        city: locationParts[0] || null,
        region: locationParts[1] || null,
        country: locationParts[2] || locationParts[locationParts.length - 1] || null,
        lat: member.latitude,
        lng: member.longitude,
      };
    });
  } catch (error) {
    console.error('Failed to fetch community members:', error);
    return [];
  }
}

/**
 * Determines if a member is in America (North America) or World based on country
 */
export function getTerritoryGroup(country: string | null | undefined): 'america' | 'world' {
  if (!country) return 'world';
  
  const americaCountries = [
    'usa',
    'united states',
    'united states of america',
    'us',
    'canada',
    'mexico',
    'costa rica',
    'panama',
    'guatemala',
    'belize',
    'honduras',
    'el salvador',
    'nicaragua',
  ];
  
  const normalizedCountry = country.toLowerCase().trim();
  return americaCountries.includes(normalizedCountry) ? 'america' : 'world';
}
