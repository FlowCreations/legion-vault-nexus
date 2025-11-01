import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sig } from '@/utils/signaling';

type Props = { eventId: string; turn?: { urls: string | string[]; username?: string; credential?: string } };

export function ExpandableLiveViewer({ eventId, turn }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState<string>();
  const [wsOpen, setWsOpen] = useState(sig.getState() === WebSocket.OPEN);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);
  const retriesRef = useRef(0);

  const rtcConfig = useMemo<RTCConfiguration>(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      ...(turn ? [turn] : []),
    ],
  }), [turn]);

  useEffect(() => {
    const tick = setInterval(() => setWsOpen(sig.getState() === WebSocket.OPEN), 600);
    return () => clearInterval(tick);
  }, []);

  const connect = async () => {
    setConnecting(true); setErr(undefined);

    sig.connect();
    try {
      await sig.waitForOpen(8000);
      sig.send({ type: 'join', role: 'viewer', roomId: eventId });
    } catch (e: any) {
      setErr('Signaling failed: ' + (e?.message || e)); setConnecting(false); return;
    }

    // Wait for broadcaster presence (server should emit), fallback after 2s
    try {
      await Promise.race([
        sig.once('broadcaster-present', 2000),
        (async () => { const s = await sig.once('room-state', 2000).catch(() => ({ broadcaster: true })); return s; })(),
      ]);
    } catch {}

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      pc.ontrack = async (ev) => {
        const [stream] = ev.streams;
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch {} // user gesture existed (clicked Enter)
        }
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          try { sig.send({ type: 'ice-candidate', roomId: eventId, candidate: ev.candidate.toJSON(), from: 'viewer' }); } catch {}
        }
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === 'connected') setConnecting(false);
        if (s === 'failed' || s === 'disconnected') setErr('Peer connection ' + s);
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      offerRef.current = offer;
      sig.send({ type: 'viewer-offer', roomId: eventId, sdp: offer });

      // Retry offer if no answer within 5s (max 3)
      const tryResend = async () => {
        if (!connecting) return;
        if (retriesRef.current >= 3) return;
        retriesRef.current += 1;
        try { sig.send({ type: 'viewer-offer', roomId: eventId, sdp: offerRef.current! }); } catch {}
        setTimeout(tryResend, 5000);
      };
      setTimeout(tryResend, 5000);
    } catch (e: any) {
      setErr('Offer failed: ' + (e?.message || e)); setConnecting(false);
    }
  };

  useEffect(() => {
    const onAnswer = async (msg: any) => {
      try { await pcRef.current?.setRemoteDescription(new RTCSessionDescription(msg.sdp)); }
      catch (e: any) { setErr('Apply answer failed: ' + (e?.message || e)); }
      finally { setConnecting(false); }
    };
    const onIceFromBroadcaster = async (msg: any) => {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
    };
    sig.on('broadcaster-answer', onAnswer);
    sig.on('ice-candidate', onIceFromBroadcaster);
    return () => {
      sig.off('broadcaster-answer', onAnswer);
      sig.off('ice-candidate', onIceFromBroadcaster);
      try { pcRef.current?.close(); } catch {}
      pcRef.current = null;
    };
  }, [eventId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${wsOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>Signaling: {wsOpen ? 'Connected' : 'Disconnected'}</span>
        <span className="opacity-60">Room: {eventId}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={connect} disabled={connecting} className="rounded-md border px-3 py-1.5 disabled:opacity-60">
          {connecting ? 'Connecting…' : 'Enter'}
        </button>
      </div>

      <video ref={videoRef} playsInline controls className="w-full rounded-lg border" />
      {err && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{err}</div>}
    </div>
  );
}
