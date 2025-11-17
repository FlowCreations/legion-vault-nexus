import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVideoComments } from '@/hooks/useVideoComments';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, X } from 'lucide-react';

interface VideoCommentsProps {
  videoId: string;
  showComments?: boolean;
  onToggleComments?: () => void;
}

export const VideoComments = ({ 
  videoId, 
  showComments = false,
  onToggleComments
}: VideoCommentsProps) => {
  const [commentText, setCommentText] = useState('');
  const { comments, isLoading, addComment, isAddingComment } = useVideoComments(videoId);
  const { user } = useAuth();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`video-comments-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_comments',
          filter: `video_id=eq.${videoId}`,
        },
        () => {
          // Comments will auto-refresh via the useVideoComments hook
          // No need to reload the entire page
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isAddingComment) return;
    
    addComment(commentText);
    setCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent spacebar from triggering video controls
    e.stopPropagation();
    
    // Submit on Enter (allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Don't show floating button - comments are integrated into the video player
  if (!showComments) {
    return null;
  }

  // Full comments panel
  const commentsPanel = (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Comments ({comments.length})
          </h3>
        </div>
        <button
          onClick={onToggleComments}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="min-h-[60px] bg-white/10 border-white/10 text-foreground placeholder:text-muted-foreground resize-none focus:ring-primary/20 text-sm"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {commentText.length}/500
            </span>
            <Button
              type="submit"
              disabled={!commentText.trim() || isAddingComment}
              size="sm"
              className="gap-2 h-8 text-xs"
            >
              <Send className="w-3 h-3" />
              {isAddingComment ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-3 border border-white/10 rounded-lg bg-white/5 text-center">
          <p className="text-muted-foreground text-sm mb-2">Sign in to comment</p>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Sign In
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={comment.user_avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(comment.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {comment.user_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  // Always use slide-out panel when comments are open
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-background/95 backdrop-blur-xl border-l border-white/10 z-50 p-6 overflow-y-auto"
      >
        {commentsPanel}
      </motion.div>
    </AnimatePresence>
  );
};
