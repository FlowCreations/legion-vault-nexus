import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_premium: boolean;
  storage_path: string;
  category?: string;
}

export const useVideos = () => {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, description, category, thumbnail_url, is_premium, storage_path')
        .neq('category', 'hero')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return {
        musicVideos: data?.filter(v => v.category === 'music_videos') || [],
        behindTheScenes: data?.filter(v => v.category === 'behind_the_scenes') || [],
        performances: data?.filter(v => v.category === 'performances') || [],
        documentary: data?.filter(v => v.category === 'documentary') || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHeroVideo = () => {
  return useQuery({
    queryKey: ['hero-video'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('category', 'hero')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return '';

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(data.storage_path);
      
      return publicUrl;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFavoriteVideos = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['favorite-videos', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: favData, error: favError } = await supabase
        .from('video_favorites')
        .select('video_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favError) throw favError;
      if (!favData || favData.length === 0) return [];

      const videoIds = favData.map(fav => fav.video_id);
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('id, title, description, category, thumbnail_url, is_premium, storage_path')
        .in('id', videoIds);

      if (videosError) throw videosError;
      return videosData || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
