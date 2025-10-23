import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, Bell, Search, Image, Link as LinkIcon, 
  Video, AtSign, Eye, ThumbsUp, Heart, Send, Mail, Calendar, ArrowLeft, ShoppingCart, Upload, X, MapPin, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getTierColor } from "@/lib/tierColors";
import { CameoBookingTab } from "@/components/community/CameoBookingTab";
import { OnlineMembersSidebar } from "@/components/community/OnlineMembersSidebar";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

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
  birthdate?: string;
  gender?: string;
  total_spend?: number;
  mrr?: number;
  watch_time?: number;
  listen_time?: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

export default function CommunityHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("announcements");
  const { enabled: cameosEnabled } = useFeatureFlag('enable_cameo_booking');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [directMessageRecipient, setDirectMessageRecipient] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(3);
  const [notifications, setNotifications] = useState(0);
  const [rsvpEvents, setRsvpEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender_id: '2',
      recipient_id: 'current-user',
      content: "Hey! Just saw your post about the upcoming show. Can't wait!",
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender_profile: {
        display_name: 'Sarah Johnson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
      }
    },
    {
      id: '2',
      sender_id: 'current-user',
      recipient_id: '2',
      content: "Same here! It's going to be amazing. Are you going to the meet & greet?",
      read: true,
      created_at: new Date(Date.now() - 3000000).toISOString(),
      sender_profile: {
        display_name: 'You',
        avatar_url: ''
      }
    },
    {
      id: '3',
      sender_id: '3',
      recipient_id: 'current-user',
      content: "Thanks for the Legion merch recommendation! Just ordered mine.",
      read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender_profile: {
        display_name: 'Mike Chen',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike'
      }
    },
    {
      id: '4',
      sender_id: '4',
      recipient_id: 'current-user',
      content: "Love your intro! We have so much in common with the music taste.",
      read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sender_profile: {
        display_name: 'Emily Rodriguez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily'
      }
    },
    {
      id: '5',
      sender_id: '5',
      recipient_id: 'current-user',
      content: "Did you catch the acoustic session last night? Fire! 🔥",
      read: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      sender_profile: {
        display_name: 'David Kim',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
      }
    },
    {
      id: '6',
      sender_id: '6',
      recipient_id: 'current-user',
      content: "The new album is incredible! Been on repeat all week.",
      read: false,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      sender_profile: {
        display_name: 'Alex Thompson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
      }
    },
    {
      id: '7',
      sender_id: '7',
      recipient_id: 'current-user',
      content: "Hey, are you coming to the Nashville meetup? Would love to meet you!",
      read: true,
      created_at: new Date(Date.now() - 345600000).toISOString(),
      sender_profile: {
        display_name: 'Jessica Martinez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica'
      }
    },
    {
      id: '8',
      sender_id: 'current-user',
      recipient_id: '7',
      content: "Definitely! Looking forward to it.",
      read: true,
      created_at: new Date(Date.now() - 340000000).toISOString(),
      sender_profile: {
        display_name: 'You',
        avatar_url: ''
      }
    },
    {
      id: '9',
      sender_id: '8',
      recipient_id: 'current-user',
      content: "Just got my VIP tickets! See you at the show!",
      read: true,
      created_at: new Date(Date.now() - 432000000).toISOString(),
      sender_profile: {
        display_name: 'Robert Taylor',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert'
      }
    },
    {
      id: '10',
      sender_id: 'current-user',
      recipient_id: '8',
      content: "Awesome! It's going to be legendary!",
      read: true,
      created_at: new Date(Date.now() - 430000000).toISOString(),
      sender_profile: {
        display_name: 'You',
        avatar_url: ''
      }
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === "announcements" || activeTab === "legion_speaks") {
      loadPosts();
    }
    if (activeTab === "directory") {
      loadDirectoryProfiles();
    }
    loadUnreadCount();
    loadMessages();
    setupRealtimeSubscription();
  }, [activeTab]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMessages = async () => {
    // Keep using mock messages for demo purposes
    // Real database messages would be loaded here in production
  };

  const loadDirectoryProfiles = async () => {
    // Load real user profiles
    const { data: realProfiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, avatar_url, location, bio, tier");

    // Convert real profiles to directory format
    const formattedRealProfiles = (realProfiles || []).map(profile => ({
      id: profile.user_id,
      name: profile.display_name,
      avatar: profile.avatar_url || "",
      tier: profile.tier || "Free Member",
      location: profile.location || "",
      bio: profile.bio || ""
    }));

    // Combine real profiles with mock profiles - always show all
    setAllProfiles([...formattedRealProfiles, ...mockProfiles]);
  };

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
      console.error("Error loading posts:", error);
      toast({ title: "Error loading posts", variant: "destructive" });
      return;
    }

    // Fetch user profiles separately for database posts
    let dbPosts: any[] = [];
    if (data && data.length > 0) {
      const userIds = data.filter(post => post.user_id).map(post => post.user_id);
      
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, avatar_url, tier")
          .in("user_id", userIds);
        
        profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      }
      
      dbPosts = data.map(post => ({
        ...post,
        user_profiles: post.user_id ? (profileMap.get(post.user_id) || {
          display_name: "Guest",
          avatar_url: "",
          tier: "Guest"
        }) : {
          display_name: "Guest",
          avatar_url: "",
          tier: "Guest"
        }
      }));
    }

    // Combine with sample posts for announcements
    if (activeTab === "announcements") {
      setPosts([...dbPosts, ...sampleAnnouncements] as any);
    } else {
      setPosts(dbPosts as any);
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
    const postsChannel = supabase
      .channel("community-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => loadPosts()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel("community-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        () => {
          loadMessages();
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
        return;
      }
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageFile(null);
    setUploadedImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: "Please write something first!", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    let mediaUrl = postMediaUrl;

    // Upload image if present (requires authentication)
    if (uploadedImageFile && user) {
      const fileExt = uploadedImageFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, uploadedImageFile);

      if (uploadError) {
        toast({ title: "Error uploading image", variant: "destructive" });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      mediaUrl = publicUrl;
    } else if (uploadedImageFile && !user) {
      toast({ title: "Image upload requires sign in", description: "Post will be created without image", variant: "destructive" });
    }

    const postType = mediaUrl ? (mediaUrl.includes('video') ? 'video' : 'image') : 'text';

    const { error } = await supabase.from("community_posts").insert({
      user_id: user?.id || null,
      content: newPostContent,
      category: activeTab,
      post_type: postType,
      media_url: mediaUrl || null,
      link_url: postLinkUrl || null,
    });

    if (error) {
      console.error("Error creating post:", error);
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
      return;
    }

    setNewPostContent("");
    setPostMediaUrl("");
    setPostLinkUrl("");
    removeUploadedImage();
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

  const sendMessage = async () => {
    if (!newMessage || !selectedConversation) return;

    // For demo purposes, add message to local state only (mock conversations)
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || 'current-user';
    
    const newMsg = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      recipient_id: selectedConversation,
      content: newMessage,
      read: false,
      created_at: new Date().toISOString(),
      sender_profile: {
        display_name: 'You',
        avatar_url: ''
      }
    };
    
    setMessages([newMsg, ...messages]);
    setNewMessage("");
    toast({ title: "Message sent!" });
  };

  const getConversations = () => {
    const userId = "current-user";
    const conversations = new Map<string, Message[]>();
    
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, []);
      }
      conversations.get(otherUserId)?.push(msg);
    });

    return Array.from(conversations.entries())
      .map(([otherUserId, msgs]) => {
        const sortedMsgs = msgs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return {
          userId: otherUserId,
          lastMessage: sortedMsgs[0],
          unreadCount: msgs.filter(m => !m.read && m.recipient_id === userId).length
        };
      })
      .sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
  };

  const getReactionCount = (post: Post, reactionType: string) => {
    return post.post_reactions.filter(r => r.reaction_type === reactionType).length;
  };

  const handleBuyTicket = (event: any) => {
    toast({
      title: "Ticket Added",
      description: `${event.title || event.venue} ticket added to cart - ${event.price}`,
    });
  };

  const handleRSVP = (eventId: string) => {
    setRsvpEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
        toast({ title: "RSVP Cancelled" });
      } else {
        newSet.add(eventId);
        toast({ title: "RSVP Confirmed!", description: "You're signed up for this event" });
      }
      return newSet;
    });
  };

  const filteredProfiles = allProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Global search filtering
  const searchResults = {
    posts: posts.filter(post => 
      post.content.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      post.user_profiles?.display_name?.toLowerCase().includes(globalSearchQuery.toLowerCase())
    ).slice(0, 5),
    members: allProfiles.filter(profile =>
      profile.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      profile.location.toLowerCase().includes(globalSearchQuery.toLowerCase())
    ).slice(0, 5)
  };

  const hasSearchResults = globalSearchQuery.length > 0 && (searchResults.posts.length > 0 || searchResults.members.length > 0);

  return (
    <div className="relative">
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-2xl font-bold">THE LEGION</h1>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              385 <span className="ml-1">members</span>
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-96" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search posts, members..." 
                className="pl-10" 
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                onFocus={() => globalSearchQuery.length > 0 && setShowSearchResults(true)}
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && hasSearchResults && (
                <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {searchResults.posts.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">POSTS</p>
                      {searchResults.posts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setGlobalSearchQuery("");
                          }}
                          className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <p className="font-semibold text-sm">{post.user_profiles?.display_name || "Guest"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.members.length > 0 && (
                    <div className="p-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">MEMBERS</p>
                      {searchResults.members.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setGlobalSearchQuery("");
                            setActiveTab("directory");
                          }}
                          className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.location}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {showSearchResults && !hasSearchResults && globalSearchQuery.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg p-4 z-50">
                  <p className="text-sm text-muted-foreground text-center">No results found</p>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInbox(true)}
              className="relative"
            >
              <Mail className="h-5 w-5" />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-yellow-500 text-black border-yellow-600 text-xs">
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

            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("events")}
            >
              Events
            </Button>
            
            {cameosEnabled && (
              <Button
                variant={activeTab === "cameos" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("cameos")}
              >
                Cameos
              </Button>
            )}
            
            <Button
              variant={activeTab === "directory" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("directory")}
            >
              Directory
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Create Post - only show on announcements and legion_speaks */}
          {(activeTab === "announcements" || activeTab === "legion_speaks") && (
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
                  
                  {uploadedImagePreview && (
                    <div className="relative mb-4">
                      <img 
                        src={uploadedImagePreview} 
                        alt="Upload preview" 
                        className="max-h-60 rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={removeUploadedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const url = prompt("Enter link URL:");
                          if (url) {
                            setPostLinkUrl(url);
                            toast({ title: "Link attached" });
                          }
                        }}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          toast({ title: "Mention feature coming soon!" });
                        }}
                      >
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
                {filteredProfiles.map((profile) => (
                  <div key={profile.id} className="bg-card rounded-2xl p-6 border hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{profile.name}</h3>
                          <Badge className={getTierColor(profile.tier)}>{profile.tier}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{profile.location}</p>
                        <p className="text-sm mb-4">{profile.bio}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setDirectMessageRecipient({
                              id: profile.id,
                              name: profile.name,
                              avatar: profile.avatar
                            });
                            setShowDirectMessage(true);
                          }}
                        >
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cameos View */}
          {activeTab === "cameos" && <CameoBookingTab />}

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
                      <div className="flex gap-2">
                        {event.price ? (
                          <Button 
                            className="bg-gradient-gold"
                            onClick={() => handleBuyTicket(event)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Register - {event.price}
                          </Button>
                        ) : (
                          <Button 
                            variant={rsvpEvents.has(event.id) ? "outline" : "default"}
                            className={!rsvpEvents.has(event.id) ? "bg-gradient-gold" : ""}
                            onClick={() => handleRSVP(event.id)}
                          >
                            {rsvpEvents.has(event.id) ? "Cancel RSVP" : "RSVP Free"}
                          </Button>
                        )}
                      </div>
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
                      <div className="flex items-center gap-3">
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
                        <Button 
                          className="bg-white text-black hover:bg-white/90"
                          disabled={show.status === "Sold Out"}
                          onClick={() => handleBuyTicket(show)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {show.status === "Sold Out" ? "Sold Out" : "Get Tickets"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Posts Feed for announcements and legion_speaks */}
          {(activeTab === "announcements" || activeTab === "legion_speaks") && (
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
                        <Badge className={getTierColor(post.user_profiles.tier)}>{post.user_profiles.tier}</Badge>
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

        {/* Trending Sidebar - only show for announcements and legion_speaks */}
        {(activeTab === "announcements" || activeTab === "legion_speaks") && (
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-card rounded-2xl p-6 border mb-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">🔥</span> Trending Post
                </h3>
                <p className="text-sm mb-2 font-semibold">Announcements</p>
                <p className="text-sm mb-2">
                  It's been a rough day for Daddy Jack; he just wanted to let you all know how much your prayers and support have meant to him.
                </p>
                <div className="text-sm text-muted-foreground">
                  115 comments
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">📅</span> Upcoming Event • Oct 22
                </h3>
                <h4 className="font-semibold mb-2">The Legion Meetup @ Midtown Cafe in Nashville, TN</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  The Legion community has organized a meetup in Nashville for those who'd like to connect in person.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">8 attending</p>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                    ✓ Hosting
                  </Badge>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Inbox Dialog */}
      <Dialog open={showInbox} onOpenChange={setShowInbox}>
        <DialogContent className="max-w-4xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-4 h-[500px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r pr-4 overflow-y-auto">
              <h3 className="font-semibold mb-3">Conversations</h3>
              <div className="space-y-2">
                {getConversations().map((conv) => {
                  // Get the display info for the other person in the conversation
                  const otherPersonMsg = messages.find(m => 
                    (m.sender_id === conv.userId || m.recipient_id === conv.userId) &&
                    m.sender_id !== "current-user"
                  );
                  const displayName = otherPersonMsg?.sender_profile?.display_name || "User";
                  const avatarUrl = otherPersonMsg?.sender_profile?.avatar_url || "";
                  
                  return (
                    <div
                      key={conv.userId}
                      onClick={() => setSelectedConversation(conv.userId)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.userId
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback>
                            {displayName[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm truncate">
                              {displayName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages
                      .filter(m => 
                        m.sender_id === selectedConversation || 
                        m.recipient_id === selectedConversation
                      )
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((msg) => {
                        const isCurrentUser = msg.sender_id === 'current-user' || msg.sender_profile?.display_name === 'You';
                        return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : ""
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedProfile?.display_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedProfile.avatar_url} />
                  <AvatarFallback>{selectedProfile.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <Badge className={getTierColor(selectedProfile.tier)}>{selectedProfile.tier}</Badge>
                  {selectedProfile.location && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedProfile.location}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedProfile.bio && (
                <div>
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">BIO</h4>
                  <p className="text-muted-foreground">{selectedProfile.bio}</p>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProfile.total_spend !== undefined && (
                  <div className="bg-card-hover p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Total Spend</p>
                    <p className="text-2xl font-bold">${selectedProfile.total_spend.toFixed(2)}</p>
                  </div>
                )}
                {selectedProfile.mrr !== undefined && (
                  <div className="bg-card-hover p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">MRR</p>
                    <p className="text-2xl font-bold">${selectedProfile.mrr.toFixed(2)}</p>
                  </div>
                )}
                {selectedProfile.watch_time !== undefined && (
                  <div className="bg-card-hover p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Watch Time</p>
                    <p className="text-2xl font-bold">{Math.floor(selectedProfile.watch_time / 60)}h</p>
                  </div>
                )}
                {selectedProfile.listen_time !== undefined && (
                  <div className="bg-card-hover p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Listen Time</p>
                    <p className="text-2xl font-bold">{Math.floor(selectedProfile.listen_time / 60)}h</p>
                  </div>
                )}
              </div>
              
              {/* Age and Gender */}
              {(selectedProfile.birthdate || selectedProfile.gender) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedProfile.birthdate && (() => {
                    const today = new Date();
                    const birth = new Date(selectedProfile.birthdate);
                    let age = today.getFullYear() - birth.getFullYear();
                    const monthDiff = today.getMonth() - birth.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                      age--;
                    }
                    return (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Age</p>
                        <p className="font-semibold">{age} years</p>
                      </div>
                    );
                  })()}
                  {selectedProfile.gender && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Gender</p>
                      <p className="font-semibold capitalize">{selectedProfile.gender}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Intro Answers */}
              {selectedProfile.intro_answers && (
                <div>
                  <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-4">Intro Answers</h4>
                  <div className="space-y-4">
                    {Object.entries(selectedProfile.intro_answers).map(([question, answer]) => (
                      <div key={question}>
                        <p className="text-sm text-muted-foreground capitalize">{question.replace(/_/g, ' ')}</p>
                        <p className="font-medium">{answer as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button className="w-full bg-gradient-gold">
                <Send className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Message Dialog */}
      <Dialog open={showDirectMessage} onOpenChange={setShowDirectMessage}>
        <DialogContent className="max-w-3xl max-h-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={directMessageRecipient?.avatar} />
                <AvatarFallback>{directMessageRecipient?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{directMessageRecipient?.name}</div>
                <p className="text-sm text-muted-foreground font-normal">Send a direct message</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Member Profile Summary */}
          {directMessageRecipient && (
            <div className="border rounded-lg p-4 bg-muted/30 mb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={directMessageRecipient.avatar} />
                  <AvatarFallback>{directMessageRecipient.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base">{directMessageRecipient.name}</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {directMessageRecipient.id.startsWith('mock_') ? 
                        mockProfiles.find(p => p.id === directMessageRecipient.id)?.tier || 'Member' 
                        : 'Legion Member'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {directMessageRecipient.id.startsWith('mock_') 
                      ? mockProfiles.find(p => p.id === directMessageRecipient.id)?.bio 
                      : "Part of The Legion community. Music enthusiast and supporter."}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {directMessageRecipient.id.startsWith('mock_') 
                        ? mockProfiles.find(p => p.id === directMessageRecipient.id)?.location 
                        : 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Member since 2024
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col h-[400px]">
            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-muted/20 rounded-lg">
              {directMessageRecipient && messages
                .filter(m => 
                  m.sender_id === directMessageRecipient.id || 
                  m.recipient_id === directMessageRecipient.id
                )
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((msg) => {
                  const isCurrentUser = msg.sender_id === 'current-user' || msg.sender_profile?.display_name === 'You';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? "justify-end" : ""}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                placeholder={`Message ${directMessageRecipient?.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={async (e) => {
                  if (e.key === "Enter" && directMessageRecipient && newMessage.trim()) {
                    const { data: { user } } = await supabase.auth.getUser();
                    const currentUserId = user?.id || 'current-user';
                    
                    const newMsg = {
                      id: Date.now().toString(),
                      sender_id: currentUserId,
                      recipient_id: directMessageRecipient.id,
                      content: newMessage,
                      read: false,
                      created_at: new Date().toISOString(),
                      sender_profile: {
                        display_name: 'You',
                        avatar_url: ''
                      }
                    };
                    
                    setMessages([newMsg, ...messages]);
                    setNewMessage("");
                    toast({ title: "Message sent!" });
                  }
                }}
              />
              <Button
                onClick={async () => {
                  if (!newMessage || !directMessageRecipient) return;

                  const { data: { user } } = await supabase.auth.getUser();
                  const currentUserId = user?.id || 'current-user';
                  
                  const newMsg = {
                    id: Date.now().toString(),
                    sender_id: currentUserId,
                    recipient_id: directMessageRecipient.id,
                    content: newMessage,
                    read: false,
                    created_at: new Date().toISOString(),
                    sender_profile: {
                      display_name: 'You',
                      avatar_url: ''
                    }
                  };
                  
                  setMessages([newMsg, ...messages]);
                  setNewMessage("");
                  toast({ title: "Message sent!" });
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      <OnlineMembersSidebar 
        onMemberClick={(member) => {
          setDirectMessageRecipient(member);
          setShowDirectMessage(true);
        }}
      />
    </div>
  );
}

// Mock profiles for directory - aligned with inbox conversations
const mockProfiles = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    tier: "Legion Elite",
    location: "Nashville, TN",
    bio: "Country music fanatic from Nashville. Been following SOL since day one!",
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    tier: "Legion Member",
    location: "Austin, TX",
    bio: "Love the energy and authenticity. Can't wait for the next tour!",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    tier: "Legion Elite",
    location: "Los Angeles, CA",
    bio: "The raw emotion in every song speaks to my soul. SOL forever!",
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    tier: "Legion Member",
    location: "Chicago, IL",
    bio: "Been to 5 shows so far. The acoustic sessions are unmatched!",
  },
  {
    id: "5",
    name: "Jessica Martinez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
    tier: "Legion VIP",
    location: "New York, NY",
    bio: "The storytelling is incredible. Every lyric hits different.",
  },
  {
    id: "6",
    name: "Robert Taylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
    tier: "Free Member",
    location: "Dallas, TX",
    bio: "From Texas with love. SOL represents everything country should be.",
  },
  {
    id: "7",
    name: "Amanda White",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda",
    tier: "Legion VIP",
    location: "Nashville, TN",
    bio: "VIP member since the beginning. Worth every penny!",
  },
  {
    id: "8",
    name: "Chris Anderson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
    tier: "Legion Elite",
    location: "Phoenix, AZ",
    bio: "The Legion is like family. Best community I've ever been part of.",
  },
  {
    id: "9",
    name: "Jordan Blake",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    tier: "Legion Member",
    location: "Denver, CO",
    bio: "Music is my therapy. SOL gets it. Every song hits home.",
  },
  {
    id: "10",
    name: "Taylor Morgan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=taylor",
    tier: "Legion Elite",
    location: "Seattle, WA",
    bio: "Following the journey from the start. Can't wait to see where it goes!",
  },
  {
    id: "11",
    name: "Alex Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    tier: "Legion Member",
    location: "Miami, FL",
    bio: "Real country music. Real stories. Real fans. That's what we're about.",
  },
  {
    id: "12",
    name: "Morgan Hayes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=morgan",
    tier: "Legion VIP",
    location: "Portland, OR",
    bio: "Been collecting all the merch. The quality is amazing!",
  },
  {
    id: "13",
    name: "Casey Jordan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=casey",
    tier: "Free Member",
    location: "Boston, MA",
    bio: "Just discovered SOL and already obsessed. Where has this been all my life?",
  },
  {
    id: "14",
    name: "Riley Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley",
    tier: "Legion Elite",
    location: "San Diego, CA",
    bio: "The acoustic versions are pure magic. Can't stop listening.",
  },
  {
    id: "15",
    name: "Sam Cooper",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    tier: "Legion Member",
    location: "Atlanta, GA",
    bio: "Supporting real artists making real music. Keep it coming!",
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

// Sample posts for different categories
const sampleAnnouncements = [
  {
    id: "ann1",
    user_id: "admin",
    content: "Big news LEGION — we're playing our first-ever festival.\n\nWhile we're waiting for Daddy Jack to recoup we got an offer for next year that we couldn't turn down.\n\nIf anyone's in Florida this April, we'd love to see you at Tortuga Music Festival. It's right on the beach, and the lineup is wild — Post Malone, Kenny Chesney, Ice Cube, and a ton more.\n\nMeans a lot to be part of this. Hope to see some familiar faces in the crowd.\n\nPasses go on sale this Saturday at 10am ET:\nhttps://tortugamusicfestival.com/passes/\n\n@Everyone",
    post_type: "text",
    media_url: null,
    link_url: "https://tortugamusicfestival.com/passes/",
    tagged_all: true,
    view_count: 219,
    category: "announcements",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_profiles: {
      display_name: "Sons of Legion",
      avatar_url: "",
      tier: "Admin"
    },
    post_reactions: [
      { reaction_type: "like" },
      { reaction_type: "like" },
      { reaction_type: "like" },
      { reaction_type: "heart" },
      { reaction_type: "heart" }
    ],
    post_comments: [{ id: "1" }, { id: "2" }]
  },
  {
    id: "ann2",
    user_id: "admin",
    content: "It's been a rough day for Daddy Jack; he just wanted to let you all know how much your prayers and support have meant to him. Healing is one day at a time.\n\nWe'll keep you updated on his recovery. Thank you all for being such an incredible family. 🙏",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: false,
    view_count: 385,
    category: "announcements",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_profiles: {
      display_name: "Sons of Legion",
      avatar_url: "",
      tier: "Admin"
    },
    post_reactions: [
      { reaction_type: "heart" },
      { reaction_type: "heart" },
      { reaction_type: "heart" }
    ],
    post_comments: [{ id: "1" }, { id: "2" }, { id: "3" }]
  }
];

const sampleLegionSpeaks = [
  {
    id: "ls1",
    user_id: "admin",
    content: "Hey @Everyone! Now that we've had this community for a few weeks and received user feedback, I've gone ahead and made some upgrades. You may have already seen them but if not, keep reading.\n\nHere's what to checkout in the Resources tab where you'll find:\n$...",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: true,
    view_count: 156,
    category: "legion_speaks",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    user_profiles: {
      display_name: "Denice Dal Braccio",
      avatar_url: "",
      tier: "Admin"
    },
    post_reactions: [
      { reaction_type: "like" },
      { reaction_type: "like" }
    ],
    post_comments: [{ id: "1" }]
  },
  {
    id: "ls2",
    user_id: "admin",
    content: "A lot is happening coming up so I wanted to keep @Everyone informed 💕\n\n*ALL events should automatically show you the event times in your current time zone, so I've listed them in CT (Nashville) time zone to anchor things.\n\nWe're working on getting more organized with the calendar and will have a better system soon!",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: true,
    view_count: 131,
    category: "legion_speaks",
    created_at: new Date(Date.now() - 432000000).toISOString(),
    user_profiles: {
      display_name: "Denice Dal Braccio",
      avatar_url: "",
      tier: "Admin"
    },
    post_reactions: [
      { reaction_type: "like" }
    ],
    post_comments: []
  }
];

const sampleIntros = [
  {
    id: "intro1",
    user_id: "user1",
    content: "Hey everyone! I'm Sarah from Nashville. Been following SOL since 2020 and finally joined the community. Can't wait to connect with fellow fans and catch some shows this year! 🎸",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: false,
    view_count: 47,
    category: "intros",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_profiles: {
      display_name: "Sarah Mitchell",
      avatar_url: "",
      tier: "Legionnaires"
    },
    post_reactions: [
      { reaction_type: "like" },
      { reaction_type: "heart" }
    ],
    post_comments: [{ id: "1" }, { id: "2" }]
  },
  {
    id: "intro2",
    user_id: "user2",
    content: "What's up Legion! Mike here from Austin, TX. Guitar player who's been heavily inspired by the band's sound. Looking forward to learning from and jamming with y'all! 🤘",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: false,
    view_count: 34,
    category: "intros",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_profiles: {
      display_name: "Mike Torres",
      avatar_url: "",
      tier: "Outlaws"
    },
    post_reactions: [
      { reaction_type: "like" }
    ],
    post_comments: [{ id: "1" }]
  },
  {
    id: "intro3",
    user_id: "user3",
    content: "Hi friends! I'm Emma, a concert photographer from LA. Caught 15 SOL shows last tour and got some amazing shots. Excited to share my work and connect with other passionate fans here! 📸",
    post_type: "text",
    media_url: null,
    link_url: null,
    tagged_all: false,
    view_count: 52,
    category: "intros",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    user_profiles: {
      display_name: "Emma Chen",
      avatar_url: "",
      tier: "Rebels"
    },
    post_reactions: [
      { reaction_type: "like" },
      { reaction_type: "like" },
      { reaction_type: "heart" }
    ],
    post_comments: [{ id: "1" }, { id: "2" }, { id: "3" }]
  }
];
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
