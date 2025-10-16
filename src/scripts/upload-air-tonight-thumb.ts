import { supabase } from "@/integrations/supabase/client";

async function uploadThumbnail() {
  // Fetch the image from public folder
  const response = await fetch('/temp-thumbnails/air-tonight.png');
  const blob = await response.blob();
  
  const fileName = `manual/air-tonight-${Date.now()}.jpg`;
  
  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (uploadError) {
    console.error('Upload error:', uploadError);
    return;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(fileName);
  
  // Update the video record
  const { error: updateError } = await supabase
    .from('videos')
    .update({ thumbnail_url: publicUrl })
    .eq('id', 'd64f0409-a964-47e9-964c-fe3f995bf1be');
  
  if (updateError) {
    console.error('Update error:', updateError);
    return;
  }
  
  console.log('Thumbnail updated successfully!', publicUrl);
}

// Run it
uploadThumbnail();
