import { create } from 'zustand';
import { Room, RoomEvent, Track, RemoteTrack, RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';

interface LiveStreamState {
  room: Room | null;
  status: 'idle' | 'connecting' | 'connected' | 'ended' | 'error';
  error: string | null;
  eventId: string | null;
  viewerCount: number;
  hasVideoTrack: boolean;
  hasAudioTrack: boolean;
  videoTrack: RemoteVideoTrack | null;
  audioTrack: RemoteAudioTrack | null;
  isExpanded: boolean;
  databaseStatus: 'live' | 'ended' | null;
  setExpanded: (expanded: boolean) => void;
  setDatabaseStatus: (status: 'live' | 'ended' | null) => void;
  connect: (eventId: string) => Promise<void>;
  disconnect: () => void;
  setViewerCount: (count: number) => void;
}

export const useLiveStreamStore = create<LiveStreamState>((set, get) => ({
  room: null,
  status: 'idle',
  error: null,
  eventId: null,
  viewerCount: 0,
  hasVideoTrack: false,
  hasAudioTrack: false,
  videoTrack: null,
  audioTrack: null,
  isExpanded: typeof window !== 'undefined' ? localStorage.getItem('livestream-expanded') === 'true' : false,
  databaseStatus: null,

  setExpanded: (expanded: boolean) => {
    set({ isExpanded: expanded });
    if (typeof window !== 'undefined') {
      localStorage.setItem('livestream-expanded', String(expanded));
    }
  },

  setViewerCount: (count: number) => {
    set({ viewerCount: count });
  },

  setDatabaseStatus: (status: 'live' | 'ended' | null) => {
    const currentStatus = get().status;
    set({ databaseStatus: status });
    
    // If database shows ended, update local status
    if (status === 'ended' && currentStatus === 'connected') {
      console.log('[LiveStreamStore] Database status ended, disconnecting');
      get().disconnect();
    }
  },

  connect: async (eventId: string) => {
    const { room: existingRoom, eventId: currentEventId, status } = get();
    
    // Guard: Don't reconnect if already connected to same event
    if (existingRoom && currentEventId === eventId && existingRoom.state === 'connected') {
      console.log('[LiveStreamStore] Already connected to event:', eventId);
      return;
    }

    // Guard: Don't start new connection if one is in progress
    if (status === 'connecting') {
      console.log('[LiveStreamStore] Connection already in progress');
      return;
    }

    // Disconnect from any existing room first
    if (existingRoom) {
      console.log('[LiveStreamStore] Disconnecting from previous room');
      get().disconnect();
    }

    set({ status: 'connecting', error: null, eventId });
    console.log('[LiveStreamStore] Connecting to room:', eventId);

    try {
      // Get token from edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { 
          roomName: eventId, 
          participantName: `Viewer-${Math.random().toString(36).substr(2, 9)}`,
          role: 'viewer' 
        },
      });

      if (tokenError) throw tokenError;
      if (!tokenData?.token) throw new Error('No token received');

      const token = tokenData.token;
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://live-studio-u0h6lvcc.livekit.cloud';

      // Create and connect room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1920, height: 1080 },
        },
      });

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('[LiveStreamStore] Room connected');
        set({ status: 'connected' });
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[LiveStreamStore] Room disconnected');
        set({ status: 'ended', room: null });
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        const participantCount = room.remoteParticipants.size + 1;
        console.log('[LiveStreamStore] Participant connected, total:', participantCount);
        set({ viewerCount: participantCount });
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        const participantCount = room.remoteParticipants.size + 1;
        console.log('[LiveStreamStore] Participant disconnected, total:', participantCount);
        set({ viewerCount: participantCount });
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        console.log('[LiveStreamStore] Track subscribed:', track.kind);
        
        if (track.kind === Track.Kind.Video) {
          const videoTrack = track as RemoteVideoTrack;
          set({ hasVideoTrack: true, videoTrack });
        } else if (track.kind === Track.Kind.Audio) {
          const audioTrack = track as RemoteAudioTrack;
          set({ hasAudioTrack: true, audioTrack });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        console.log('[LiveStreamStore] Track unsubscribed:', track.kind);
        
        if (track.kind === Track.Kind.Video) {
          set({ hasVideoTrack: false, videoTrack: null });
        } else if (track.kind === Track.Kind.Audio) {
          set({ hasAudioTrack: false, audioTrack: null });
        }
      });

      // Connect to room
      await room.connect(livekitUrl, token);
      console.log('[LiveStreamStore] Connected to LiveKit room');
      
      set({ room, status: 'connected' });

    } catch (error) {
      console.error('[LiveStreamStore] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to stream';
      set({ status: 'error', error: errorMessage, room: null });
    }
  },

  disconnect: () => {
    const { room } = get();
    if (room) {
      console.log('[LiveStreamStore] Disconnecting room');
      room.disconnect();
    }
    set({ 
      room: null, 
      status: 'idle', 
      eventId: null,
      videoTrack: null,
      audioTrack: null,
      hasVideoTrack: false,
      hasAudioTrack: false,
      viewerCount: 0,
      error: null
    });
  },
}));
