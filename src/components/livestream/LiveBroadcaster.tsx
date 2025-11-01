import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { sig } from '@/utils/signaling';

type Props = { eventId: string; iceServers?: RTCIceServer[] };

export const LiveBroadcaster = ({ eventId, iceServers }: Props) => {
  console.log('[LiveBroadcaster] render eventId=', eventId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sigState, setSigState] = useState(sig.getState());
  const [error, setError] = useState<string | undefined>();

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
      console.log('[LiveBroadcaster] useEffect enter, eventId', eventId);
      setError(undefined);

      sig.connect();
      try {
        await sig.waitForOpen(7000);
      } catch (e: any) {
        console.error('[LiveBroadcaster] signaling open failed', e);
        setError('Failed to connect to signaling server');
        return;
      }

      try {
        sig.send({ type: 'join', role: 'broadcaster', roomId: eventId });
      } catch (e: any) {
        setError(e.message ?? 'Failed to join room');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error('[LiveBroadcaster] getUserMedia failed', e);
        setError('Camera/Mic permission denied or unavailable');
      }
    };

    boot();

    const onViewerOffer = async (msg: any) => {
      console.log('[LiveBroadcaster] viewer-offer', msg);
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
              } catch (_) {}
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
      console.log('[LiveBroadcaster] unmount');
      sig.off('viewer-offer', onViewerOffer);
      sig.off('ice-candidate', onIceFromViewer);
      try {
        pcRef.current?.getSenders().forEach((s) => {
          try {
            s.track?.stop();
          } catch {}
        });
        pcRef.current?.close();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      pcRef.current = null;
    };
  }, [eventId, rtcConfig]);

  const connected = sigState === WebSocket.OPEN;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Signaling: {connected ? 'Connected' : 'Disconnected'}</span>
          <span className="opacity-60">Room: {eventId}</span>
        </div>

        <video ref={videoRef} muted playsInline className="w-full rounded-lg border" />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
};
