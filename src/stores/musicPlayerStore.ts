import { create } from 'zustand';
import { trackSongListen, trackSongLike, isFromEmailCampaign } from '@/utils/conversionTracking';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  time: string;
  url?: string;
  image?: string;
}

interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  currentIndex: number;
  isMinimized: boolean;
  likedTracks: Set<string>;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaylist: (playlist: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setMinimized: (isMinimized: boolean) => void;
  toggleLike: (trackId: string) => void;
  isLiked: (trackId: string) => boolean;
  reset: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => {
  // Load liked tracks from localStorage on initialization
  const loadLikedTracks = () => {
    try {
      const saved = localStorage.getItem('likedTracks');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  return {
    currentTrack: null,
    isPlaying: false,
    playlist: [],
    currentIndex: 0,
    isMinimized: false,
    likedTracks: loadLikedTracks(),
    
    setCurrentTrack: (track) => set({ currentTrack: track }),
    
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    
    setPlaylist: (playlist, startIndex = 0) => 
      set({ 
        playlist, 
        currentIndex: startIndex,
        currentTrack: playlist[startIndex] || null 
      }),
    
    playNext: () => {
      const { playlist, currentIndex } = get();
      if (playlist.length === 0) return;
      
      const nextIndex = (currentIndex + 1) % playlist.length;
      set({ 
        currentIndex: nextIndex, 
        currentTrack: playlist[nextIndex],
        isPlaying: true 
      });
    },
    
    playPrevious: () => {
      const { playlist, currentIndex } = get();
      if (playlist.length === 0) return;
      
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      set({ 
        currentIndex: prevIndex, 
        currentTrack: playlist[prevIndex],
        isPlaying: true 
      });
    },
    
    togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
    
    setMinimized: (isMinimized) => set({ isMinimized }),
    
    toggleLike: async (trackId: string) => {
      set((state) => {
        const newLikedTracks = new Set(state.likedTracks);
        const wasLiked = newLikedTracks.has(trackId);
        
        if (wasLiked) {
          newLikedTracks.delete(trackId);
        } else {
          newLikedTracks.add(trackId);
          
          // Track conversion if from email campaign
          if (isFromEmailCampaign()) {
            supabase.auth.getUser().then(({ data }) => {
              if (data.user) {
                trackSongLike(data.user.id, trackId);
              }
            });
          }
        }
        
        // Save to localStorage
        localStorage.setItem('likedTracks', JSON.stringify(Array.from(newLikedTracks)));
        return { likedTracks: newLikedTracks };
      });
    },
    
    isLiked: (trackId: string) => get().likedTracks.has(trackId),
    
    reset: () => set({ 
      currentTrack: null, 
      isPlaying: false, 
      playlist: [], 
      currentIndex: 0 
    }),
  };
});
