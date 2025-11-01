export type SignalingMessage =
  | { type: 'join'; role: 'broadcaster' | 'viewer'; roomId: string }
  | { type: 'viewer-offer'; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'broadcaster-answer'; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; roomId: string; candidate: RTCIceCandidateInit; from: 'viewer' | 'broadcaster' }
  | { type: 'ping' | 'pong' | 'room-state' | 'broadcaster-present' | 'broadcaster-left'; [k: string]: any };

type Listener = (m: any) => void;

class SignalingClient {
  private url: string;
  private ws?: WebSocket;
  private listeners = new Map<string, Set<Listener>>();
  private lastClose?: { code: number; reason: string };

  constructor(url?: string) {
    const env = (import.meta as any)?.env?.VITE_SIGNALING_URL as string | undefined;
    this.url = url ?? env ?? 'wss://dlwyndcvnunvomgkbkhn.functions.supabase.co/livestream-signaling';
    if (!this.url.startsWith('ws')) throw new Error('SIGNALING_URL must start with ws(s)://');
    console.log('[SignalingClient] URL=', this.url);
  }

  getState() { return this.ws?.readyState; }
  getDiagnostics() { return { url: this.url, state: this.getState() ?? -1, lastClose: this.lastClose }; }

  on(t: string, cb: Listener) { if (!this.listeners.has(t)) this.listeners.set(t, new Set()); this.listeners.get(t)!.add(cb); }
  off(t: string, cb: Listener) { this.listeners.get(t)?.delete(cb); }
  once(t: string, timeoutMs = 2000): Promise<any> {
    return new Promise((res, rej) => {
      const cb = (p: any) => { clearTimeout(to); this.off(t, cb); res(p); };
      const to = setTimeout(() => { this.off(t, cb); rej(new Error('timeout ' + t)); }, timeoutMs);
      this.on(t, cb);
    });
  }
  private emit(t: string, p: any) { this.listeners.get(t)?.forEach((f) => f(p)); }

  connect() {
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { console.log('[WS] OPEN'); this.emit('open', undefined); };
    this.ws.onmessage = (ev) => { try { const d = JSON.parse(ev.data); d?.type && this.emit(d.type, d); this.emit('*', d); } catch {} };
    this.ws.onerror = (e) => { console.warn('[WS] ERROR', e); this.emit('error', e); };
    this.ws.onclose = (ev) => { this.lastClose = { code: ev.code, reason: ev.reason ?? '' }; console.log('[WS] CLOSE', ev.code, ev.reason); this.emit('close', ev); };
  }

  async waitForOpen(ms = 6000) {
    if (this.ws?.readyState === 1) return;
    return new Promise<void>((resolve, reject) => {
      const onOpen = () => { cleanup(); resolve(); };
      const onClose = (e: CloseEvent) => { cleanup(); reject(new Error('closed ' + e.code)); };
      const onErr = (e: Event) => { cleanup(); reject(new Error('error ' + String(e))); };
      const cleanup = () => { clearTimeout(t); this.off('open', onOpen); this.off('close', onClose as any); this.off('error', onErr as any); };
      this.on('open', onOpen); this.on('close', onClose as any); this.on('error', onErr as any);
      const t = setTimeout(() => { cleanup(); reject(new Error('open timeout')); }, ms);
    });
  }

  send(msg: SignalingMessage) {
    if (this.ws?.readyState !== 1) throw new Error('WS not open');
    this.ws!.send(JSON.stringify(msg));
  }
  close() { try { this.ws?.close(); } catch {} }
}

export const sig = new SignalingClient();
