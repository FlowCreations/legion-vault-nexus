import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { sig } from '@/utils/signaling';

type Props = { eventId: string; iceServers?: RTCIceServer[] };

export const LiveBroadcaster = ({ eventId, iceServers }: Props) => {
  console.log('[LiveBroadcaster] render eventId=', eventId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [sigState, setSigState] = useState(sig.getState());
  const [state, setState] = useState<'idle' | 'preview' | 'waiting' | 'live'>('idle');
  const [error, setError] = useState<string>();
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; microphones: MediaDeviceInfo[] }>({
    cameras: [],
    microphones: []
  });
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');

  const rtcConfig = useMemo<RTCConfiguration>(
    () => ({ iceServers: iceServers ?? [{ urls: 'stun:stun.l.google.com:19302' }] }),
    [iceServers]
  );

  useEffect(() => {
    const id = setInterval(() => setSigState(sig.getState()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setError(undefined);
      sig.connect();

      try {
        await sig.waitForOpen(8000);
      } catch (e: any) {
        console.error('[LiveBroadcaster] signaling open failed', e);
        const d = sig.getDiagnostics();
        setError(`Signaling failed: ${e?.message || e}. url=${d.url} state=${d.state} close=${d.lastClose?.code || ''}:${d.lastClose?.reason || ''}`);
        return;
      }

      try {
        sig.send({ type: 'join', role: 'broadcaster', roomId: eventId });
      } catch (e: any) {
        setError(e.message ?? 'Failed to join room');
        return;
      }

      // Auto-start preview and stream
      if (!mounted) return;
      await loadDevices();
      if (!mounted) return;
      await startPreview();
      if (!mounted) return;
      startStream();
    };

    boot();

    const onViewerOffer = async (msg: any) => {
      console.log('[LiveBroadcaster] viewer-offer');
      try {
        if (!pcRef.current) {
          pcRef.current = new RTCPeerConnection(rtcConfig);
          pcRef.current.onicecandidate = (ev) => {
            if (ev.candidate) {
              try {
                sig.send({
                  type: 'ice-candidate',
                  roomId: eventId,
                  candidate: ev.candidate.toJSON(),
                  from: 'broadcaster',
                });
              } catch {}
            }
          };
          pcRef.current.onconnectionstatechange = () => {
            if (pcRef.current?.connectionState === 'connected') {
              setState('live');
            }
          };
        }
        const pc = pcRef.current;

        if (streamRef.current && pc.getSenders().length === 0) {
          streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
        }

        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sig.send({ type: 'broadcaster-answer', roomId: eventId, sdp: answer });
      } catch (e) {
        console.error('[LiveBroadcaster] answer flow failed', e);
        setError('Failed to answer viewer');
      }
    };

    const onIceFromViewer = async (msg: any) => {
      try {
        if (!pcRef.current) return;
        await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.warn('[LiveBroadcaster] addIceCandidate viewer failed', e);
      }
    };

    sig.on('viewer-offer', onViewerOffer);
    sig.on('ice-candidate', onIceFromViewer);

    return () => {
      mounted = false;
      sig.off('viewer-offer', onViewerOffer);
      sig.off('ice-candidate', onIceFromViewer);

      try {
        pcRef.current?.getSenders().forEach((s) => s.track?.stop());
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [eventId, rtcConfig]);

  async function loadDevices() {
    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(d => d.kind === 'videoinput');
      const microphones = deviceList.filter(d => d.kind === 'audioinput');
      
      permissionStream.getTracks().forEach(track => track.stop());
      
      setDevices({ cameras, microphones });
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (e: any) {
      console.error('Failed to enumerate devices:', e);
      setError('Permission denied. Please allow camera and microphone access.');
    }
  }

  async function startPreview() {
    try {
      if (!selectedCamera || !selectedMicrophone) {
        throw new Error('Please select camera and microphone first');
      }
      
      const media = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true
      });
      
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => {});
      }
      setState('preview');
      setError(undefined);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Permission denied. Please allow camera and microphone access.');
      } else if (e.name === 'NotFoundError') {
        setError('Camera or microphone not found. Please check your devices.');
      } else {
        setError(e?.message || 'Failed to access camera/microphone');
      }
    }
  }

  function startStream() {
    if (!streamRef.current) {
      startPreview();
    }
    setState('waiting');
  }

  function toggleVideo() {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }

  function toggleAudio() {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }

  function endStream() {
    pcRef.current?.getSenders().forEach(s => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setState('idle');
    sig.send({ type: 'end', role: 'broadcaster', roomId: eventId });
  }

  const connected = sigState === WebSocket.OPEN;
  const diag = sig.getDiagnostics();

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Signaling: {connected ? 'Connected' : 'Disconnected'}</span>
          <span className="opacity-60">Room: {eventId}</span>
          {!connected && (
            <Button size="sm" variant="outline" onClick={() => sig.connect()} className="h-6 px-2 text-xs">
              Reconnect
            </Button>
          )}
        </div>

        {!connected && (
          <div className="rounded-md border p-2 text-xs space-y-1">
            <div><span className="font-semibold">URL:</span> {diag.url}</div>
            <div><span className="font-semibold">State:</span> {String(diag.state)} (0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED)</div>
            {diag.lastClose && <div><span className="font-semibold">Close:</span> {diag.lastClose.code} – {diag.lastClose.reason || '(no reason)'}</div>}
            {diag.lastError && <div><span className="font-semibold">Error:</span> {diag.lastError}</div>}
          </div>
        )}

        <div className="rounded-xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>

        {state === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Camera {devices.cameras.length > 0 && `(${devices.cameras.length})`}
                </label>
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.cameras.length === 0 ? (
                      <SelectItem value="none" disabled>No cameras found</SelectItem>
                    ) : (
                      devices.cameras.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Microphone {devices.microphones.length > 0 && `(${devices.microphones.length})`}
                </label>
                <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.microphones.length === 0 ? (
                      <SelectItem value="none" disabled>No microphones found</SelectItem>
                    ) : (
                      devices.microphones.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={startPreview} 
              className="w-full"
              disabled={devices.cameras.length === 0 || devices.microphones.length === 0}
            >
              Start Preview
            </Button>
          </div>
        )}

        {state === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={toggleVideo} variant={videoEnabled ? 'default' : 'destructive'} size="icon">
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button onClick={toggleAudio} variant={audioEnabled ? 'default' : 'destructive'} size="icon">
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={startStream} className="w-full">Start Stream</Button>
          </div>
        )}

        {state === 'waiting' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">WAITING FOR VIEWERS</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleVideo} variant={videoEnabled ? 'default' : 'destructive'} size="icon">
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button onClick={toggleAudio} variant={audioEnabled ? 'default' : 'destructive'} size="icon">
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={endStream} variant="destructive" className="w-full">End Stream</Button>
          </div>
        )}

        {state === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">LIVE</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleVideo} variant={videoEnabled ? 'default' : 'destructive'} size="icon">
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button onClick={toggleAudio} variant={audioEnabled ? 'default' : 'destructive'} size="icon">
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={endStream} variant="destructive" className="w-full">End Stream</Button>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
};
