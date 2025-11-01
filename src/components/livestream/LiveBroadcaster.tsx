import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sig } from '@/utils/signaling';

type DeviceInfo = { deviceId: string; label: string };
type Props = { eventId: string; turn?: { urls: string | string[]; username?: string; credential?: string } };

export const LiveBroadcaster = ({ eventId, turn }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cams, setCams] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [camId, setCamId] = useState<string>('');
  const [micId, setMicId] = useState<string>('');
  const [state, setState] = useState<'idle' | 'preview' | 'waiting' | 'live' | 'error'>('idle');
  const [err, setErr] = useState<string>();
  const [wsOpen, setWsOpen] = useState(false);

  const rtcConfig = useMemo<RTCConfiguration>(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      ...(turn ? [turn] : []),
    ],
  }), [turn]);

  // --- Helpers -------------------------------------------------------
  async function ensureLocalStream() {
    if (streamRef.current) return streamRef.current;
    try {
      // First permission to unlock labels (why: labels hidden pre-permission)
      if (!camId || !micId) {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tmp.getTracks().forEach(t => t.stop());
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = media;
      if (videoRef.current) { videoRef.current.srcObject = media; await videoRef.current.play().catch(() => {}); }
      setState(prev => (prev === 'idle' ? 'preview' : prev));
      setErr(undefined);
      return media;
    } catch (e: any) {
      setErr(e?.message || 'Failed to access camera/mic');
      setState('error');
      throw e;
    }
  }

  function stopLocal() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // --- WS + Devices --------------------------------------------------
  useEffect(() => {
    let mounted = true;

    sig.connect();
    (async () => {
      try {
        await sig.waitForOpen(8000);
        setWsOpen(true);
        sig.send({ type: 'join', role: 'broadcaster', roomId: eventId });
      } catch (e: any) {
        setErr(`Signaling failed: ${e?.message || e}`); setState('error'); return;
      }
      // Enumerate devices after permission to get labels
      try {
        const perm = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        perm.getTracks().forEach(t => t.stop());
      } catch {}
      const list = await navigator.mediaDevices.enumerateDevices();
      const cs = list.filter(d => d.kind === 'videoinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Camera' }));
      const ms = list.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
      if (!mounted) return;
      setCams(cs); setMics(ms);
      if (!camId && cs[0]) setCamId(cs[0].deviceId);
      if (!micId && ms[0]) setMicId(ms[0].deviceId);
    })();

    // handle viewer offer
    const onViewerOffer = async (msg: any) => {
      try {
        // Ensure media exists BEFORE answering (why: avoid empty answer)
        await ensureLocalStream();

        if (!pcRef.current) {
          pcRef.current = new RTCPeerConnection(rtcConfig);
          pcRef.current.onicecandidate = (ev) => {
            if (ev.candidate) {
              try { sig.send({ type: 'ice-candidate', roomId: eventId, candidate: ev.candidate.toJSON(), from: 'broadcaster' }); } catch {}
            }
          };
          // Attach tracks once
          streamRef.current!.getTracks().forEach(t => pcRef.current!.addTrack(t, streamRef.current!));
          pcRef.current.onconnectionstatechange = () => {
            const s = pcRef.current?.connectionState;
            if (s === 'connected') setState('live');
          };
        }
        const pc = pcRef.current!;
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sig.send({ type: 'broadcaster-answer', roomId: eventId, sdp: answer });
      } catch (e: any) {
        setErr(`Answer failed: ${e?.message || e}`);
      }
    };
    const onIceFromViewer = async (msg: any) => {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
    };

    sig.on('viewer-offer', onViewerOffer);
    sig.on('ice-candidate', onIceFromViewer);

    const wsTick = setInterval(() => setWsOpen(sig.getState() === WebSocket.OPEN), 600);

    return () => {
      mounted = false;
      clearInterval(wsTick);
      sig.off('viewer-offer', onViewerOffer);
      sig.off('ice-candidate', onIceFromViewer);
      try { pcRef.current?.close(); } catch {}
      pcRef.current = null;
      stopLocal();
    };
  }, [eventId, rtcConfig, camId, micId]);

  // --- UI actions ----------------------------------------------------
  async function startPreview() { await ensureLocalStream(); setState('preview'); }
  async function startStream() { await ensureLocalStream(); setState('waiting'); }
  function endStream() { setState('idle'); try { pcRef.current?.close(); } catch {}; pcRef.current = null; stopLocal(); }

  // --- Render --------------------------------------------------------
  const connected = wsOpen;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>Signaling: {connected ? 'Connected' : 'Disconnected'}</span>
        <span className="opacity-60">Room: {eventId}</span>
      </div>

      <video ref={videoRef} muted playsInline className="w-full rounded-lg border" />

      {/* Device selectors */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm">Camera</label>
          <select className="mt-1 w-full rounded-md border p-2" value={camId} onChange={e => setCamId(e.target.value)}>
            {cams.length === 0 ? <option value="">No cameras</option> :
              cams.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm">Microphone</label>
          <select className="mt-1 w-full rounded-md border p-2" value={micId} onChange={e => setMicId(e.target.value)}>
            {mics.length === 0 ? <option value="">No microphones</option> :
              mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Controls */}
      {state === 'idle' && (
        <div className="flex gap-2">
          <button onClick={startPreview} className="rounded-md border px-3 py-2">Start Preview</button>
          <button onClick={startStream} className="rounded-md border px-3 py-2">Start Stream</button>
        </div>
      )}
      {state === 'preview' && (
        <div className="flex gap-2">
          <button onClick={startStream} className="rounded-md border px-3 py-2">Go Live (Waiting)</button>
          <button onClick={endStream} className="rounded-md border px-3 py-2">Stop</button>
        </div>
      )}
      {state === 'waiting' && (
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" /> Waiting for viewers…</div>
          <button onClick={endStream} className="rounded-md border px-3 py-1.5">End Stream</button>
        </div>
      )}
      {state === 'live' && (
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE</div>
          <button onClick={endStream} className="rounded-md border px-3 py-1.5">End Stream</button>
        </div>
      )}

      {err && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{err}</div>}
    </div>
  );
};
