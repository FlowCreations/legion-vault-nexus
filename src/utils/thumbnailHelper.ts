import { supabase } from "@/integrations/supabase/client";

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export async function setVideoThumbnail(videoId: string, imageFile: File) {
  try {
    const base64Image = await fileToBase64(imageFile);
    
    const { data, error } = await supabase.functions.invoke('set-thumbnail', {
      body: { videoId, imageBase64: base64Image }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting thumbnail:', error);
    throw error;
  }
}
