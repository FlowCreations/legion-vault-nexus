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
import { AudioDiagnostics } from './AudioDiagnostics';
import { useMicrophoneMeter } from '@/hooks/useMicrophoneMeter';
import { LiveViewerList } from './LiveViewerList';
import { LiveReactionFeed } from './LiveReactionFeed';
import { LiveChatPreview } from './LiveChatPreview';

type Props = { 
  eventId: string;
  isVisible?: boolean;
  onSwitchToChat?: () => void;
};

export function LiveBroadcaster({ eventId, isVisible = true, onSwitchToChat }: Props) {
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
  const [mixerReady, setMixerReady] = useState(false);
  const [rawMicStream, setRawMicStream] = useState<MediaStream | null>(null);
  const processedAudioStreamRef = useRef<MediaStream | null>(null);
  const rawAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const processedAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null);
  const isUnmountingRef = useRef(false); // Guard against state updates during unmount
  
  // Stable refs to prevent re-initialization during re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mixerReadyRef = useRef(false);

  // Initialize shared AudioContext once
  useEffect(() => {
    if (!sharedAudioContextRef.current || sharedAudioContextRef.current.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      sharedAudioContextRef.current = new AudioContextClass({ sampleRate: 48000 });
      console.log('[Broadcaster] Shared AudioContext created:', sharedAudioContextRef.current.state);
    }
  }, []);

  // Use the reusable mic meter hook with shared context
  // ONLY run when idle to prevent duplicate mic streams during broadcast
  const { micLevel, hasSignal, error: micError, analyser: micAnalyser, stream: micStream, audioContext: hookAudioContext } = useMicrophoneMeter({
    selectedMicId: status === 'idle' ? selectedMicrophone : undefined,
    smoothing: 0.3,
    threshold: -50,
    sharedAudioContext: sharedAudioContextRef.current,
  });

  useEffect(() => {
    requestPermissionsAndLoadDevices(false);
  }, []);

  // Helper functions to get fresh device lists
  const getCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
  };

  const getMicrophones = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'audioinput');
  };

  const requestPermissionsAndLoadDevices = async (requestPermission = false) => {
    try {
      console.log('[Broadcaster] Loading device list...', { requestPermission });
      
      // Request permission first if needed
      if (requestPermission) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          console.log('[Broadcaster] Permission granted');
          testStream.getTracks().forEach(track => track.stop());
        } catch (err) {
          console.error('[Broadcaster] Permission denied:', err);
          throw new Error('Microphone and camera access denied. Please allow access in browser settings.');
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Keep devices with or without deviceId for UI, but track which are real
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
        microphones: audioDevices.length,
        hasLabels: audioDevices[0]?.label && !audioDevices[0].label.startsWith('Microphone')
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
      throw err;
    }
  };

  const setupAudioProcessing = async (rawStream: MediaStream) => {
    try {
      const [track] = rawStream.getAudioTracks();
      
      if (!track) {
        throw new Error('No audio track found in stream');
      }

      console.log('[Broadcaster] 🎙️ Mic track status:', {
        label: track.label,
        readyState: track.readyState,
        enabled: track.enabled,
        muted: track.muted
      });

      // Validate track is active
      if (track.readyState === 'ended') {
        throw new Error('Microphone stream ended');
      }
      
      if (!track.enabled) {
        console.warn('[Broadcaster] ⚠️ Mic track disabled, enabling now');
        track.enabled = true;
      }

      // Listen for track state changes
      track.onmute = () => console.warn('[Broadcaster] ⚠️ Mic muted by system');
      track.onended = () => console.warn('[Broadcaster] ⚠️ Mic ended');
      track.onunmute = () => console.log('[Broadcaster] ✅ Mic unmuted');

      // Validate stream has audio tracks
      if (rawStream.getAudioTracks().length === 0) {
        throw new Error('No valid microphone input found');
      }

      // Use the shared AudioContext
      const ctx = sharedAudioContextRef.current;
      if (!ctx) {
        throw new Error('Shared AudioContext not initialized');
      }
      
      console.log('[Broadcaster] Using shared AudioContext, state:', ctx.state);
      
      // Resume if suspended (required for Safari/Chrome autoplay policy)
      if (ctx.state === 'suspended') {
        console.log('[Broadcaster] Resuming shared AudioContext...');
        await ctx.resume();
        console.log('[Broadcaster] AudioContext resumed:', ctx.state);
      }

      // Build audio graph: source → gain → analyser
      const source = ctx.createMediaStreamSource(rawStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      source.connect(gain);
      gain.connect(analyser);

      rawAudioAnalyserRef.current = analyser;

      console.log('[Broadcaster] Analyser connected. Gain:', gain.gain.value, 'Context state:', ctx.state);

      setAudioReady(true);
      
      // Store in stable refs to prevent re-renders from changing references
      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      
      // Still update state for initial render
      setAudioContext(ctx);
      setSourceNode(source);

      console.log('[Broadcaster] ✅ Audio processing complete using shared AudioContext');
      
    } catch (err) {
      console.error('[Broadcaster] Audio init failed:', err);
      throw err;
    }
  };

  const handleProcessedStream = (processedStream: MediaStream) => {
    console.log('[Broadcaster] 🎵 Received processed audio from Master Bus:', {
      streamId: processedStream.id,
      trackCount: processedStream.getAudioTracks().length
    });

    const processedTrack = processedStream.getAudioTracks()[0];
    
    if (!processedTrack) {
      console.error('[Broadcaster] ❌ No audio track in processed stream!');
      if (!isUnmountingRef.current) {
        setError('Audio processing failed - no track available');
      }
      return;
    }

    console.log('[Broadcaster] 📊 Processed track details:', {
      id: processedTrack.id,
      label: processedTrack.label,
      enabled: processedTrack.enabled,
      readyState: processedTrack.readyState,
      muted: processedTrack.muted,
      settings: processedTrack.getSettings()
    });

    // CRITICAL FIX #2: Verify track is live
    if (processedTrack.readyState !== 'live') {
      console.error('[Broadcaster] ❌ Processed track is NOT live! readyState:', processedTrack.readyState);
      if (!isUnmountingRef.current) {
        setError('Audio processing failed - track not live');
      }
      return;
    }

    // CRITICAL: Force enable the track
    if (!processedTrack.enabled) {
      console.warn('[Broadcaster] ⚠️ Processed track disabled, enabling it');
      processedTrack.enabled = true;
    }

    processedAudioStreamRef.current = processedStream;
    console.log('[Broadcaster] ✅ Processed audio stream ready for broadcast');
  };

  const handleMixerReady = () => {
    console.log('[Broadcaster] AudioMixer signaled READY');
    mixerReadyRef.current = true;
    setMixerReady(true);
  };

  const handleProcessedAnalyser = (analyser: AnalyserNode) => {
    console.log('[Broadcaster] Received processed analyser for diagnostics');
    processedAudioAnalyserRef.current = analyser;
  };

  const handleRawInputAnalyser = (analyser: AnalyserNode) => {
    console.log('[Broadcaster] Received raw input analyser from mixer');
    rawAudioAnalyserRef.current = analyser;
  };

  const handleAudioLevel = (left: number, right: number) => {
    setAudioLevel(Math.max(left, right));
  };

  const startPreview = async () => {
    try {
      setError(undefined);
      setStatus('requesting-permission');
      console.log('[Broadcaster] 🎬 Starting preview flow...');
      console.log('[Broadcaster] Requesting camera and microphone access...');

      // STEP 1: Request permission and reload devices with proper labels
      await requestPermissionsAndLoadDevices(true);
      
      // Wait for state to update with new device list
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use the selected devices (they should now have real IDs after permission)
      const currentCameras = cameras.length > 0 ? cameras : await getCameras();
      const currentMics = microphones.length > 0 ? microphones : await getMicrophones();
      
      const cameraId = selectedCamera || currentCameras[0]?.deviceId;
      const micId = selectedMicrophone || currentMics[0]?.deviceId;
      
      if (!cameraId || !micId) {
        throw new Error('No camera or microphone found. Please connect devices and try again.');
      }
      
      console.log('[Broadcaster] Using devices:', {
        camera: currentCameras.find(c => c.deviceId === cameraId)?.label,
        microphone: currentMics.find(m => m.deviceId === micId)?.label
      });
      
      // STEP 2: Request SEPARATE streams for video and audio
      // This is critical - don't reuse the same stream for both preview and audio processing
      // CRITICAL FIX: Use LiveKit's native audio track creation
      // This ensures LiveKit properly initializes the WebRTC audio pipeline
      console.log('[Broadcaster] 🎙️ Creating LiveKit tracks (audio + video)...');
      
      const tracks = await createLocalTracks({
        audio: {
          deviceId: micId && !micId.startsWith('audio-') ? { exact: micId } : undefined,
          echoCancellation: false,  // Get RAW signal for broadcasting
          noiseSuppression: false,  // Get RAW signal for broadcasting
          autoGainControl: false,   // Get RAW signal for broadcasting
          sampleRate: 48000,        // Broadcast quality
          channelCount: 1,          // Mono for voice (saves bandwidth)
        },
        video: {
          deviceId: cameraId && !cameraId.startsWith('video-') ? { exact: cameraId } : undefined,
          resolution: {
            width: 1920,
            height: 1080
          }
        }
      });

      console.log('[Broadcaster] ✅ LiveKit tracks created:', {
        total: tracks.length,
        video: tracks.filter(t => t.kind === Track.Kind.Video).length,
        audio: tracks.filter(t => t.kind === Track.Kind.Audio).length
      });

      // STEP 3a: Get RAW mic stream for monitoring (bypass LiveKit)
      const rawMicForMonitoring = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: micId && !micId.startsWith('audio-') ? { exact: micId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      setRawMicStream(rawMicForMonitoring);
      console.log('[Broadcaster] Raw mic stream for monitoring:', rawMicForMonitoring.id);

      // STEP 3b: Setup audio visualization from RAW stream
      setStatus('initializing-audio');
      await setupAudioProcessing(rawMicForMonitoring);
      console.log('[Broadcaster] Audio visualization initialized from raw stream');

      console.log('[Broadcaster] ✅ LiveKit tracks created successfully');

      // Attach tracks to refs and UI
      const videoTrack = tracks.find(t => t.kind === Track.Kind.Video);
      const livekitAudioTrack = tracks.find(t => t.kind === Track.Kind.Audio) as LocalAudioTrack;

      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        videoTrackRef.current = videoTrack;
        console.log('[Broadcaster] Video track attached');
      }
      
      if (livekitAudioTrack) {
        audioTrackRef.current = livekitAudioTrack;
        console.log('[Broadcaster] ✅ Audio track ready for broadcast', {
          kind: livekitAudioTrack.kind,
          source: livekitAudioTrack.source,
          mediaStreamTrack: livekitAudioTrack.mediaStreamTrack?.id,
          enabled: livekitAudioTrack.mediaStreamTrack?.enabled
        });
      } else {
        console.error('[Broadcaster] ❌ No audio track found!');
        setError('Failed to create audio track');
      }

      setStatus('preview');
      console.log('[Broadcaster] ✅ Preview started successfully with audio processing enabled');
    } catch (e: any) {
      console.error('[Broadcaster] Preview error:', e);
      let errorMessage = e.message || 'Failed to start preview';
      
      if (e.name === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        errorMessage = '🔒 Microphone/camera access blocked. Please enable permissions in browser settings.';
      } else if (e.name === 'NotReadableError') {
        errorMessage = '⚠️ Camera/microphone already in use by another application. Please close other apps and try again.';
      } else if (e.name === 'NotFoundError') {
        errorMessage = '❌ No camera or microphone found. Please connect devices and try again.';
      }
      
      setError(errorMessage);
      setStatus('idle');
      setAudioReady(false);
    }
  };

  const stopPreview = () => {
    console.log('[Broadcaster] Stopping preview - full cleanup');
    
    // Stop video tracks
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    
    // Stop raw video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('[Broadcaster] Stopping track:', track.kind, track.label);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    // Stop raw mic stream
    if (rawMicStream) {
      rawMicStream.getTracks().forEach(track => {
        console.log('[Broadcaster] Stopping raw mic track:', track.label);
        track.stop();
      });
      setRawMicStream(null);
    }
    
    // Disconnect audio processing
    if (rawAudioAnalyserRef.current) {
      rawAudioAnalyserRef.current.disconnect();
      rawAudioAnalyserRef.current = null;
    }
    
    if (sourceNode) {
      sourceNode.disconnect();
      setSourceNode(null);
    }
    
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    
    setAudioLevel(0);
    setAudioReady(false);
    mixerReadyRef.current = false;
    setMixerReady(false);
    setStatus('idle');
  };

  const switchCamera = async (newCameraId: string) => {
    if (status !== 'preview' && status !== 'live') return;
    
    try {
      console.log('[Broadcaster] Switching camera to:', newCameraId);
      
      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: newCameraId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      // If live, unpublish old track first
      if (status === 'live' && roomRef.current && videoTrackRef.current) {
        console.log('[Broadcaster] Unpublishing old video track...');
        await roomRef.current.localParticipant.unpublishTrack(videoTrackRef.current);
      }
      
      // Stop old video track
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
      }
      
      // Create new LiveKit video track
      const newVideoTrack = await createLocalTracks({
        audio: false,
        video: {
          deviceId: { exact: newCameraId },
          resolution: {
            width: 1920,
            height: 1080
          }
        }
      });
      
      const videoTrack = newVideoTrack.find(t => t.kind === Track.Kind.Video);
      
      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        videoTrackRef.current = videoTrack;
        
        // If live, publish new track
        if (status === 'live' && roomRef.current) {
          console.log('[Broadcaster] Publishing new video track...');
          await roomRef.current.localParticipant.publishTrack(videoTrack);
        }
        
        console.log('[Broadcaster] Camera switched successfully');
      }
      
      setSelectedCamera(newCameraId);
    } catch (err) {
      console.error('[Broadcaster] Failed to switch camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };

  const switchMicrophone = async (newMicId: string) => {
    if (status !== 'preview' && status !== 'live') return;
    
    try {
      console.log('[Broadcaster] Switching microphone to:', newMicId);
      
      // If live, unpublish old audio track first
      if (status === 'live' && roomRef.current && audioTrackRef.current) {
        console.log('[Broadcaster] Unpublishing old audio track...');
        await roomRef.current.localParticipant.unpublishTrack(audioTrackRef.current);
      }
      
      // Stop old audio processing
      if (sourceNode) {
        sourceNode.disconnect();
      }
      if (rawAudioAnalyserRef.current) {
        rawAudioAnalyserRef.current.disconnect();
      }
      if (rawMicStream) {
        rawMicStream.getTracks().forEach(track => track.stop());
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
      }
      
      // Get new audio stream
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: newMicId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      });
      
      console.log('[Broadcaster] New microphone stream acquired');
      
      // Store new raw mic stream
      setRawMicStream(newAudioStream);
      
      // Reinitialize audio processing with new stream
      await setupAudioProcessing(newAudioStream);
      
      // Wait for mixer to be ready again
      mixerReadyRef.current = false;
      setMixerReady(false);
      const mixerTimeout = 5000;
      const mixerStartTime = Date.now();
      
      while (!mixerReadyRef.current && Date.now() - mixerStartTime < mixerTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!mixerReadyRef.current) {
        throw new Error('Audio mixer failed to reinitialize');
      }
      
      // Wait for processed stream
      const streamTimeout = 2000;
      const streamStartTime = Date.now();
      
      while (!processedAudioStreamRef.current && Date.now() - streamStartTime < streamTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!processedAudioStreamRef.current) {
        throw new Error('Processed audio stream not ready');
      }
      
      // Create new audio track
      const processedAudioTrack = processedAudioStreamRef.current.getAudioTracks()[0];
      const livekitAudioTrack = new LocalAudioTrack(processedAudioTrack);
      audioTrackRef.current = livekitAudioTrack;
      
      // If live, publish new track
      if (status === 'live' && roomRef.current) {
        console.log('[Broadcaster] Publishing new audio track...');
        livekitAudioTrack.unmute();
        await roomRef.current.localParticipant.publishTrack(livekitAudioTrack, {
          name: 'broadcaster-audio',
          source: Track.Source.Microphone
        });
      }
      
      setSelectedMicrophone(newMicId);
      console.log('[Broadcaster] Microphone switched successfully');
    } catch (err) {
      console.error('[Broadcaster] Failed to switch microphone:', err);
      setError('Failed to switch microphone. Please try again.');
    }
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
    
    if (rawAudioStream) {
      rawAudioStream.getTracks().forEach(track => track.stop());
      setRawAudioStream(null);
    }
    
    if (rawMicStream) {
      rawMicStream.getTracks().forEach(track => track.stop());
      setRawMicStream(null);
    }
    
    if (rawAudioAnalyserRef.current) {
      rawAudioAnalyserRef.current.disconnect();
      rawAudioAnalyserRef.current = null;
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
    setAudioReady(false);
    setMixerReady(false);
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
      
      // CRITICAL FIX #5: Resume AudioContext if suspended
      const ctx = audioContextRef.current || audioContext;
      if (ctx) {
        console.log('[Broadcaster] 🔍 AudioContext state before going live:', ctx.state);
        if (ctx.state === 'suspended') {
          console.warn('[Broadcaster] ⚠️ AudioContext is suspended, resuming...');
          await ctx.resume();
          console.log('[Broadcaster] ✅ AudioContext resumed, new state:', ctx.state);
        }
      } else {
        console.error('[Broadcaster] ❌ No AudioContext available!');
        throw new Error('AudioContext not initialized');
      }
      
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        if (isUnmountingRef.current) return; // Prevent state updates during unmount
        console.log('[Broadcaster] ✅ Connected to room');
        setStatus('live');
      });
      
      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log('[Broadcaster] Connection quality:', quality, participant?.identity);
      });
      
      room.on(RoomEvent.Reconnecting, () => {
        console.warn('[Broadcaster] ⚠️ Reconnecting to room...');
      });
      
      room.on(RoomEvent.Reconnected, () => {
        console.log('[Broadcaster] ✅ Reconnected to room');
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('[Broadcaster] ❌ Disconnected from room:', reason);
        
        // Only update state if not unmounting
        if (!isUnmountingRef.current) {
          // Update event status back to scheduled when disconnected
          supabase
            .from('livestream_events')
            .update({ status: 'scheduled' })
            .eq('id', eventId)
            .then(({ error }) => {
              if (error) console.error('[Broadcaster] Error updating status on disconnect:', error);
            });
          setStatus('idle');
          setError('Disconnected from broadcast. Please try reconnecting.');
        }
      });
      
      room.on(RoomEvent.MediaDevicesError, (error) => {
        if (isUnmountingRef.current) return; // Prevent state updates during unmount
        console.error('[Broadcaster] ❌ Media device error:', error);
        setError('Media device error: ' + error.message);
      });

      console.log('[Broadcaster] Connecting to LiveKit...', { url: livekitUrl });
      await room.connect(livekitUrl, tokenData.token);
      console.log('[Broadcaster] ✅ Connected! Publishing tracks...');

      if (videoTrackRef.current) {
        await room.localParticipant.publishTrack(videoTrackRef.current);
        console.log('[Broadcaster] ✅ Video track published');
      }
      
      if (audioTrackRef.current) {
        const audioMSTrack = audioTrackRef.current.mediaStreamTrack;
        console.log('[Broadcaster] 🎙️ Publishing audio track...');
        console.log('[Broadcaster] 🔍 Audio track details before publish:', {
          kind: audioMSTrack.kind,
          enabled: audioMSTrack.enabled,
          readyState: audioMSTrack.readyState,
          label: audioMSTrack.label,
          muted: audioMSTrack.muted,
          settings: audioMSTrack.getSettings()
        });
        
        // CRITICAL: Verify track is live FIRST
        if (audioMSTrack.readyState !== 'live') {
          console.error('[Broadcaster] ❌ Cannot publish - audio track is NOT live! readyState:', audioMSTrack.readyState);
          throw new Error(`Audio track not live (${audioMSTrack.readyState}) - cannot publish`);
        }
        
        // CRITICAL: Force track enabled and add content hint
        audioMSTrack.enabled = true;
        audioMSTrack.contentHint = 'speech';
        console.log('[Broadcaster] ✅ Track enabled and contentHint set to "speech"');
        
        // Ensure LiveKit track itself is unmuted
        audioTrackRef.current.unmute();
        
        console.log('[Broadcaster] 📤 Publishing track to LiveKit...');
        
        // Publish with explicit options (removed delay)
        await room.localParticipant.publishTrack(audioTrackRef.current, {
          name: 'broadcaster-audio',
          source: Track.Source.Microphone,
          stopMicTrackOnMute: false,
        });
        console.log('[Broadcaster] ✅ Audio track published');
        
        // Verify published track immediately
        const publishedTracks = Array.from(room.localParticipant.audioTrackPublications.values());
        if (publishedTracks.length === 0) {
          console.error('[Broadcaster] ❌ No audio track publications found!');
          throw new Error('Audio track not published');
        }
        const firstPub = publishedTracks[0];
        if (firstPub.isMuted) {
          console.error('[Broadcaster] ❌ Published track is muted!');
          throw new Error('Audio track published but muted');
        }
        console.log('[Broadcaster] ✅ Published track verified - unmuted and active');
        
        // CRITICAL FIX #4: Verify publication succeeded
        const audioPubs = Array.from(room.localParticipant.audioTrackPublications.values());
        console.log('[Broadcaster] 🔍 Audio publications after publish:', audioPubs.length);
        audioPubs.forEach(pub => {
          console.log('[Broadcaster] 🔍 Publication details:', {
            sid: pub.trackSid,
            muted: pub.isMuted,
            trackEnabled: pub.track?.mediaStreamTrack?.enabled,
            trackReadyState: pub.track?.mediaStreamTrack?.readyState
          });
        });
        
        // Track bytes sent to detect transmission issues
        let lastBytesSent = 0;
        let bytesCheckStartTime = Date.now();
        let checksCount = 0;
        
        // Monitor audio transmission after 2 seconds
        setTimeout(async () => {
          console.log('[Broadcaster] 📊 Checking audio transmission stats...');
          const audioPublications = Array.from(room.localParticipant.audioTrackPublications.values());
          
          if (audioPublications.length === 0) {
            console.error('[Broadcaster] ❌ No audio publications found!');
            setError('Audio not publishing. Please restart broadcast.');
            return;
          }
          
          for (const pub of audioPublications) {
            console.log('[Broadcaster] 📡 Audio publication:', {
              sid: pub.trackSid,
              trackName: pub.trackName,
              source: pub.source,
              muted: pub.isMuted,
              enabled: pub.track?.mediaStreamTrack?.enabled,
              readyState: pub.track?.mediaStreamTrack?.readyState
            });
            
            // Get WebRTC stats
            if (pub.track) {
              try {
                const stats = await pub.track.getRTCStatsReport();
                let foundStats = false;
                stats?.forEach((stat: any) => {
                  if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
                    foundStats = true;
                    console.log('[Broadcaster] 🔊 Audio RTC Stats:', {
                      bytesSent: stat.bytesSent,
                      packetsSent: stat.packetsSent,
                      timestamp: stat.timestamp
                    });
                    
                    checksCount++;
                    const elapsedSeconds = (Date.now() - bytesCheckStartTime) / 1000;
                    const bytesDelta = stat.bytesSent - lastBytesSent;
                    
                    // Only check after we've had time to send data (after 5 seconds)
                    if (checksCount > 2 && elapsedSeconds > 5) {
                      if (bytesDelta === 0 && stat.bytesSent === lastBytesSent) {
                        console.error('[Broadcaster] ❌ No audio data being sent after 5 seconds!');
                        setError('Audio not transmitting. Check microphone permissions.');
                      } else if (bytesDelta > 0) {
                        // Audio is flowing, clear any previous errors
                        console.log('[Broadcaster] ✅ Audio transmitting:', bytesDelta, 'bytes since last check');
                      }
                    }
                    
                    lastBytesSent = stat.bytesSent;
                  }
                });
                
                if (!foundStats) {
                  console.warn('[Broadcaster] ⚠️ No outbound-rtp stats found');
                }
              } catch (err) {
                console.error('[Broadcaster] Failed to get RTC stats:', err);
              }
            }
          }
        }, 2000);
      } else {
        console.error('[Broadcaster] ❌ No audio track to publish!');
        setError('Audio track missing. Please restart preview.');
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
    
    // Update event status to ended so LiveStudio turns off
    const { error: updateError } = await supabase
      .from('livestream_events')
      .update({ status: 'ended' })
      .eq('id', eventId);

    if (updateError) {
      console.error('[Broadcaster] Error updating event status:', updateError);
    } else {
      console.log('[Broadcaster] ✅ Event status updated to "ended"');
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
    console.log('[Broadcaster] Component mounted');
    isUnmountingRef.current = false; // Reset flag on mount
    
    return () => {
      console.log('[Broadcaster] Component unmounting - setting guard flag');
      isUnmountingRef.current = true; // Set flag FIRST to prevent any state updates
      
      // Small delay to ensure flag is set before cleanup
      setTimeout(() => {
        console.log('[Broadcaster] Starting cleanup sequence');
        
        // Disconnect LiveKit room first
        if (roomRef.current) {
          console.log('[Broadcaster] ❌ Disconnecting from room');
          try {
            roomRef.current.disconnect();
          } catch (err) {
            console.error('[Broadcaster] Error disconnecting:', err);
          }
          roomRef.current = null;
        }
        
        // Stop all tracks
        if (videoTrackRef.current) {
          videoTrackRef.current.stop();
          videoTrackRef.current = null;
        }
        if (audioTrackRef.current) {
          audioTrackRef.current.stop();
          audioTrackRef.current = null;
        }
        
        // Clean up streams
        if (rawMicStream) {
          rawMicStream.getTracks().forEach(track => track.stop());
        }
        if (rawAudioStream) {
          rawAudioStream.getTracks().forEach(track => track.stop());
        }
        
        // Disconnect audio nodes
        if (rawAudioAnalyserRef.current) {
          rawAudioAnalyserRef.current.disconnect();
          rawAudioAnalyserRef.current = null;
        }
        if (sourceNode) {
          sourceNode.disconnect();
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
        
        console.log('[Broadcaster] Cleanup complete');
      }, 0);
    };
  }, []); // Empty dependencies = only runs on mount/unmount

  if (!isVisible) {
    return null;
  }

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
              <SelectContent className="bg-background z-50">
                {cameras.map(cam => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
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
              <SelectContent className="bg-background z-50">
                {microphones.map(mic => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Real-time Microphone Test */}
          {rawMicStream && (
            <div className="space-y-2">
              <Label>Live Microphone Level</Label>
              <MicrophoneMeter stream={rawMicStream} />
            </div>
          )}

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
          <div className={`grid gap-6 ${status === 'live' ? 'lg:grid-cols-[2fr,350px]' : ''}`}>
            {/* Main Video and Controls Column */}
            <div className="space-y-4">
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
                  key="audio-mixer-singleton"
                  audioContext={audioContextRef.current || audioContext}
                  sourceNode={sourceNodeRef.current || sourceNode}
                  onProcessedStream={handleProcessedStream}
                  onAudioLevel={handleAudioLevel}
                  onReady={handleMixerReady}
                  onProcessedAnalyser={handleProcessedAnalyser}
                  onRawInputAnalyser={handleRawInputAnalyser}
                />
              )}

          {/* Device Selection During Preview */}
          {status === 'preview' && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Device Settings</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Camera</Label>
                  <Select value={selectedCamera} onValueChange={switchCamera}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {cameras.map(cam => (
                        <SelectItem key={cam.deviceId} value={cam.deviceId}>
                          {cam.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Microphone</Label>
                  <Select value={selectedMicrophone} onValueChange={switchMicrophone}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {microphones.map(mic => (
                        <SelectItem key={mic.deviceId} value={mic.deviceId}>
                          {mic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
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
            </div>
            
            {/* Live Viewers - Only shown when live */}
            {status === 'live' && (
              <div className="space-y-4">
                <LiveViewerList eventId={eventId} />
              </div>
            )}
          </div>
          
          {/* Live Chat Below Video - Only shown when live */}
          {status === 'live' && (
            <div className="mt-6">
              <LiveChatPreview 
                eventId={eventId} 
                onViewFullChat={onSwitchToChat}
              />
            </div>
          )}
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
