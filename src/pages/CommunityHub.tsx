import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, Bell, Search, Image, Link as LinkIcon, 
  Video, AtSign, Eye, ThumbsUp, Heart, Send, Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  media_url: string | null;
  link_url: string | null;
  tagged_all: boolean;
  view_count: number;
  category: string;
  created_at: string;
  user_profiles: {
    display_name: string;
    avatar_url: string;
    tier: string;
  };
  post_reactions: Array<{ reaction_type: string }>;
  post_comments: Array<{ id: string }>;
}

interface UserProfile {
  display_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  tier: string;
  intro_answers: any;
}

export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [showInbox, setShowInbox] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    loadUnreadCount();
    setupRealtimeSubscription();
  }, [activeTab]);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        post_reactions(reaction_type),
        post_comments(id)
      `)
      .eq("category", activeTab)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading posts", variant: "destructive" });
      return;
    }

    // Fetch user profiles separately
    if (data) {
      const userIds = data.map(post => post.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, avatar_url, tier")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const postsWithProfiles = data.map(post => ({
        ...post,
        user_profiles: profileMap.get(post.user_id) || {
          display_name: "User",
          avatar_url: "",
          tier: ""
        }
      }));
      setPosts(postsWithProfiles as any);
    }
  };

  const loadUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("community_messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);

    setUnreadMessages(count || 0);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("community-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newPostContent) return;

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: newPostContent,
      category: activeTab,
      post_type: "text",
    });

    if (error) {
      toast({ title: "Error creating post", variant: "destructive" });
      return;
    }

    setNewPostContent("");
    toast({ title: "Post created successfully!" });
    loadPosts();
  };

  const addReaction = async (postId: string, reactionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    });

    loadPosts();
  };

  const viewProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setSelectedProfile(data);
      setShowProfileDialog(true);
    }
  };

  const getReactionCount = (post: Post, reactionType: string) => {
    return post.post_reactions.filter(r => r.reaction_type === reactionType).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-bold">THE LEGION</h1>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              385 <span className="ml-1">members</span>
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-10" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInbox(true)}
              className="relative"
            >
              <Mail className="h-5 w-5" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-xs">
                  {unreadMessages}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            <Button
              variant={activeTab === "feed" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("feed")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Feed
            </Button>
            
            <Button
              variant={activeTab === "directory" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("directory")}
            >
              Directory
            </Button>

            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("events")}
            >
              Events
            </Button>

            <Button
              variant={activeTab === "intros" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("intros")}
            >
              Intros
            </Button>

            <Button
              variant={activeTab === "announcements" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("announcements")}
            >
              Announcements
            </Button>

            <Button
              variant={activeTab === "legion_speaks" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("legion_speaks")}
            >
              Legion Speaks
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Create Post */}
          <div className="bg-card rounded-2xl p-6 mb-6 border">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Textarea
                  placeholder="Start typing..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="mb-4 min-h-[80px]"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button onClick={createPost} className="bg-gradient-gold">
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-card rounded-2xl p-6 border">
                <div className="flex items-start gap-4">
                  <Avatar 
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => viewProfile(post.user_id)}
                  >
                    <AvatarImage src={post.user_profiles?.avatar_url} />
                    <AvatarFallback>
                      {post.user_profiles?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => viewProfile(post.user_id)}
                        >
                          {post.user_profiles?.display_name || "User"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Seen by {post.view_count}</span>
                          </div>
                        </div>
                      </div>
                      {post.user_profiles?.tier && (
                        <Badge variant="secondary">{post.user_profiles.tier}</Badge>
                      )}
                    </div>
                    
                    <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                    
                    {post.media_url && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        {post.post_type === "image" && (
                          <img src={post.media_url} alt="Post media" className="w-full" />
                        )}
                        {post.post_type === "video" && (
                          <video src={post.media_url} controls className="w-full" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, "like")}
                        className="gap-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {getReactionCount(post, "like")}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(post.id, "heart")}
                        className="gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        {getReactionCount(post, "heart")}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {post.post_comments.length}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Trending Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <div className="bg-card rounded-2xl p-6 border mb-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🔥</span> Trending Post
              </h3>
              <p className="text-sm mb-2">
                It's been a rough day for Daddy Jack; he just wanted to let you all know how much your prayers and support have meant to him.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>115 comments</span>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📅</span> Upcoming Event • Oct 22
              </h3>
              <h4 className="font-semibold mb-2">The Legion Meetup @ Midtown Cafe in Nashville, TN</h4>
              <p className="text-sm text-muted-foreground mb-4">
                The Legion community has organized a meetup in Nashville for those who'd like...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                  ✓ Hosting
                </Badge>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedProfile?.display_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedProfile.avatar_url} />
                  <AvatarFallback>{selectedProfile.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <Badge variant="secondary">{selectedProfile.tier}</Badge>
                  {selectedProfile.location && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedProfile.location}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedProfile.bio && (
                <p className="text-muted-foreground">{selectedProfile.bio}</p>
              )}
              
              <Button className="w-full bg-gradient-gold">
                <Send className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
