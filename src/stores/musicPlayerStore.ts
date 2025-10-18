import { create } from 'zustand';

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
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaylist: (playlist: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setMinimized: (isMinimized: boolean) => void;
  reset: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playlist: [],
  currentIndex: 0,
  isMinimized: false,
  
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
  
  reset: () => set({ 
    currentTrack: null, 
    isPlaying: false, 
    playlist: [], 
    currentIndex: 0 
  }),
}));
