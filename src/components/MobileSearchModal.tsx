import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Music as MusicIcon, ShoppingBag, Calendar, FileText, X, Video, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: 'post' | 'member' | 'video' | 'album' | 'merch' | 'show' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  image?: string;
  path: string;
}

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  album: MusicIcon,
  video: Video,
  merch: ShoppingBag,
  show: Calendar,
  post: Users,
  member: Users,
  page: FileText,
};

const categoryLabels = {
  album: "MUSIC",
  video: "VIDEOS",
  merch: "MERCH",
  show: "SHOWS",
  post: "POSTS",
  member: "MEMBERS",
  page: "PAGES",
};

export const MobileSearchModal = ({ isOpen, onClose }: MobileSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchContent = async () => {
      const searchResults: SearchResult[] = [];

      // Search community posts
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id, content, category, user_id")
        .ilike("content", `%${searchQuery}%`)
        .limit(3);

      if (posts && posts.length > 0) {
        const userIds = posts.filter(p => p.user_id).map(p => p.user_id);
        let profileMap = new Map();
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);
          
          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.user_id, p]));
          }
        }

        posts.forEach(post => {
          const profile = post.user_id ? profileMap.get(post.user_id) : null;
          searchResults.push({
            type: 'post',
            id: post.id,
            title: profile?.display_name || "Guest",
            subtitle: post.content.substring(0, 60) + (post.content.length > 60 ? '...' : ''),
            avatar: profile?.avatar_url || '',
            path: '/community'
          });
        });
      }

      // Search videos
      const { data: videos } = await supabase
        .from("videos")
        .select("id, title, description, thumbnail_url")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(3);

      if (videos) {
        videos.forEach(video => {
          searchResults.push({
            type: 'video',
            id: video.id,
            title: video.title,
            subtitle: video.description || '',
            image: video.thumbnail_url || '',
            path: '/videos'
          });
        });
      }

      // Search products/merch
      const { data: products } = await supabase
        .from("products")
        .select("id, title, description, image_url")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(3);

      if (products) {
        products.forEach(product => {
          searchResults.push({
            type: 'merch',
            id: product.id,
            title: product.title,
            subtitle: product.description || '',
            image: product.image_url || '',
            path: '/merch'
          });
        });
      }

      // Search albums/music
      const albums = [
        { id: "1", title: "Walking on the Edge", description: "Latest album", image: "/albums/walking-on-the-edge.jpg" },
        { id: "2", title: "Acoustic Sessions", description: "Stripped down versions", image: "/albums/acoustic-album.jpg" },
        { id: "3", title: "Outlaw Spirit", description: "Country rock fusion", image: "/albums/outlaw-album.jpg" },
        { id: "4", title: "Power & Glory", description: "High-energy rock", image: "/albums/power-album.jpg" },
        { id: "5", title: "Stripped", description: "Raw and intimate", image: "/albums/stripped-album.jpg" }
      ];

      const filteredAlbums = albums.filter(album =>
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);

      filteredAlbums.forEach(album => {
        searchResults.push({
          type: 'album',
          id: album.id,
          title: album.title,
          subtitle: album.description,
          image: album.image,
          path: '/music'
        });
      });

      // Search shows/events
      const shows = [
        { id: "1", title: "Nashville - The Ryman", date: "March 15, 2026", location: "Nashville, TN" },
        { id: "2", title: "Austin City Limits", date: "March 22, 2026", location: "Austin, TX" },
        { id: "3", title: "Red Rocks Amphitheatre", date: "April 5, 2026", location: "Morrison, CO" },
        { id: "4", title: "The Gorge", date: "April 12, 2026", location: "George, WA" }
      ];

      const filteredShows = shows.filter(show =>
        show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.location.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);

      filteredShows.forEach(show => {
        searchResults.push({
          type: 'show',
          id: show.id,
          title: show.title,
          subtitle: `${show.date} - ${show.location}`,
          path: '/shows'
        });
      });

      // Search static pages
      const staticPages = [
        { id: "about", title: "About", description: "Learn about Sons of Legion", path: "/about" },
        { id: "contact", title: "Contact", description: "Get in touch with us", path: "/contact" },
        { id: "terms", title: "Terms of Service", description: "Terms and conditions", path: "/terms" },
        { id: "privacy", title: "Privacy Policy", description: "Privacy policy and data protection", path: "/privacy" },
        { id: "gallery", title: "Gallery", description: "Photos and media gallery", path: "/gallery" },
        { id: "free-ep", title: "Free EP", description: "Download free music", path: "/free-ep" },
        { id: "live-studio", title: "Live Studio", description: "Live recording sessions", path: "/live-studio" },
        { id: "song-credits", title: "Song Credits", description: "Credits and collaborators", path: "/song-credits" }
      ];

      const filteredPages = staticPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);

      filteredPages.forEach(page => {
        searchResults.push({
          type: 'page',
          id: page.id,
          title: page.title,
          subtitle: page.description,
          path: page.path
        });
      });

      // Search mock members
      const mockProfiles = [
        { id: "1", name: "Sarah Mitchell", location: "Nashville, TN", avatar: "" },
        { id: "2", name: "Marcus Williams", location: "Austin, TX", avatar: "" },
        { id: "3", name: "Jake Peterson", location: "Los Angeles, CA", avatar: "" },
        { id: "4", name: "Rachel Green", location: "New York, NY", avatar: "" },
        { id: "5", name: "Tom Anderson", location: "Miami, FL", avatar: "" },
        { id: "6", name: "Chris Anderson", location: "Chicago, IL", avatar: "" },
      ];

      const filteredMembers = mockProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);

      filteredMembers.forEach(member => {
        searchResults.push({
          type: 'member',
          id: member.id,
          title: member.name,
          subtitle: member.location,
          avatar: member.avatar,
          path: '/community'
        });
      });

      setResults(searchResults);
    };

    const debounce = setTimeout(() => {
      searchContent();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-full max-h-[100dvh] w-full max-w-full p-0 gap-0 md:hidden">
        <DialogHeader className="px-4 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search everything..."
              className="border-0 bg-transparent p-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={onClose} className="touch-manipulation">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {searchQuery.length < 2 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Start typing to search...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">No results found</p>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {Object.entries(groupedResults).map(([type, items]) => {
                const Icon = categoryIcons[type as keyof typeof categoryIcons];
                const label = categoryLabels[type as keyof typeof categoryLabels];
                
                return (
                  <div key={type}>
                    <p className="text-xs font-semibold text-muted-foreground px-2 mb-3 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </p>
                    <div className="space-y-2">
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors flex items-center gap-4 touch-manipulation active:scale-[0.98]"
                        >
                          {result.image && (
                            <img
                              src={result.image}
                              alt={result.title}
                              className={cn(
                                "rounded object-cover",
                                result.type === 'video' ? "h-12 w-20" : "h-12 w-12"
                              )}
                            />
                          )}
                          {result.avatar !== undefined && !result.image && (
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={result.avatar} />
                              <AvatarFallback>{result.title[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};