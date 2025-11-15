import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_name?: string;
  user_avatar?: string | null;
}

export const useVideoComments = (videoId: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData) return [];

      // Then get user profiles for those comments
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Combine the data
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return commentsData.map(comment => {
        const profile = profileMap.get(comment.user_id);
        return {
          ...comment,
          user_name: profile?.display_name || 'Anonymous',
          user_avatar: profile?.avatar_url,
        };
      }) as VideoComment[];
    },
    enabled: !!videoId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in to comment');
      
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Track comment event for analytics  
      await supabase.from('events').insert([{
        member_id: user.id,
        content_id: videoId,
        type: 'comment',
        meta: {
          comment_length: content.length,
        },
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to post comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
};
