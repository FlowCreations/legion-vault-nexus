import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createPeerConnection } from "@/utils/webrtcHelper";
import { Volume2, VolumeX, Share2, DollarSign, Maximize2, Minimize2, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LiveChat } from "./LiveChat";

interface ExpandableLiveViewerProps {
  eventId: string;
  streamUrl?: string;
}

export default function ExpandableLiveViewer({ eventId }: ExpandableLiveViewerProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("livestream_volume");
    return saved ? parseInt(saved) : 80;
  });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [tipAmount, setTipAmount] = useState("5");
  const [tipMessage, setTipMessage] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [showTipDialog, setShowTipDialog] = useState(false);

  const collapsedVideoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    trackViewer();
    checkStreamStatus();
    const interval = setInterval(updateViewerCount, 5000);

    return () => {
      clearInterval(interval);
      leaveStream();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (isLive) {
      setupWebRTCViewer();
    }
  }, [isLive]);

  useEffect(() => {
    [collapsedVideoRef, expandedVideoRef].forEach(ref => {
      if (ref.current) {
        ref.current.volume = isMuted ? 0 : volume / 100;
        ref.current.muted = isMuted;
      }
    });
  }, [volume, isMuted]);

  useEffect(() => {
    localStorage.setItem("livestream_volume", volume.toString());
  }, [volume]);

  const trackViewer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("livestream_viewers").insert({
      event_id: eventId,
      user_id: user?.id,
      session_id: sessionIdRef.current,
    });
  };

  const leaveStream = async () => {
    await supabase
      .from("livestream_viewers")
      .update({ left_at: new Date().toISOString() })
      .eq("session_id", sessionIdRef.current)
      .is("left_at", null);
  };

  const checkStreamStatus = async () => {
    console.log('[ExpandableLiveViewer] Checking stream status for event:', eventId);
    const { data, error } = await supabase
      .from("livestream_events")
      .select("status")
      .eq("id", eventId)
      .single();

    console.log('[ExpandableLiveViewer] Stream status result:', { data, error });

    if (data?.status === "live") {
      console.log('[ExpandableLiveViewer] Stream is LIVE, setting isLive to true');
      setIsLive(true);
    } else {
      console.log('[ExpandableLiveViewer] Stream is NOT live, status:', data?.status);
    }
  };

  const updateViewerCount = async () => {
    const { count } = await supabase
      .from("livestream_viewers")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .is("left_at", null);

    setViewerCount(count || 0);
  };

  const setupWebRTCViewer = async () => {
    console.log('[ExpandableLiveViewer] Setting up WebRTC viewer for event:', eventId);
    const viewerId = crypto.randomUUID();

    const { data: existingSignals, error: signalsError } = await supabase
      .from("livestream_signals")
      .select("*")
      .eq("event_id", eventId)
      .eq("peer_type", "broadcaster")
      .order("created_at", { ascending: false });

    console.log('[ExpandableLiveViewer] Existing signals:', { existingSignals, signalsError });

    if (existingSignals && existingSignals.length > 0) {
      const offerSignal = existingSignals.find((s) => s.signal_type === "offer");
      const iceSignals = existingSignals.filter((s) => s.signal_type === "ice");

      console.log('[ExpandableLiveViewer] Found offer signal:', !!offerSignal, 'ICE signals:', iceSignals.length);

      if (offerSignal) {
        console.log('[ExpandableLiveViewer] Creating peer connection...');
        const pc = createPeerConnection((stream) => {
          console.log('[ExpandableLiveViewer] Received remote stream, tracks:', stream.getTracks().length);
          stream.getTracks().forEach(track => {
            console.log('[ExpandableLiveViewer] Track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
          });
          
          // Attach stream to BOTH video elements
          if (collapsedVideoRef.current) {
            console.log('[ExpandableLiveViewer] Setting collapsed video srcObject');
            collapsedVideoRef.current.srcObject = stream;
            collapsedVideoRef.current.play().catch(e => console.error('Collapsed video play error:', e));
          }
          
          if (expandedVideoRef.current) {
            console.log('[ExpandableLiveViewer] Setting expanded video srcObject');
            expandedVideoRef.current.srcObject = stream;
            expandedVideoRef.current.play().catch(e => console.error('Expanded video play error:', e));
          }
        });

        peerConnectionRef.current = pc;

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            console.log('[ExpandableLiveViewer] Sending ICE candidate');
            await supabase.from("livestream_signals").insert({
              event_id: eventId,
              peer_id: viewerId,
              peer_type: "viewer",
              signal_type: "ice",
              signal_data: event.candidate.toJSON() as any,
            });
          }
        };
        
        // Monitor connection state
        pc.onconnectionstatechange = () => {
          console.log('[ExpandableLiveViewer] Connection state:', pc.connectionState);
        };
        
        pc.oniceconnectionstatechange = () => {
          console.log('[ExpandableLiveViewer] ICE connection state:', pc.iceConnectionState);
        };

        console.log('[ExpandableLiveViewer] Setting remote description...');
        await pc.setRemoteDescription(new RTCSessionDescription(offerSignal.signal_data as any));

        console.log('[ExpandableLiveViewer] Adding ICE candidates...');
        for (const iceSignal of iceSignals) {
          if (iceSignal.signal_data) {
            await pc.addIceCandidate(new RTCIceCandidate(iceSignal.signal_data as any));
          }
        }

        console.log('[ExpandableLiveViewer] Creating answer...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('[ExpandableLiveViewer] Sending answer signal...');
        await supabase.from("livestream_signals").insert({
          event_id: eventId,
          peer_id: viewerId,
          peer_type: "viewer",
          signal_type: "answer",
          signal_data: answer as any,
        });

        console.log('[ExpandableLiveViewer] WebRTC setup complete!');
      } else {
        console.log('[ExpandableLiveViewer] No offer signal found from broadcaster');
      }
    } else {
      console.log('[ExpandableLiveViewer] No signals found from broadcaster yet');
    }

    const channel = supabase
      .channel(`livestream-viewer-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_signals",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const signal = payload.new;

          if (signal.signal_type === "offer" && signal.peer_type === "broadcaster") {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
            }

            const pc = createPeerConnection((stream) => {
              if (collapsedVideoRef.current) {
                collapsedVideoRef.current.srcObject = stream;
                collapsedVideoRef.current.play().catch(e => console.error('Collapsed video play error:', e));
              }
              if (expandedVideoRef.current) {
                expandedVideoRef.current.srcObject = stream;
                expandedVideoRef.current.play().catch(e => console.error('Expanded video play error:', e));
              }
            });

            peerConnectionRef.current = pc;

            pc.onicecandidate = async (event) => {
              if (event.candidate) {
                await supabase.from("livestream_signals").insert({
                  event_id: eventId,
                  peer_id: viewerId,
                  peer_type: "viewer",
                  signal_type: "ice",
                  signal_data: event.candidate.toJSON() as any,
                });
              }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as any));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await supabase.from("livestream_signals").insert({
              event_id: eventId,
              peer_id: viewerId,
              peer_type: "viewer",
              signal_type: "answer",
              signal_data: answer as any,
            });
          }

          if (
            signal.signal_type === "ice" &&
            signal.peer_type === "broadcaster" &&
            peerConnectionRef.current
          ) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(signal.signal_data as any)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/live?event=${eventId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Live Stream",
          text: "Join me watching this live stream!",
          url: url,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleTip = async () => {
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Minimum tip is $1.00");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-tip-payment", {
        body: {
          amount: Math.round(amount * 100),
          eventId,
          message: tipMessage,
          tipperName: tipperName || "Anonymous",
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        setShowTipDialog(false);
        toast.success("Opening payment page...");
      }
    } catch (error) {
      console.error("Tip error:", error);
      toast.error("Failed to process tip");
    }
  };

  return (
    <>
      {isExpanded ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 bg-background flex flex-col lg:flex-row gap-4 p-4"
        >
          <div className="flex-1 flex flex-col min-h-0">
            <Card className="flex-1 bg-black border-primary/20 flex flex-col min-h-0">
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {/* This old expanded view is now replaced by the new full-screen layout above */}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        <Card className="bg-black border-primary/20 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black group cursor-pointer" onClick={() => setIsExpanded(true)}>
              {!isLive ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <p>Stream will start soon...</p>
                </div>
              ) : (
                <video
                  ref={collapsedVideoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
              )}
              {isLive && (
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge className="bg-red-600 text-white animate-pulse">
                    🔴 LIVE
                  </Badge>
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    <Eye className="w-3 h-3 mr-1" />
                    {viewerCount}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3 bg-card flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send a Tip</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {[5, 10, 25].map((amount) => (
                          <Button
                            key={amount}
                            variant={tipAmount === amount.toString() ? "default" : "outline"}
                            onClick={() => setTipAmount(amount.toString())}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm font-medium">Custom Amount ($)</label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Your Name (Optional)</label>
                        <Input
                          value={tipperName}
                          onChange={(e) => setTipperName(e.target.value)}
                          placeholder="Anonymous"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message (Optional)</label>
                        <Textarea
                          value={tipMessage}
                          onChange={(e) => setTipMessage(e.target.value)}
                          placeholder="Say something nice..."
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleTip} className="w-full">
                        Send ${parseFloat(tipAmount || "0").toFixed(2)} Tip
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" onClick={() => setIsExpanded(true)}>
                  Enter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
