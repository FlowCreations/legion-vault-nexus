import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sig } from '@/utils/signaling';

type ViewerProps = { eventId: string; iceServers?: RTCIceServer[] };

export default function ExpandableLiveViewer({ eventId, iceServers }: ViewerProps) {
  console.log('[ExpandableLiveViewer] render eventId=', eventId);

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sigState, setSigState] = useState(sig.getState());

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const rtcConfig = useMemo<RTCConfiguration>(
    () => ({ iceServers: iceServers ?? [{ urls: 'stun:stun.l.google.com:19302' }] }),
    [iceServers]
  );

  useEffect(() => {
    const id = setInterval(() => setSigState(sig.getState()), 500);
    return () => clearInterval(id);
  }, []);

  const connect = async () => {
    setConnecting(true);
    setError(undefined);

    sig.connect();
    try {
      await sig.waitForOpen(8000);
    } catch (e: any) {
      console.error('[Viewer] signaling open failed', e);
      const d = sig.getDiagnostics();
      setError(`Signaling failed: ${e?.message || e}. url=${d.url} state=${d.state} close=${d.lastClose?.code || ''}:${d.lastClose?.reason || ''}`);
      setConnecting(false);
      return;
    }

    try {
      sig.send({ type: 'join', role: 'viewer', roomId: eventId });
    } catch (e: any) {
      setError(e.message ?? 'Failed to join room');
      setConnecting(false);
      return;
    }

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          try {
            sig.send({
              type: 'ice-candidate',
              roomId: eventId,
              candidate: ev.candidate.toJSON(),
              from: 'viewer',
            });
          } catch (_) {}
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sig.send({ type: 'viewer-offer', roomId: eventId, sdp: offer });
    } catch (e) {
      console.error('[Viewer] offer flow failed', e);
      setError('Failed to start viewer connection');
      setConnecting(false);
      return;
    }
  };

  useEffect(() => {
    const onAnswer = async (msg: any) => {
      console.log('[Viewer] broadcaster-answer', msg);
      try {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      } catch (e) {
        console.error('[Viewer] setRemoteDescription failed', e);
        setError('Failed applying broadcaster answer');
      } finally {
        setConnecting(false);
      }
    };

    const onIceFromBroadcaster = async (msg: any) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.warn('[Viewer] addIceCandidate broadcaster failed', e);
      }
    };

    sig.on('broadcaster-answer', onAnswer);
    sig.on('ice-candidate', onIceFromBroadcaster);

    return () => {
      sig.off('broadcaster-answer', onAnswer);
      sig.off('ice-candidate', onIceFromBroadcaster);
      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;
    };
  }, [eventId, rtcConfig]);

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

        <div className="flex gap-2">
          <Button
            onClick={connect}
            disabled={connecting}
            className="rounded-md border px-3 py-1.5 disabled:opacity-60"
          >
            {connecting ? 'Connecting…' : 'Enter'}
          </Button>
        </div>

        <video ref={videoRef} playsInline controls className="w-full rounded-lg border" />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
