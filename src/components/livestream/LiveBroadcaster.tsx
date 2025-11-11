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
  const [mixerReady, setMixerReady] = useState(false);
  const [rawMicStream, setRawMicStream] = useState<MediaStream | null>(null);
  const processedAudioStreamRef = useRef<MediaStream | null>(null);
  const rawAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const processedAudioAnalyserRef = useRef<AnalyserNode | null>(null);

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
      
      // Include all devices, with or without labels
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
      // Ensure audio track is enabled and active
      const audioTracks = rawStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track found in stream');
      }
      
      const audioTrack = audioTracks[0];
      console.log('[Broadcaster] Mic track status:', {
        label: audioTrack.label,
        readyState: audioTrack.readyState,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted
      });
      
      // Validate track is live
      if (audioTrack.readyState === 'ended') {
        throw new Error('Microphone stream inactive - track ended');
      }
      
      if (!audioTrack.enabled) {
        console.log('[Broadcaster] Enabling audio track...');
        audioTrack.enabled = true;
      }
      
      // Create AudioContext with proper initialization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 48000 });
      
      console.log('[Broadcaster] AudioContext created, state:', ctx.state);
      
      // CRITICAL: Resume audio context - required for browser autoplay policy
      if (ctx.state === 'suspended') {
        console.log('[Broadcaster] Resuming suspended AudioContext...');
        await ctx.resume();
        console.log('[Broadcaster] AudioContext resumed, state:', ctx.state);
      }
      
      if (ctx.state !== 'running') {
        throw new Error('AudioContext failed to start. Click Start Preview again.');
      }
      
      // Build audio graph: mic → gain → analyzer (NO destination!)
      const micSource = ctx.createMediaStreamSource(rawStream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // Connect ONLY: mic → gain → analyzer
      // DO NOT connect to destination (that's for speakers)
      micSource.connect(gainNode);
      gainNode.connect(analyser);
      
      rawAudioAnalyserRef.current = analyser;
      
      console.log('[Broadcaster] Audio graph connected: mic → gain → analyzer');
      
      // Verify analyzer receives input
      const verifyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(verifyData);
      const initialAvg = verifyData.reduce((a, b) => a + b, 0) / verifyData.length;
      console.log('[Broadcaster] Initial analyzer input level:', initialAvg.toFixed(2));
      
      // Test audio signal detection using FREQUENCY data
      console.log('[Broadcaster] Testing audio signal (speak into mic)...');
      let audioDetected = false;
      const maxWaitTime = 3000;
      const startTime = Date.now();
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let maxAvg = 0;
      
      while (!audioDetected && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use FREQUENCY data for accurate amplitude measurement
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / bufferLength;
        maxAvg = Math.max(maxAvg, avg);
        
        console.log('[Broadcaster] Mic avg level:', avg.toFixed(2), '| Track:', audioTrack.readyState, audioTrack.muted ? 'MUTED' : 'LIVE');
        
        // Detect signal when average > 2 (indicates real audio data)
        if (avg > 2) {
          audioDetected = true;
          console.log('[Broadcaster] ✅ Audio signal DETECTED! Avg level:', avg.toFixed(2));
        }
      }
      
      console.log('[Broadcaster] Audio detection complete:', {
        detected: audioDetected,
        maxAvg: maxAvg.toFixed(2),
        trackState: audioTrack.readyState
      });
      
      // Don't fail if silent - user might start speaking later
      if (!audioDetected) {
        console.log('[Broadcaster] ⚠️ No audio detected yet (max avg:', maxAvg.toFixed(2), '). Proceeding - user may speak later.');
      }

      setAudioReady(true);
      setAudioContext(ctx);
      setSourceNode(micSource);

      console.log('[Broadcaster] ✅ Audio processing setup complete');
      
    } catch (err) {
      console.error('[Broadcaster] Audio processing setup failed:', err);
      throw err;
    }
  };

  const handleProcessedStream = (processedStream: MediaStream) => {
    console.log('[Broadcaster] Received processed audio stream from mixer:', processedStream.id);
    processedAudioStreamRef.current = processedStream;
    console.log('[Broadcaster] Processed stream stored for LiveKit');
  };

  const handleMixerReady = () => {
    console.log('[Broadcaster] AudioMixer signaled READY');
    mixerReadyRef.current = true;
    setMixerReady(true);
  };
  
  const mixerReadyRef = useRef(false);

  const handleProcessedAnalyser = (analyser: AnalyserNode) => {
    console.log('[Broadcaster] Received processed analyser for diagnostics');
    processedAudioAnalyserRef.current = analyser;
  };

  const handleAudioLevel = (left: number, right: number) => {
    setAudioLevel(Math.max(left, right));
  };

  const startPreview = async () => {
    try {
      setError(undefined);
      setStatus('requesting-permission');
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
      console.log('[Broadcaster] Requesting video stream...');
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: cameraId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      console.log('[Broadcaster] Requesting audio stream...');
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: micId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      console.log('[Broadcaster] ✅ Streams acquired!', {
        video: videoStream.getVideoTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        })),
        audio: audioStream.getAudioTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted,
          settings: t.getSettings()
        }))
      });

      // STEP 3: Initialize audio processing with SEPARATE audio stream
      setStatus('initializing-audio');
      console.log('[Broadcaster] Initializing audio processing with dedicated audio stream...');
      
      // Store raw mic stream for visualization
      setRawMicStream(audioStream);
      
      // Setup audio processing - this will test raw audio and set audioReady
      await setupAudioProcessing(audioStream);
      console.log('[Broadcaster] Audio processing initialized, waiting for AudioMixer to be ready');

      // STEP 4: Wait for AudioMixer to signal ready
      console.log('[Broadcaster] Waiting for AudioMixer initialization...');
      mixerReadyRef.current = false;
      setMixerReady(false);
      const mixerTimeout = 5000;
      const mixerStartTime = Date.now();

      while (!mixerReadyRef.current && Date.now() - mixerStartTime < mixerTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!mixerReadyRef.current) {
        throw new Error('Audio mixer failed to initialize. Please try again.');
      }
      
      console.log('[Broadcaster] AudioMixer ready!');

      // STEP 5: Wait for processed stream
      const streamTimeout = 2000;
      const streamStartTime = Date.now();
      
      while (!processedAudioStreamRef.current && Date.now() - streamStartTime < streamTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!processedAudioStreamRef.current) {
        throw new Error('Processed audio stream not ready');
      }
      
      console.log('[Broadcaster] Processed audio stream confirmed');

      // STEP 6: Create LiveKit tracks for broadcasting
      const actualVideoId = videoStream.getVideoTracks()[0]?.getSettings().deviceId;
      
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
    if (status !== 'preview') return;
    
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
        console.log('[Broadcaster] Camera switched successfully');
      }
      
      setSelectedCamera(newCameraId);
    } catch (err) {
      console.error('[Broadcaster] Failed to switch camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };

  const switchMicrophone = async (newMicId: string) => {
    if (status !== 'preview') return;
    
    try {
      console.log('[Broadcaster] Switching microphone to:', newMicId);
      
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
      setStatus('initializing-audio');
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
      
      setStatus('preview');
      setSelectedMicrophone(newMicId);
      console.log('[Broadcaster] Microphone switched successfully');
    } catch (err) {
      console.error('[Broadcaster] Failed to switch microphone:', err);
      setError('Failed to switch microphone. Please try again.');
      setStatus('preview');
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
      
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('[Broadcaster] Connected to room');
        // Force immediate state update to show live buttons
        setStatus('live');
        // Force a re-render
        setTimeout(() => setStatus('live'), 0);
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
              onReady={handleMixerReady}
              onProcessedAnalyser={handleProcessedAnalyser}
            />
          )}

          {/* Audio Diagnostics Panel */}
          {(status === 'preview' || status === 'live' || status === 'connecting') && (
            <AudioDiagnostics
              audioContext={audioContext}
              rawAudioAnalyser={rawAudioAnalyserRef.current}
              processedAudioAnalyser={processedAudioAnalyserRef.current}
              room={roomRef.current}
              status={status}
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
