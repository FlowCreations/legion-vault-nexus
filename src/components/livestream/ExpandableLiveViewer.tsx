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

  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.muted = isMuted;
    }
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
    const { data } = await supabase
      .from("livestream_events")
      .select("status")
      .eq("id", eventId)
      .single();

    if (data?.status === "live") {
      setIsLive(true);
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
    const viewerId = crypto.randomUUID();

    const { data: existingSignals } = await supabase
      .from("livestream_signals")
      .select("*")
      .eq("event_id", eventId)
      .eq("peer_type", "broadcaster")
      .order("created_at", { ascending: false });

    if (existingSignals && existingSignals.length > 0) {
      const offerSignal = existingSignals.find((s) => s.signal_type === "offer");
      const iceSignals = existingSignals.filter((s) => s.signal_type === "ice");

      if (offerSignal) {
        const pc = createPeerConnection((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
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

        await pc.setRemoteDescription(new RTCSessionDescription(offerSignal.signal_data as any));

        for (const iceSignal of iceSignals) {
          if (iceSignal.signal_data) {
            await pc.addIceCandidate(new RTCIceCandidate(iceSignal.signal_data as any));
          }
        }

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
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
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
    <div className={`relative ${isExpanded ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4" : ""}`}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full flex flex-col lg:flex-row gap-4"
          >
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 bg-black border-primary/20">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="relative flex-1 bg-black group">
                    {!isLive ? (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <p className="text-lg">Stream will start soon...</p>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setIsExpanded(false)}
                      />
                    )}
                    {isLive && (
                      <div className="absolute top-4 left-4 flex items-center gap-3">
                        <Badge className="bg-red-600 text-white animate-pulse">
                          🔴 LIVE
                        </Badge>
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                          <Eye className="w-3 h-3 mr-1" />
                          {viewerCount}
                        </Badge>
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={() => setIsExpanded(false)}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-4 bg-card flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsMuted(!isMuted)}
                          onMouseEnter={() => setShowVolumeSlider(true)}
                          onMouseLeave={() => setShowVolumeSlider(false)}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        {showVolumeSlider && !isMuted && (
                          <div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover border rounded-lg shadow-lg"
                            onMouseEnter={() => setShowVolumeSlider(true)}
                            onMouseLeave={() => setShowVolumeSlider(false)}
                          >
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={(e) => setVolume(parseInt(e.target.value))}
                              className="h-24 w-2 appearance-none bg-muted rounded-full [writing-mode:vertical-lr] [direction:rtl] cursor-pointer"
                              style={{
                                background: `linear-gradient(to top, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume}%, hsl(var(--muted)) ${volume}%, hsl(var(--muted)) 100%)`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>

                      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Tip
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:w-96 flex flex-col">
              <LiveChat eventId={eventId} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-black border-primary/20 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black group cursor-pointer" onClick={() => setIsExpanded(true)}>
                  {!isLive ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <p>Stream will start soon...</p>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
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
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
