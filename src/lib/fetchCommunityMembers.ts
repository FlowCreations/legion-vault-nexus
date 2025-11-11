import { supabase } from "@/integrations/supabase/client";

export async function fetchCommunityMembers() {
  console.log("🔍 Fetching community members...");
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, display_name, location, latitude, longitude, watch_time, listen_time, livestream_engagement_score, tier");

  if (error) {
    console.error("❌ Error loading user directory:", error);
    return [];
  }

  console.log("📦 Raw directory rows:", data?.length, data);

  const valid = (data ?? []).filter(
    (m) =>
      m.latitude !== null &&
      m.longitude !== null &&
      !isNaN(m.latitude) &&
      !isNaN(m.longitude)
  );

  console.log("✅ Members with usable map coordinates:", valid.length);
  if (valid.length > 0) {
    console.log("Sample member:", valid[0]);
  }
  
  return valid;
}
