import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, createLocalTracks, Track, LocalTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Video, VideoOff, Mic, MicOff, Play, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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

  const setupAudioMonitoring = (audioTrack: LocalTrack) => {
    try {
      const mediaStreamTrack = audioTrack.mediaStreamTrack;
      if (!mediaStreamTrack) {
        console.error('[Broadcaster] No mediaStreamTrack available');
        return;
      }

      const stream = new MediaStream([mediaStreamTrack]);
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(gainNode);
      gainNode.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;

      console.log('[Broadcaster] Audio monitoring setup complete');

      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current && (status === 'preview' || status === 'live' || status === 'connecting')) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = Math.min(100, (average / 255) * 100);
          setAudioLevel(normalizedLevel);
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
    } catch (err) {
      console.error('[Broadcaster] Audio monitoring setup failed:', err);
    }
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
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      console.log('[Broadcaster] Permissions granted');

      const tracks = await createLocalTracks({
        audio: { 
          deviceId: { exact: selectedMicrophone },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: { 
          deviceId: { exact: selectedCamera }
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
        console.log('[Broadcaster] Audio track created, setting up monitoring');
        setupAudioMonitoring(audioTrack);
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
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
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

  const handleMicGainChange = (value: number[]) => {
    setMicGain(value[0]);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value[0] / 100;
    }
  };

  const handleMusicGainChange = (value: number[]) => {
    setMusicGain(value[0]);
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

          {/* Audio Level Meter */}
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Audio Input Level</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(audioLevel)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-100 ${
                      audioLevel > 80 ? 'bg-red-500' : 
                      audioLevel > 50 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>

              {/* Mixer Controls */}
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Microphone Gain
                    </Label>
                    <span className="text-xs text-muted-foreground">{micGain}%</span>
                  </div>
                  <Slider
                    value={[micGain]}
                    onValueChange={handleMicGainChange}
                    max={200}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Music/Audio Gain
                    </Label>
                    <span className="text-xs text-muted-foreground">{musicGain}%</span>
                  </div>
                  <Slider
                    value={[musicGain]}
                    onValueChange={handleMusicGainChange}
                    max={200}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>

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
