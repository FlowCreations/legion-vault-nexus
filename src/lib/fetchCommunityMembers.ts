import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export async function fetchCommunityMembers() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(`
      id, 
      display_name, 
      location, 
      latitude, 
      longitude,
      watch_time,
      listen_time,
      livestream_engagement_score,
      tier
    `);

  if (error) {
    console.error("Error loading user directory:", error);
    return [];
  }

  // Only return members with valid coordinates
  // This prevents the "Gulf of Mexico" bug (null island at 0,0)
  return (data ?? []).filter(
    (m) =>
      m.latitude !== null &&
      m.longitude !== null &&
      !isNaN(m.latitude) &&
      !isNaN(m.longitude)
  );
}
