import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignalingClient } from "@/utils/signaling";
import { createPeerConnection, safePlay } from "@/utils/webrtcHelper";

interface LiveBroadcasterProps {
  eventId: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export const LiveBroadcaster = ({ eventId, onStreamStart, onStreamEnd }: LiveBroadcasterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sig] = useState(() => new SignalingClient());
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [state, setState] = useState<'idle' | 'preview' | 'waiting' | 'live' | 'error'>('idle');
  const [err, setErr] = useState<string | undefined>();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; microphones: MediaDeviceInfo[] }>({
    cameras: [],
    microphones: []
  });
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');

  useEffect(() => {
    sig.connect();
    
    setTimeout(() => {
      sig.send({ type: 'join', role: 'broadcaster', roomId: eventId });
    }, 500);
    
    loadDevices();
    
    return () => {
      sig.close();
    };
  }, [eventId]);

  async function loadDevices() {
    try {
      // Request permission first to unlock device labels
      const permissionStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Now enumerate devices (labels will be available)
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(d => d.kind === 'videoinput');
      const microphones = deviceList.filter(d => d.kind === 'audioinput');
      
      // Stop the permission stream (we only needed it for labels)
      permissionStream.getTracks().forEach(track => track.stop());
      
      setDevices({ cameras, microphones });
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (e: any) {
      console.error('Failed to enumerate devices:', e);
      setErr('Permission denied. Please allow camera and microphone access.');
      setState('error');
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
      setMediaStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await safePlay(videoRef.current);
      }
      setState('preview');
      setErr(undefined);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setErr('Permission denied. Please allow camera and microphone access.');
      } else if (e.name === 'NotFoundError') {
        setErr('Camera or microphone not found. Please check your devices.');
      } else if (e.name === 'OverconstrainedError') {
        setErr('Selected device is not available. Please choose another.');
      } else {
        setErr(e?.message || 'Failed to access camera/microphone');
      }
      setState('error');
    }
  }

  // Handle viewer offers and ICE
  useEffect(() => {
    if (!eventId) return;
    const handler = async (msg: any) => {
      if (msg.roomId !== eventId) return;
      if (msg.type === 'viewer-offer') {
        try {
          const media = mediaStream || await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (!pc) {
            const newPc = createPeerConnection({
              onConnState: (s) => {
                console.log('[LiveBroadcaster] Connection state:', s);
                if (s === 'connected') {
                  setState('live');
                  toast.success("Viewer connected! You're live!");
                }
              }
            });
            media.getTracks().forEach(t => newPc.addTrack(t, media));
            newPc.onicecandidate = (ev) => {
              if (ev.candidate) sig.send({ type: 'ice', role: 'broadcaster', roomId: eventId, payload: ev.candidate });
            };
            setPc(newPc);
            await newPc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await newPc.createAnswer();
            await newPc.setLocalDescription(answer);
            sig.send({ type: 'broadcaster-answer', role: 'broadcaster', roomId: eventId, payload: answer });
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sig.send({ type: 'broadcaster-answer', role: 'broadcaster', roomId: eventId, payload: answer });
          }
        } catch (e: any) {
          setErr(e?.message || 'Offer handling failed');
          setState('error');
        }
      }
      if (msg.type === 'ice' && msg.payload && msg.role === 'viewer' && pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
        } catch (e) {
          console.error('[LiveBroadcaster] Failed to add ICE candidate:', e);
        }
      }
    };
    sig.onMessage(handler);
  }, [pc, eventId, mediaStream]);

  async function startStream() {
    if (!mediaStream) {
      await startPreview();
    }
    setState('waiting');
    await supabase.from('livestream_events').update({ status: 'live' }).eq('id', eventId);
    onStreamStart?.();
    toast.info("Waiting for viewers to connect...");
  }

  function toggleVideo() {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }

  function toggleAudio() {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }

  async function endStream() {
    pc?.getSenders().forEach(s => s.track?.stop());
    pc?.close();
    setPc(null);
    mediaStream?.getTracks().forEach(track => track.stop());
    setMediaStream(null);
    setState('idle');
    sig.send({ type: 'end', role: 'broadcaster', roomId: eventId });
    await supabase.from('livestream_events').update({ status: 'ended' }).eq('id', eventId);
    onStreamEnd?.();
  }


  return (
    <Card className="p-4">
      <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
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
              
              {(devices.cameras.length === 0 || devices.microphones.length === 0) && (
                <p className="text-sm text-yellow-600">
                  ⚠️ Please grant camera and microphone permissions to see available devices.
                </p>
              )}
              
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
          <p className="text-sm text-muted-foreground text-center">
            Your stream is ready. Viewers can now join.
          </p>
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

      {err && <p className="text-destructive text-sm mt-2">{err}</p>}
    </Card>
  );
};