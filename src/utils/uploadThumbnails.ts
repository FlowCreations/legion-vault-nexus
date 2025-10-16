import { supabase } from "@/integrations/supabase/client";
import carolinaThumb from "@/assets/thumbnails/carolina.png";
import airTonightThumb from "@/assets/thumbnails/air-tonight.png";
import powerThumb from "@/assets/thumbnails/power.png";
import runninThumb from "@/assets/thumbnails/runnin.png";

const thumbnails = {
  carolina: { url: carolinaThumb, id: "a9060ef1-7379-44b7-958b-a032aad0502a" },
  airTonight: { url: airTonightThumb, id: "2c08d164-9b3e-46b2-9c25-4da66846bfa2" },
  power: { url: powerThumb, id: "83324f40-d26f-4c2e-b5fc-496a2a95e03c" },
  runnin: { url: runninThumb, id: "a628f1bd-9c10-4556-9788-7b59d8316ad8" }
};

async function uploadThumbnails() {
  for (const [name, { url, id }] of Object.entries(thumbnails)) {
    try {
      // Fetch the image
      const response = await fetch(url);
      const blob = await response.blob();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) continue;
      
      const fileName = `${user.id}/${name}-${Date.now()}.png`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Upload error for ${name}:`, uploadError);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);
      
      // Update database
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: publicUrl })
        .eq('id', id);
      
      if (updateError) {
        console.error(`Update error for ${name}:`, updateError);
      } else {
        console.log(`Successfully updated ${name} thumbnail`);
      }
    } catch (error) {
      console.error(`Error processing ${name}:`, error);
    }
  }
  
  console.log('All thumbnails processed! Reloading page...');
  setTimeout(() => window.location.reload(), 1000);
}

// Auto-run disabled - thumbnails already uploaded
// if (window.location.pathname === '/videos/manage') {
//   uploadThumbnails();
// }

export { uploadThumbnails };
