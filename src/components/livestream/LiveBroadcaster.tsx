import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Square, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LiveBroadcasterProps {
  eventId: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export const LiveBroadcaster = ({ eventId, onStreamStart, onStreamEnd }: LiveBroadcasterProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadDevices();
    return () => {
      stopStream();
    };
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
      
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      
      if (videoDevices.length > 0) setSelectedVideo(videoDevices[0].deviceId);
      if (audioDevices.length > 0) setSelectedAudio(audioDevices[0].deviceId);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load camera/microphone devices');
    }
  };

  const startStream = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedVideo ? { deviceId: selectedVideo, width: 1920, height: 1080 } : true,
        audio: selectedAudio ? { deviceId: selectedAudio } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Update event status to live
      const { error } = await supabase
        .from('livestream_events')
        .update({ status: 'live', actual_start: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      setIsStreaming(true);
      onStreamStart?.();
      toast.success('Live stream started!');
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start stream. Please check camera permissions.');
    }
  };

  const stopStream = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Update event status to ended
    const { error } = await supabase
      .from('livestream_events')
      .update({ status: 'ended', actual_end: new Date().toISOString() })
      .eq('id', eventId);

    if (error) console.error('Error updating event:', error);

    setIsStreaming(false);
    onStreamEnd?.();
    toast.success('Stream ended');
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-lg">Preview - Stream Not Started</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Camera</label>
            <Select value={selectedVideo} onValueChange={setSelectedVideo} disabled={isStreaming}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background" position="popper" sideOffset={5}>
                {videoDevices.filter(d => d.deviceId && d.deviceId.length > 0).map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Microphone</label>
            <Select value={selectedAudio} onValueChange={setSelectedAudio} disabled={isStreaming}>
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background" position="popper" sideOffset={5}>
                {audioDevices.filter(d => d.deviceId && d.deviceId.length > 0).map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {!isStreaming ? (
            <Button onClick={startStream} size="lg" className="gap-2">
              <Video className="w-5 h-5" />
              Start Stream
            </Button>
          ) : (
            <>
              <Button onClick={toggleVideo} variant={videoEnabled ? "default" : "destructive"} size="lg">
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              <Button onClick={toggleAudio} variant={audioEnabled ? "default" : "destructive"} size="lg">
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button onClick={stopStream} variant="destructive" size="lg" className="gap-2">
                <Square className="w-5 h-5" />
                End Stream
              </Button>
            </>
          )}
        </div>

        {isStreaming && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">LIVE</span>
          </div>
        )}
      </div>
    </Card>
  );
};