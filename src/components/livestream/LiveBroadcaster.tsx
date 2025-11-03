import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track, LocalTrack, LocalAudioTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Video, VideoOff, Mic, MicOff, Play, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AudioMixer } from './AudioMixer';
import { MicrophoneMeter } from './MicrophoneMeter';

type Props = { eventId: string };

export function LiveBroadcaster({ eventId }: Props) {
  const [status, setStatus] = useState<'idle' | 'requesting-permission' | 'initializing-audio' | 'preview' | 'connecting' | 'live' | 'error'>('idle');
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
  const [rawAudioStream, setRawAudioStream] = useState<MediaStream | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const processedAudioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    requestPermissionsAndLoadDevices();
  }, []);

  const requestPermissionsAndLoadDevices = async () => {
    try {
      console.log('[Broadcaster] Loading device list...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Map devices with fallback IDs for devices without permission
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, idx) => ({
          ...d,
          deviceId: d.deviceId || `video-${idx}`,
          label: d.label || `Camera ${idx + 1}`
        }));
      
      const audioDevices = devices
        .filter(d => d.kind === 'audioinput')
        .map((d, idx) => ({
          ...d,
          deviceId: d.deviceId || `audio-${idx}`,
          label: d.label || `Microphone ${idx + 1}`
        }));
      
      console.log('[Broadcaster] Found devices:', {
        cameras: videoDevices.length,
        microphones: audioDevices.length
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
      console.error('[Broadcaster] Failed to load devices:', err);
      setError('Failed to load device list');
    }
  };

  const setupAudioProcessing = async (rawStream: MediaStream) => {
    try {
      const ctx = new AudioContext({ sampleRate: 48000 });
      
      console.log('[Broadcaster] AudioContext created, initial state:', ctx.state);
      
      // Resume audio context - required for browser autoplay policy
      if (ctx.state === 'suspended') {
        console.log('[Broadcaster] Resuming suspended AudioContext...');
        await ctx.resume();
        console.log('[Broadcaster] AudioContext resumed, new state:', ctx.state);
      }
      
      const source = ctx.createMediaStreamSource(rawStream);

      // Test raw audio directly
      const testAnalyser = ctx.createAnalyser();
      testAnalyser.fftSize = 256;
      source.connect(testAnalyser);
      
      // Check for audio after 500ms
      setTimeout(() => {
        const testData = new Uint8Array(testAnalyser.frequencyBinCount);
        testAnalyser.getByteFrequencyData(testData);
        const maxValue = Math.max(...testData);
        const hasAudio = testData.some(v => v > 0);
        console.log('[Broadcaster] Raw mic test:', {
          hasAudio,
          maxValue,
          avgValue: testData.reduce((a, b) => a + b) / testData.length
        });
        testAnalyser.disconnect();
      }, 500);

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
    console.log('[Broadcaster] Received processed audio stream from mixer:', processedStream.id);
    // Store the processed stream for LiveKit to use
    processedAudioStreamRef.current = processedStream;
    // Update the raw audio stream state with the PROCESSED stream
    // This ensures MicrophoneMeter gets a fresh stream it can read from
    setRawAudioStream(processedStream);
    console.log('[Broadcaster] Updated visualization stream to processed output');
  };

  const handleAudioLevel = (left: number, right: number) => {
    setAudioLevel(Math.max(left, right));
  };

  const startPreview = async () => {
    if (!selectedCamera || !selectedMicrophone) {
      setError('Please select both camera and microphone');
      return;
    }

    try {
      setError(undefined);
      setStatus('requesting-permission');
      console.log('[Broadcaster] Requesting camera and microphone access...');

      // STEP 1: Request raw media streams (this triggers browser permission dialog)
      // Use true for default device if we don't have real deviceIds yet
      const useDefaultCamera = selectedCamera.startsWith('video-');
      const useDefaultMic = selectedMicrophone.startsWith('audio-');
      
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: useDefaultMic ? true : {
          deviceId: { exact: selectedMicrophone },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        },
        video: useDefaultCamera ? true : {
          deviceId: { exact: selectedCamera },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('[Broadcaster] Permission granted! Stream tracks:', {
        audio: rawStream.getAudioTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        })),
        video: rawStream.getVideoTracks().map(t => ({
          label: t.label,
          enabled: t.enabled
        }))
      });

      // Re-enumerate devices now that we have permission to get actual device IDs and labels
      await requestPermissionsAndLoadDevices();

      // STEP 2: Initialize audio processing
      setStatus('initializing-audio');
      console.log('[Broadcaster] Initializing audio processing...');
      
      const audioStream = new MediaStream(rawStream.getAudioTracks());
      console.log('[Broadcaster] Created audio stream for processing:', audioStream.id);
      
      // Setup audio processing - the processed stream will be set via handleProcessedStream callback
      await setupAudioProcessing(audioStream);
      console.log('[Broadcaster] Audio processing initialized, waiting for processed stream from AudioMixer');

      // STEP 3: Wait for audio signal confirmation
      console.log('[Broadcaster] Waiting for audio signal...');
      let audioDetected = false;
      const maxWaitTime = 2000;
      const startTime = Date.now();

      while (!audioDetected && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (audioLevel > 0) {
          audioDetected = true;
          console.log('[Broadcaster] Audio signal confirmed:', audioLevel);
        }
      }

      if (!audioDetected) {
        console.warn('[Broadcaster] No audio signal detected yet - microphone might be muted or quiet');
      }

      setAudioReady(true);

      // STEP 4: Create LiveKit tracks for broadcasting
      // Get the actual device IDs from the active tracks
      const actualVideoId = rawStream.getVideoTracks()[0]?.getSettings().deviceId;
      
      // Wait a moment for processed audio to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!processedAudioStreamRef.current) {
        throw new Error('Processed audio stream not ready');
      }
      
      console.log('[Broadcaster] Using processed audio stream for LiveKit');
      
      // Create video track with LiveKit
      const videoTracks = await createLocalTracks({
        audio: false,
        video: actualVideoId ? { 
          deviceId: { exact: actualVideoId },
          resolution: {
            width: 1920,
            height: 1080
          }
        } : {
          resolution: {
            width: 1920,
            height: 1080
          }
        },
      });
      
      // Create audio track manually from the processed stream
      const processedAudioTrack = processedAudioStreamRef.current.getAudioTracks()[0];
      const livekitAudioTrack = new LocalAudioTrack(processedAudioTrack);
      
      const tracks = [...videoTracks, livekitAudioTrack];

      console.log('[Broadcaster] Created LiveKit tracks:', tracks.length);

      const videoTrack = tracks.find(t => t.kind === Track.Kind.Video);
      const audioTrack = tracks.find(t => t.kind === Track.Kind.Audio);

      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        videoTrackRef.current = videoTrack;
        console.log('[Broadcaster] Video track attached');
      }
      
      if (audioTrack) {
        audioTrackRef.current = audioTrack;
        console.log('[Broadcaster] Audio track ready for broadcast', {
          kind: audioTrack.kind,
          source: audioTrack.source,
          mediaStreamTrack: audioTrack.mediaStreamTrack?.id,
          enabled: audioTrack.mediaStreamTrack?.enabled
        });
      } else {
        console.error('[Broadcaster] No audio track found!');
        setError('Failed to create audio track');
      }

      setStatus('preview');
      console.log('[Broadcaster] Preview started successfully');
    } catch (e: any) {
      console.error('[Broadcaster] Preview error:', e);
      const errorMessage = e.message || 'Failed to start preview';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera/microphone access denied. Please allow access in your browser settings.');
      } else {
        setError(errorMessage);
      }
      
      setStatus('idle');
      setAudioReady(false);
    }
  };

  const stopPreview = () => {
    console.log('[Broadcaster] Stopping preview (keeping AudioContext alive)');
    
    // Disconnect audio nodes but keep AudioContext alive
    if (sourceNode) {
      sourceNode.disconnect();
    }
    setAudioLevel(0);
    setStatus('idle');
  };

  const fullCleanup = () => {
    console.log('[Broadcaster] Full cleanup - stopping all tracks and closing AudioContext');
    
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    
    // Stop raw audio stream tracks
    if (rawAudioStream) {
      rawAudioStream.getTracks().forEach(track => track.stop());
      setRawAudioStream(null);
    }
    
    if (sourceNode) {
      sourceNode.disconnect();
      setSourceNode(null);
    }
    if (audioContext) {
      audioContext.close(); // Only close AudioContext on full cleanup
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
        console.log('[Broadcaster] Video track published successfully');
      }
      if (audioTrackRef.current) {
        await room.localParticipant.publishTrack(audioTrackRef.current);
        console.log('[Broadcaster] Audio track published successfully', {
          sid: audioTrackRef.current.sid,
          kind: audioTrackRef.current.kind
        });
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
    
    // Use full cleanup when stopping broadcast
    fullCleanup();
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

  // Effect 1: Handle browser close/unload - runs when status/eventId change
  useEffect(() => {
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
      // NO fullCleanup here - just remove the event listener
    };
  }, [status, eventId]); // Only re-run when status or eventId changes

  // Effect 2: Full cleanup only on component unmount
  useEffect(() => {
    return () => {
      console.log('[Broadcaster] Component unmounting, full cleanup');
      
      // Disconnect LiveKit room
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      
      // Use full cleanup on unmount
      fullCleanup();
    };
  }, []); // Empty dependencies = only runs on mount/unmount

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

          {/* Real-time Microphone Test */}
          <div className="space-y-2">
            <Label>Live Microphone Level</Label>
            <MicrophoneMeter stream={rawAudioStream} />
          </div>

          <Button onClick={startPreview} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Preview
          </Button>
        </div>
      )}

      {/* Requesting Permission State */}
      {status === 'requesting-permission' && (
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Video className="h-12 w-12 animate-pulse text-blue-500" />
            <div>
              <h3 className="font-semibold mb-2">Requesting Access</h3>
              <p className="text-sm text-muted-foreground">
                Please allow camera and microphone access in your browser
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Initializing Audio State */}
      {status === 'initializing-audio' && (
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Mic className="h-12 w-12 animate-pulse text-green-500" />
            <div>
              <h3 className="font-semibold mb-2">Initializing Audio</h3>
              <p className="text-sm text-muted-foreground">
                Setting up audio processing...
              </p>
            </div>
          </div>
        </Card>
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

          {/* Professional Audio Mixer - only show when audio is ready */}
          {audioReady && audioContext && sourceNode && (
            <AudioMixer 
              audioContext={audioContext}
              sourceNode={sourceNode}
              onProcessedStream={handleProcessedStream}
              onAudioLevel={handleAudioLevel}
            />
          )}

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
