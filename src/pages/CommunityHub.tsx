import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, Bell, Search, Image, Link as LinkIcon, 
  Video, AtSign, Eye, ThumbsUp, Heart, Send, Mail, Calendar
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
    if (activeTab === "feed" || activeTab === "announcements" || activeTab === "legion_speaks" || activeTab === "intros") {
      loadPosts();
    }
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
          {/* Create Post - only show on feed, announcements, legion_speaks, intros */}
          {(activeTab === "feed" || activeTab === "announcements" || activeTab === "legion_speaks" || activeTab === "intros") && (
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
          )}

          {/* Directory View */}
          {activeTab === "directory" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold">Community Directory</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {mockProfiles.map((profile) => (
                  <div key={profile.id} className="bg-card rounded-2xl p-6 border hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{profile.name}</h3>
                          <Badge variant="secondary">{profile.tier}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{profile.location}</p>
                        <p className="text-sm mb-4">{profile.bio}</p>
                        <Button size="sm" variant="outline" onClick={() => viewProfile(profile.id)}>
                          <Send className="mr-2 h-3 w-3" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events View */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold mb-6">Upcoming Events</h2>
              
              {/* Live Events */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Live Virtual Events</h3>
                <div className="space-y-4">
                  {liveEvents.map((event) => (
                    <div key={event.id} className="bg-card rounded-2xl p-6 border hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-xl">{event.title}</h4>
                        {event.isVIP && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">VIP Only</Badge>
                        )}
                        {event.isPremium && (
                          <Badge variant="secondary">Premium</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {event.time}
                        </div>
                        {event.price && <Badge variant="outline">{event.price}</Badge>}
                      </div>
                      <Button className="bg-gradient-gold">Register Now</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tour Shows */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Tour Dates</h3>
                <div className="space-y-3">
                  {tourShows.map((show) => (
                    <div key={show.id} className="bg-card rounded-lg p-5 border hover:border-primary/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{show.day}</div>
                          <div className="text-sm text-muted-foreground uppercase">{show.month}</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{show.venue}</h4>
                          <p className="text-muted-foreground">{show.city}, {show.state}</p>
                          <p className="text-sm text-muted-foreground">{show.time}</p>
                          {show.specialGuests && (
                            <p className="text-xs text-primary mt-1">Special Guest: {show.specialGuests}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={
                          show.status === "Sold Out" 
                            ? "bg-destructive/20 text-destructive border-destructive/30"
                            : show.status === "Low Tickets"
                            ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                            : "bg-green-500/20 text-green-600 border-green-500/30"
                        }
                      >
                        {show.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Posts Feed for feed, announcements, legion_speaks, intros */}
          {(activeTab === "feed" || activeTab === "announcements" || activeTab === "legion_speaks" || activeTab === "intros") && (
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
          )}
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

// Mock profiles for directory
const mockProfiles = [
  {
    id: "1",
    name: "Sarah Mitchell",
    avatar: "",
    tier: "Legionnaires",
    location: "Nashville, TN",
    bio: "Music lover and longtime fan. Been following the band since 2020!",
  },
  {
    id: "2",
    name: "Mike Torres",
    avatar: "",
    tier: "Outlaws",
    location: "Austin, TX",
    bio: "Guitar player inspired by SOL. Love the energy and raw emotion in every track.",
  },
  {
    id: "3",
    name: "Emma Chen",
    avatar: "",
    tier: "Rebels",
    location: "Los Angeles, CA",
    bio: "Concert photographer and super fan. Caught 15 shows last tour!",
  },
  {
    id: "4",
    name: "James Parker",
    avatar: "",
    tier: "Outlaws",
    location: "Evansville, IN",
    bio: "Just 2.5 hour drive to Nashville. Getting out for movement creates space for my brain and body to connect.",
  },
  {
    id: "5",
    name: "Lisa Rodriguez",
    avatar: "",
    tier: "Legionnaires",
    location: "Miami, FL",
    bio: "Day one supporter. The music speaks to my soul and helps me through tough times.",
  },
  {
    id: "6",
    name: "Chris Anderson",
    avatar: "",
    tier: "Rebels",
    location: "Chicago, IL",
    bio: "Midwest represent! Been blasting SOL since the first EP dropped.",
  },
];

// Live events from LiveStudio
const liveEvents = [
  {
    id: "1",
    title: "Virtual World Tour Finale",
    description: "The grand finale of our virtual tour featuring special guests and never before performed tracks",
    date: "March 15, 2026",
    time: "9:00 PM EST",
    price: "$19.99",
    isVIP: false,
    isPremium: false,
  },
  {
    id: "2",
    title: "Q&A with the Band",
    description: "Ask us anything! Live video chat session with all band members",
    date: "February 20, 2026",
    time: "7:00 PM EST",
    price: null,
    isVIP: true,
    isPremium: false,
  },
  {
    id: "3",
    title: "Album Listening Party",
    description: "Listen to Sons of Legion's newest album live with the band before its released.",
    date: "January 30, 2026",
    time: "8:00 PM EST",
    price: null,
    isVIP: false,
    isPremium: true,
  },
];

// Tour shows from Shows page
const tourShows = [
  {
    id: "1",
    month: "Mar",
    day: "15",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    time: "8:00 PM",
    status: "On Sale",
    specialGuests: "The Midnight Collective",
  },
  {
    id: "2",
    month: "Mar",
    day: "22",
    venue: "The Forum",
    city: "Los Angeles",
    state: "CA",
    time: "7:30 PM",
    status: "Low Tickets",
    specialGuests: "Echo Valley",
  },
  {
    id: "3",
    month: "Apr",
    day: "05",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison",
    state: "CO",
    time: "8:00 PM",
    status: "Sold Out",
  },
  {
    id: "4",
    month: "Apr",
    day: "12",
    venue: "Bridgestone Arena",
    city: "Nashville",
    state: "TN",
    time: "7:00 PM",
    status: "On Sale",
  },
  {
    id: "5",
    month: "Apr",
    day: "20",
    venue: "United Center",
    city: "Chicago",
    state: "IL",
    time: "8:00 PM",
    status: "On Sale",
    specialGuests: "The Resonance",
  },
];
