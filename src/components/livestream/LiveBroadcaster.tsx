import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track, LocalTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Video, VideoOff, Mic, MicOff, Play } from 'lucide-react';

type Props = { eventId: string };

export function LiveBroadcaster({ eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'preview' | 'connecting' | 'live' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<LocalTrack | null>(null);
  const audioTrackRef = useRef<LocalTrack | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const startPreview = async () => {
    if (!selectedCamera || !selectedMicrophone) {
      setError('Please select both camera and microphone');
      return;
    }

    setStatus('preview');
    setError(undefined);
    console.log('[Broadcaster] Starting preview');

    try {
      const tracks = await createLocalTracks({
        audio: { deviceId: selectedMicrophone },
        video: { deviceId: selectedCamera },
      });

      const videoTrack = tracks.find(t => t.kind === Track.Kind.Video);
      const audioTrack = tracks.find(t => t.kind === Track.Kind.Audio);

      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        videoTrackRef.current = videoTrack;
      }
      if (audioTrack) {
        audioTrackRef.current = audioTrack;
      }

      console.log('[Broadcaster] Preview started');
    } catch (e: any) {
      console.error('[Broadcaster] Preview error:', e);
      setError(e.message);
      setStatus('error');
    }
  };

  const stopPreview = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  };

  const startBroadcast = async () => {
    if (status !== 'preview') {
      setError('Please start preview first');
      return;
    }

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

      // Publish existing tracks from preview
      if (videoTrackRef.current) {
        await room.localParticipant.publishTrack(videoTrackRef.current);
      }
      if (audioTrackRef.current) {
        await room.localParticipant.publishTrack(audioTrackRef.current);
      }

      console.log('[Broadcaster] Broadcasting!');
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
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
    <div className="space-y-6">
      {/* Device Selection */}
      {status === 'idle' && (
        <div className="space-y-4">
          <div>
            <Label>Camera</Label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {cameras.map(cam => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Microphone</Label>
            <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {microphones.map(mic => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startPreview} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Preview
          </Button>
        </div>
      )}

      {/* Preview / Live Video */}
      {status !== 'idle' && (
        <>
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full rounded-lg border bg-black aspect-video" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
              <span className={`inline-block h-2 w-2 rounded-full ${
                status === 'live' ? 'bg-red-500 animate-pulse' : 
                status === 'connecting' ? 'bg-yellow-500' : 
                status === 'preview' ? 'bg-blue-500' :
                'bg-gray-500'
              }`} />
              <span className="text-white text-sm font-medium uppercase">{status}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {status === 'preview' ? (
              <>
                <Button onClick={startBroadcast} className="flex-1">
                  Go Live
                </Button>
                <Button onClick={stopPreview} variant="outline">
                  Stop Preview
                </Button>
              </>
            ) : status === 'live' || status === 'connecting' ? (
              <>
                <Button onClick={stopBroadcast} variant="destructive" className="flex-1">
                  End Broadcast
                </Button>
                <Button
                  onClick={toggleCamera}
                  variant={isCameraOn ? "default" : "outline"}
                  size="icon"
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={toggleMic}
                  variant={isMicOn ? "default" : "outline"}
                  size="icon"
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </>
            ) : null}
          </div>
        </>
      )}
      
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
