import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createPeerConnection } from "@/utils/webrtcHelper";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { LiveReactions } from "./LiveReactions";

interface LiveViewerProps {
  eventId: string;
  streamUrl?: string;
  streamStartTime?: Date;
}

export const LiveViewer = ({ eventId, streamUrl, streamStartTime }: LiveViewerProps) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    trackViewer();
    checkStreamStatus();
    
    const interval = setInterval(updateViewerCount, 5000);
    
    return () => {
      clearInterval(interval);
      leaveStream();
      
      // Cleanup WebRTC connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (signalChannelRef.current) {
        supabase.removeChannel(signalChannelRef.current);
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (isLive) {
      setupWebRTCViewer();
    }
  }, [isLive]);

  const trackViewer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('livestream_viewers').insert({
      event_id: eventId,
      user_id: user?.id,
      session_id: sessionId.current,
    });
  };

  const leaveStream = async () => {
    await supabase
      .from('livestream_viewers')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionId.current)
      .is('left_at', null);
  };

  const checkStreamStatus = async () => {
    const { data } = await supabase
      .from('livestream_events')
      .select('status')
      .eq('id', eventId)
      .single();
    
    setIsLive(data?.status === 'live');
  };

  const updateViewerCount = async () => {
    const { count } = await supabase
      .from('livestream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .is('left_at', null);
    
    setViewerCount(count || 0);
  };

  const setupWebRTCViewer = async () => {
    try {
      const viewerId = crypto.randomUUID();
      
      // Check for existing broadcaster offer first
      const { data: existingOffer } = await supabase
        .from('livestream_signals')
        .select('*')
        .eq('event_id', eventId)
        .eq('signal_type', 'offer')
        .eq('peer_type', 'broadcaster')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Create peer connection
      const pc = createPeerConnection({
        onTrack: (ev) => {
          console.log('Received remote stream with tracks:', ev.streams[0].getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState,
            muted: t.muted
          })));
          
          const remoteStream = ev.streams[0];
          const audioTracks = remoteStream.getAudioTracks();
          console.log('Audio tracks received:', audioTracks.length);
          
          if (audioTracks.length === 0) {
            console.error('❌ No audio track in remote stream!');
          } else {
            console.log('✅ Audio track received:', {
              label: audioTracks[0].label,
              enabled: audioTracks[0].enabled,
              readyState: audioTracks[0].readyState,
              muted: audioTracks[0].muted
            });
            
            // Force audio playback through Web Audio API for reliability
            try {
              const audioContext = new AudioContext();
              const source = audioContext.createMediaStreamSource(remoteStream);
              const gain = audioContext.createGain();
              gain.gain.value = 1.0;
              source.connect(gain).connect(audioContext.destination);
              console.log('✅ Audio routed through Web Audio API');
              
              // Resume audio context if suspended
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                  console.log('✅ AudioContext resumed');
                });
              }
            } catch (audioError) {
              console.error('Audio routing failed:', audioError);
            }
          }
          
          if (videoRef.current) {
            videoRef.current.srcObject = ev.streams[0];
            // Ensure video element is unmuted
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
          }
        }
      });
      
      peerConnectionRef.current = pc;
      
      // Handle local ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          const { error } = await supabase.from('livestream_signals').insert({
            event_id: eventId,
            peer_id: viewerId,
            peer_type: 'viewer',
            signal_type: 'ice',
            signal_data: event.candidate.toJSON() as any
          });
          if (error) console.error('Error sending ICE candidate:', error);
        }
      };
      
      // Process existing offer if available
      if (existingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(existingOffer.signal_data as any));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        const { error: answerError } = await supabase.from('livestream_signals').insert({
          event_id: eventId,
          peer_id: viewerId,
          peer_type: 'viewer',
          signal_type: 'answer',
          signal_data: answer as any
        });
        
        if (answerError) {
          console.error('Error sending answer:', answerError);
        }
        
        // Listen for ICE candidates from broadcaster
        const { data: broadcasterIce } = await supabase
          .from('livestream_signals')
          .select('*')
          .eq('event_id', eventId)
          .eq('signal_type', 'ice')
          .eq('peer_type', 'broadcaster')
          .order('created_at', { ascending: true });
        
        if (broadcasterIce) {
          for (const ice of broadcasterIce) {
            await pc.addIceCandidate(new RTCIceCandidate(ice.signal_data as any));
          }
        }
      }
      
      // Subscribe to future signals
      const channel = supabase
        .channel(`livestream-viewer-${eventId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'livestream_signals',
          filter: `event_id=eq.${eventId}`
        }, async (payload) => {
          const signal = payload.new as any;
          
          // Handle new offer from broadcaster
          if (signal.signal_type === 'offer' && 
              signal.peer_type === 'broadcaster' && 
              !peerConnectionRef.current?.currentRemoteDescription) {
            await peerConnectionRef.current?.setRemoteDescription(
              new RTCSessionDescription(signal.signal_data as any)
            );
            const answer = await peerConnectionRef.current?.createAnswer();
            await peerConnectionRef.current?.setLocalDescription(answer!);
            
            const { error: answerError } = await supabase.from('livestream_signals').insert({
              event_id: eventId,
              peer_id: viewerId,
              peer_type: 'viewer',
              signal_type: 'answer',
              signal_data: answer as any
            });
            
            if (answerError) console.error('Error sending answer:', answerError);
          }
          
          // Handle ICE candidates from broadcaster
          if (signal.signal_type === 'ice' && 
              signal.peer_type === 'broadcaster' && 
              peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(signal.signal_data as any)
            );
          }
        })
        .subscribe();
      
      signalChannelRef.current = channel;
      console.log('WebRTC viewer setup complete');
    } catch (error) {
      console.error('Error setting up WebRTC viewer:', error);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative min-h-screen overflow-y-auto">
        <div className="aspect-video bg-black">
          {isLive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white text-lg">Stream will start soon...</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Eye className="w-3 h-3" />
            {viewerCount}
          </Badge>
        </div>

        {/* Reaction Buttons */}
        {isLive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
          </div>
        )}
      </div>
    </Card>
  );
};