import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';

type Props = { eventId: string };

export function ExpandableLiveViewer({ eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);

  const connect = async () => {
    setStatus('connecting');
    setError(undefined);
    console.log('[Viewer] Connecting to room:', eventId);

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
      console.log('[Viewer] Token received');

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://sonsoflegionlivestudio-lvof78tr.livekit.cloud';

      // Create and connect room
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('[Viewer] Connected to room');
        setStatus('connected');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Viewer] Disconnected from room');
        setStatus('idle');
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('[Viewer] Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          console.log('[Viewer] Video track attached');
        }
      });

      await room.connect(livekitUrl, tokenData.token);
      console.log('[Viewer] Viewing stream!');
    } catch (e: any) {
      console.error('[Viewer] Error:', e);
      setError(e.message);
      setStatus('error');
    }
  };

  const disconnect = () => {
    console.log('[Viewer] Disconnecting');
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${
          status === 'connected' ? 'bg-green-500' : 
          status === 'connecting' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
        <span>Status: {status}</span>
        <span className="opacity-60">Room: {eventId}</span>
      </div>

      <div className="flex gap-2">
        {status === 'idle' || status === 'error' ? (
          <button 
            onClick={connect} 
            className="rounded-md border px-3 py-1.5 hover:bg-gray-100"
          >
            Enter Stream
          </button>
        ) : (
          <button 
            onClick={disconnect} 
            className="rounded-md border px-3 py-1.5 hover:bg-gray-100"
          >
            Leave Stream
          </button>
        )}
      </div>

      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        controls 
        className="w-full rounded-lg border bg-black" 
      />
      
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
