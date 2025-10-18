import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: 'post' | 'member' | 'video' | 'album';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  path: string;
}

export const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // Fetch user profiles for posts
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
        .select("id, title, description")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(3);

      if (videos) {
        videos.forEach(video => {
          searchResults.push({
            type: 'video',
            id: video.id,
            title: video.title,
            subtitle: video.description || '',
            path: '/videos'
          });
        });
      }

      // Search mock members (from CommunityHub)
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
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder="Search videos, posts, members..." 
        className="pl-10" 
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(e.target.value.length > 1);
        }}
        onFocus={() => searchQuery.length > 1 && setShowResults(true)}
      />
      
      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.filter(r => r.type === 'video').length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">VIDEOS</p>
              {results.filter(r => r.type === 'video').map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <p className="font-semibold text-sm">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{result.subtitle}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {results.filter(r => r.type === 'post').length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">POSTS</p>
              {results.filter(r => r.type === 'post').map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <p className="font-semibold text-sm">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{result.subtitle}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {results.filter(r => r.type === 'member').length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">MEMBERS</p>
              {results.filter(r => r.type === 'member').map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback>{result.title[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {showResults && results.length === 0 && searchQuery.length > 1 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </div>
      )}
    </div>
  );
};