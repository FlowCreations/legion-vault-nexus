import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track, LocalTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

type Props = { eventId: string };

export function LiveBroadcaster({ eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<LocalTrack | null>(null);
  const audioTrackRef = useRef<LocalTrack | null>(null);

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
        if (track.kind === Track.Kind.Video) {
          videoTrackRef.current = track;
          if (videoRef.current) {
            track.attach(videoRef.current);
            console.log('[Broadcaster] Video track attached to preview');
          }
        } else if (track.kind === Track.Kind.Audio) {
          audioTrackRef.current = track;
          console.log('[Broadcaster] Audio track published');
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
    videoTrackRef.current = null;
    audioTrackRef.current = null;
    setStatus('idle');
  };

  const toggleCamera = async () => {
    if (videoTrackRef.current) {
      if (isCameraOn) {
        await videoTrackRef.current.mute();
      } else {
        await videoTrackRef.current.unmute();
      }
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = async () => {
    if (audioTrackRef.current) {
      if (isMicOn) {
        await audioTrackRef.current.mute();
      } else {
        await audioTrackRef.current.unmute();
      }
      setIsMicOn(!isMicOn);
    }
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

      <div className="flex gap-2 flex-wrap">
        {status === 'idle' || status === 'error' ? (
          <Button
            onClick={startBroadcast}
            className="bg-red-500 hover:bg-red-600"
          >
            Start Broadcast
          </Button>
        ) : (
          <>
            <Button
              onClick={stopBroadcast}
              variant="secondary"
            >
              Stop Broadcast
            </Button>
            <Button
              onClick={toggleCamera}
              variant="outline"
              size="icon"
            >
              {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              onClick={toggleMic}
              variant="outline"
              size="icon"
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </>
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
