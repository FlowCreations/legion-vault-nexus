import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Volume2, VolumeX, Maximize2, Minimize2, Share2, DollarSign, X } from 'lucide-react';
import { SignalingClient, SignalMessage } from '@/utils/signaling';
import { createPeerConnection, createICEQueue, addOrQueueCandidate, flushICEQueue, safePlay } from '@/utils/webrtcHelper';
import { supabase } from '@/integrations/supabase/client';

type ViewerProps = { eventId: string; streamUrl?: string };

export default function ExpandableLiveViewer({ eventId }: ViewerProps) {
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const [sig] = useState(() => new SignalingClient());
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [connState, setConnState] = useState<RTCPeerConnectionState | undefined>();
  const iceQ = useRef(createICEQueue());
  
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => { 
    sig.connect();
    checkStreamStatus();
    trackViewer();
    const interval = setInterval(updateViewerCount, 5000);
    
    return () => {
      sig.close();
      clearInterval(interval);
      leaveStream();
    };
  }, []);

  async function checkStreamStatus() {
    const { data } = await supabase
      .from('livestream_events')
      .select('status')
      .eq('id', eventId)
      .single();
    setIsLive(data?.status === 'live');
  }

  async function trackViewer() {
    await supabase.from('livestream_viewers').insert({
      event_id: eventId,
      session_id: sessionIdRef.current
    });
  }

  async function leaveStream() {
    await supabase
      .from('livestream_viewers')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionIdRef.current)
      .is('left_at', null);
  }

  async function updateViewerCount() {
    const { count } = await supabase
      .from('livestream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .is('left_at', null);
    setViewerCount(count || 0);
  }

  async function connect() {
    setConnecting(true);
    setError(undefined);
    
    // CRITICAL: Send join message FIRST, before creating offer
    sig.send({ type: 'join', role: 'viewer', roomId: eventId });
    
    // Give the signaling server a moment to register us
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const newPc = createPeerConnection({
        onTrack: async (ev) => {
          console.log('[ExpandableLiveViewer] Received remote stream');
          if (vidRef.current) {
            vidRef.current.srcObject = ev.streams[0];
            vidRef.current.muted = isMuted;
            await safePlay(vidRef.current);
          }
        },
        onConnState: (s) => {
          console.log('[ExpandableLiveViewer] Connection state:', s);
          setConnState(s);
        }
      });
      
      newPc.onicecandidate = (ev) => {
        if (ev.candidate) sig.send({ type: 'ice', role: 'viewer', roomId: eventId, payload: ev.candidate });
      };
      
      setPc(newPc);

      const offer = await newPc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await newPc.setLocalDescription(offer);
      sig.send({ type: 'viewer-offer', role: 'viewer', roomId: eventId, payload: offer });
    } catch (e: any) {
      setError(e?.message || 'Failed to start connection');
      setConnecting(false);
    }
  }

  // Handle signaling messages
  useEffect(() => {
    const handler = async (msg: SignalMessage) => {
      if (msg.roomId !== eventId) return;
      if (!pc) return;

      if (msg.type === 'broadcaster-answer') {
        console.log('[ExpandableLiveViewer] Received broadcaster answer');
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        await flushICEQueue(pc, iceQ.current);
        setConnecting(false);
      }
      if (msg.type === 'ice' && msg.role === 'broadcaster' && msg.payload) {
        try {
          await addOrQueueCandidate(pc, iceQ.current, msg.payload);
        } catch (e) {
          console.error('[ExpandableLiveViewer] Failed to add ICE candidate:', e);
        }
      }
      if (msg.type === 'end') {
        teardown();
      }
    };
    sig.onMessage(handler);
  }, [pc, eventId]);

  function teardown() {
    try {
      pc?.close();
    } catch (e) {
      console.error('Error closing peer connection:', e);
    }
    setPc(null);
    setConnState(undefined);
  }

  // Reconnect logic on failure
  useEffect(() => {
    if (connState === 'failed' || connState === 'disconnected') {
      console.log('[ExpandableLiveViewer] Attempting to reconnect...');
      setTimeout(() => connect(), 800);
    }
  }, [connState]);

  useEffect(() => {
    if (vidRef.current) {
      vidRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (vidRef.current) {
      vidRef.current.muted = isMuted;
    }
  }, [isMuted]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'Live Stream', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  async function handleTip() {
    if (!tipAmount) return;
    const { data, error } = await supabase.functions.invoke('create-tip-payment', {
      body: { amount: parseFloat(tipAmount), eventId }
    });
    if (error) {
      console.error('Tip error:', error);
      return;
    }
    if (data?.url) {
      window.open(data.url, '_blank');
    }
    setShowTipDialog(false);
    setTipAmount('');
  }

  if (!isLive && !pc) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto bg-muted rounded-full flex items-center justify-center">
            <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
          </div>
          <p className="text-muted-foreground">Stream will start soon...</p>
          <Button onClick={checkStreamStatus} variant="outline">Check Status</Button>
        </div>
      </Card>
    );
  }

  const content = (
    <div className={`relative ${isExpanded ? 'h-screen' : 'aspect-video'} bg-black`}>
      <video
        ref={vidRef}
        className="w-full h-full object-contain"
        muted={isMuted}
        playsInline
        autoPlay
      />

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            {!isMuted && (
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-24"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowTipDialog(true)}>
              <DollarSign className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="bg-destructive px-3 py-1 rounded-full flex items-center gap-2">
          <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white">LIVE</span>
        </div>
        <div className="bg-black/60 px-3 py-1 rounded-full text-xs text-white">
          {viewerCount} watching
        </div>
        {connState && (
          <div className="bg-black/60 px-3 py-1 rounded-full text-xs text-white">
            {connState}
          </div>
        )}
      </div>

      {/* Connection controls */}
      {!pc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Button onClick={connect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Enter Stream'}
          </Button>
        </div>
      )}
      
      {pc && (
        <div className="absolute top-4 right-4">
          <Button variant="destructive" size="sm" onClick={teardown}>
            Leave
          </Button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-20 left-4 right-4 bg-destructive/90 text-white p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isExpanded ? (
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-full h-screen p-0 m-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Card className="w-full overflow-hidden">{content}</Card>
      )}

      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Tip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Amount ($)"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
            />
            <Button onClick={handleTip} className="w-full">Send Tip</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
