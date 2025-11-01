import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';

type Props = { eventId: string };

export function LiveBroadcaster({ eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);

  const startBroadcast = async () => {
    setStatus('connecting');
    setError(undefined);
    console.log('[Broadcaster] Starting broadcast for room:', eventId);

    try {
      // Get token from edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { 
          roomName: eventId, 
          participantName: 'Broadcaster',
          role: 'broadcaster' 
        },
      });

      if (tokenError) throw tokenError;
      console.log('[Broadcaster] Token received');

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://sonsoflegionlivestudio-lvof78tr.livekit.cloud';
      
      // Create and connect room
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('[Broadcaster] Connected to room');
        setStatus('live');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Broadcaster] Disconnected from room');
        setStatus('idle');
      });

      await room.connect(livekitUrl, tokenData.token);
      console.log('[Broadcaster] Room connected, creating local tracks');

      // Create and publish local tracks
      const tracks = await createLocalTracks({
        audio: true,
        video: { facingMode: 'user' },
      });

      console.log('[Broadcaster] Local tracks created:', tracks.length);

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          console.log('[Broadcaster] Video track attached to preview');
        }
      }

      console.log('[Broadcaster] Broadcasting live!');
    } catch (e: any) {
      console.error('[Broadcaster] Error:', e);
      setError(e.message);
      setStatus('error');
    }
  };

  const stopBroadcast = async () => {
    console.log('[Broadcaster] Stopping broadcast');
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'live' ? 'bg-red-500 text-white' :
          status === 'connecting' ? 'bg-yellow-500 text-white' :
          status === 'error' ? 'bg-red-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {status === 'live' ? '🔴 LIVE' :
           status === 'connecting' ? '⏳ Connecting...' :
           status === 'error' ? '⚠️ Error' :
           '⚫ Offline'}
        </div>
        <span className="text-sm opacity-60">Room: {eventId}</span>
      </div>

      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        className="w-full rounded-lg border bg-black"
      />

      <div className="flex gap-2">
        {status === 'idle' || status === 'error' ? (
          <button
            onClick={startBroadcast}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Start Broadcast
          </button>
        ) : (
          <button
            onClick={stopBroadcast}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Stop Broadcast
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
