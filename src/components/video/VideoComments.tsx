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
  isCompact?: boolean;
  showComments?: boolean;
  onToggleComments?: () => void;
  onClose?: () => void;
}

export const VideoComments = ({ 
  videoId, 
  isCompact = false, 
  showComments = false,
  onToggleComments,
  onClose 
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
          // Refresh comments when new comment is added
          window.location.reload(); // Simple refresh for now
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
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
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

  // Compact mode - just a floating button
  if (isCompact && !showComments) {
    return (
      <button
        onClick={onToggleComments}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm shadow-lg shadow-primary/20 border border-primary/20"
      >
        <MessageSquare className="w-5 h-5 text-primary-foreground" />
        {comments.length > 0 && (
          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </button>
    );
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
        {onClose && showComments && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts..."
            className="min-h-[80px] bg-white/10 border-white/10 text-foreground placeholder:text-muted-foreground resize-none focus:ring-primary/20"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {commentText.length}/500 characters
            </span>
            <Button
              type="submit"
              disabled={!commentText.trim() || isAddingComment}
              size="sm"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isAddingComment ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border border-white/10 rounded-lg bg-white/5 text-center">
          <p className="text-muted-foreground mb-3">Sign in to leave a comment</p>
          <Button variant="outline" size="sm">
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

  // Slide-out panel for compact mode when comments are open
  if (isCompact && showComments) {
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
  }

  // Regular inline display
  return <div className="mt-6">{commentsPanel}</div>;
};
