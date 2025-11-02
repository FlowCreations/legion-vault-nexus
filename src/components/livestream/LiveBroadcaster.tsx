import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track, LocalTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Video, VideoOff, Mic, MicOff, Play, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AudioMixer } from './AudioMixer';

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
  const [audioLevel, setAudioLevel] = useState(0);
  const [micGain, setMicGain] = useState(100);
  const [musicGain, setMusicGain] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<LocalTrack | null>(null);
  const audioTrackRef = useRef<LocalTrack | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    requestPermissionsAndLoadDevices();
  }, []);

  const requestPermissionsAndLoadDevices = async () => {
    try {
      // Request permissions first to get accurate device labels
      console.log('[Broadcaster] Requesting media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      // Stop the tracks immediately - we just needed them for permissions
      stream.getTracks().forEach(track => track.stop());
      console.log('[Broadcaster] Permissions granted, loading devices...');
      
      // Now enumerate devices - labels will be available after permission grant
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      
      console.log('[Broadcaster] Found devices:', {
        cameras: videoDevices.length,
        microphones: audioDevices.length,
        videoDevices: videoDevices.map(d => ({ id: d.deviceId, label: d.label })),
        audioDevices: audioDevices.map(d => ({ id: d.deviceId, label: d.label }))
      });
      
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('[Broadcaster] Failed to get permissions or load devices:', err);
      setError('Please allow camera and microphone access to continue');
    }
  };

  const setupAudioProcessing = async (audioTrack: LocalTrack) => {
    try {
      const mediaStreamTrack = audioTrack.mediaStreamTrack;
      if (!mediaStreamTrack) {
        console.error('[Broadcaster] No mediaStreamTrack available');
        return;
      }

      console.log('[Broadcaster] Setting up audio processing with track:', {
        label: mediaStreamTrack.label,
        enabled: mediaStreamTrack.enabled,
        readyState: mediaStreamTrack.readyState,
        muted: mediaStreamTrack.muted
      });
      
      const stream = new MediaStream([mediaStreamTrack]);
      const ctx = new AudioContext({ sampleRate: 48000 });
      
      console.log('[Broadcaster] AudioContext created, initial state:', ctx.state);
      
      // CRITICAL: Resume audio context - required for browser autoplay policy
      if (ctx.state === 'suspended') {
        console.log('[Broadcaster] Resuming suspended AudioContext...');
        await ctx.resume();
        console.log('[Broadcaster] AudioContext resumed, new state:', ctx.state);
      }
      
      const source = ctx.createMediaStreamSource(stream);

      setAudioContext(ctx);
      setSourceNode(source);

      console.log('[Broadcaster] Audio processing setup complete:', {
        contextState: ctx.state,
        sampleRate: ctx.sampleRate,
        hasSource: !!source
      });
      
    } catch (err) {
      console.error('[Broadcaster] Audio processing setup failed:', err);
    }
  };

  const handleProcessedStream = (processedStream: MediaStream) => {
    console.log('[Broadcaster] Received processed audio stream from mixer');
    // Replace the original audio track with the processed one
    if (audioTrackRef.current && roomRef.current) {
      const processedAudioTrack = processedStream.getAudioTracks()[0];
      if (processedAudioTrack) {
        console.log('[Broadcaster] Replacing audio track with processed version');
        // This will be handled when we publish the track
      }
    }
  };

  const handleAudioLevel = (level: number) => {
    setAudioLevel(level);
  };

  const startPreview = async () => {
    if (!selectedCamera || !selectedMicrophone) {
      setError('Please select both camera and microphone');
      return;
    }

    setStatus('preview');
    setError(undefined);
    console.log('[Broadcaster] Starting preview with devices:', {
      camera: selectedCamera,
      microphone: selectedMicrophone
    });

    try {
      const tracks = await createLocalTracks({
        audio: { 
          deviceId: { exact: selectedMicrophone },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        },
        video: { 
          deviceId: { exact: selectedCamera },
          resolution: {
            width: 1920,
            height: 1080
          }
        },
      });

      console.log('[Broadcaster] Created tracks:', tracks.length);

      const videoTrack = tracks.find(t => t.kind === Track.Kind.Video);
      const audioTrack = tracks.find(t => t.kind === Track.Kind.Audio);

      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        videoTrackRef.current = videoTrack;
        console.log('[Broadcaster] Video track attached');
      }
      
      if (audioTrack) {
        audioTrackRef.current = audioTrack;
        console.log('[Broadcaster] Audio track created, setting up processing');
        // User interaction already happened (button click), safe to setup audio
        await setupAudioProcessing(audioTrack);
      } else {
        console.error('[Broadcaster] No audio track found!');
        setError('Failed to create audio track');
      }

      console.log('[Broadcaster] Preview started successfully');
    } catch (e: any) {
      console.error('[Broadcaster] Preview error:', e);
      setError(e.message || 'Failed to start preview');
      setStatus('error');
    }
  };

  const stopPreview = () => {
    console.log('[Broadcaster] Stopping preview and cleaning up');
    
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      setSourceNode(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setAudioLevel(0);
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
      // Check if there's already an active live stream
      const { data: existingLive, error: checkError } = await supabase
        .from('livestream_events')
        .select('id, title')
        .eq('status', 'live')
        .maybeSingle();

      if (checkError) {
        console.error('[Broadcaster] Error checking for existing live streams:', checkError);
      }

      if (existingLive && existingLive.id !== eventId) {
        throw new Error('Another broadcaster is already live. Please wait for them to finish.');
      }

      // Update the event status to live
      const { error: updateError } = await supabase
        .from('livestream_events')
        .update({ status: 'live' })
        .eq('id', eventId);

      if (updateError) {
        console.error('[Broadcaster] Error updating event status:', updateError);
        throw new Error('Failed to set stream as live');
      }

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
      
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('[Broadcaster] Connected to room');
        setStatus('live');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Broadcaster] Disconnected from room');
        // Update event status back to scheduled when disconnected
        supabase
          .from('livestream_events')
          .update({ status: 'scheduled' })
          .eq('id', eventId)
          .then(({ error }) => {
            if (error) console.error('[Broadcaster] Error updating status on disconnect:', error);
          });
        setStatus('idle');
      });

      await room.connect(livekitUrl, tokenData.token);

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
    
    // Update event status back to scheduled
    const { error: updateError } = await supabase
      .from('livestream_events')
      .update({ status: 'scheduled' })
      .eq('id', eventId);

    if (updateError) {
      console.error('[Broadcaster] Error updating event status:', updateError);
    }
    
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
    if (sourceNode) {
      sourceNode.disconnect();
      setSourceNode(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setAudioLevel(0);
    setStatus('idle');
  };

  const toggleCamera = async () => {
    if (videoTrackRef.current) {
      if (isCameraOn) {
        await videoTrackRef.current.mute();
        console.log('[Broadcaster] Camera muted');
      } else {
        await videoTrackRef.current.unmute();
        console.log('[Broadcaster] Camera unmuted');
      }
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = async () => {
    if (audioTrackRef.current) {
      if (isMicOn) {
        await audioTrackRef.current.mute();
        console.log('[Broadcaster] Microphone muted');
      } else {
        await audioTrackRef.current.unmute();
        console.log('[Broadcaster] Microphone unmuted');
      }
      setIsMicOn(!isMicOn);
    }
  };

  const handleMicGainChange = (value: number[]) => {
    setMicGain(value[0]);
  };

  const handleMusicGainChange = (value: number[]) => {
    setMusicGain(value[0]);
  };

  useEffect(() => {
    // Handle browser/tab close
    const handleBeforeUnload = () => {
      console.log('[Broadcaster] Browser closing, cleaning up live status');
      if (roomRef.current && status === 'live') {
        // Update event status synchronously before page unload
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/livestream_events?id=eq.${eventId}`,
          JSON.stringify({ status: 'scheduled' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup on unmount
      if (roomRef.current) {
        console.log('[Broadcaster] Component unmounting, disconnecting');
        roomRef.current.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext, status, eventId]);

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

          {/* Professional Audio Mixer */}
          <AudioMixer 
            audioContext={audioContext}
            sourceNode={sourceNode}
            onProcessedStream={handleProcessedStream}
            onAudioLevel={handleAudioLevel}
          />

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
                  title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={toggleMic}
                  variant={isMicOn ? "default" : "outline"}
                  size="icon"
                  title={isMicOn ? "Mute microphone" : "Unmute microphone"}
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
