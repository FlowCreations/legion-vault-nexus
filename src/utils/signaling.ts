export type SignalingMessage =
  | { type: 'join'; role: 'broadcaster' | 'viewer'; roomId: string }
  | { type: 'viewer-offer'; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'broadcaster-answer'; roomId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; roomId: string; candidate: RTCIceCandidateInit; from: 'viewer' | 'broadcaster' }
  | { type: 'pong' | 'ping' }
  | { type: 'error'; message: string }
  | Record<string, unknown>;

type Listener = (msg: any) => void;

export class SignalingClient {
  private url: string;
  private ws?: WebSocket;
  private listeners = new Map<string, Set<Listener>>();
  private log = (...args: any[]) => console.log('[SignalingClient]', ...args);

  constructor(url?: string) {
    const envUrl = (import.meta as any)?.env?.VITE_SIGNALING_URL as string | undefined;
    this.url = url ?? envUrl ?? 'wss://dlwyndcvnunvomgkbkhn.functions.supabase.co/livestream-signaling';
    this.log('Constructor url (env):', envUrl);
    this.log('Constructor url (final):', this.url);
    if (!this.url.startsWith('ws')) {
      throw new Error('SIGNALING_URL must start with ws:// or wss://');
    }
  }

  getState(): number | undefined {
    return this.ws?.readyState;
  }

  on(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  off(type: string, cb: Listener) {
    this.listeners.get(type)?.delete(cb);
  }

  private emit(type: string, payload: any) {
    this.listeners.get(type)?.forEach((cb) => cb(payload));
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.log('connect() ignored; already', this.ws.readyState);
      return;
    }
    this.log('Creating WebSocket →', this.url);
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.log('WebSocket ctor failed:', e);
      throw e;
    }

    this.ws.onopen = () => {
      this.log('OPEN');
      this.emit('open', undefined);
      
      const ping = () => {
        try {
          this.ws?.readyState === WebSocket.OPEN && this.ws?.send(JSON.stringify({ type: 'ping' }));
        } catch (_) {}
      };
      const id = setInterval(ping, 25000);
      
      this.ws!.onclose = (ev) => {
        clearInterval(id);
        this.log('CLOSE', ev.code, ev.reason);
        this.emit('close', ev);
      };
    };

    this.ws.onmessage = (ev) => {
      let data: any;
      try {
        data = JSON.parse(ev.data);
      } catch {
        this.log('Non-JSON message ignored:', ev.data);
        return;
      }
      this.log('<=', data);
      if (data?.type) this.emit(data.type, data);
      this.emit('*', data);
    };

    this.ws.onerror = (ev) => {
      this.log('ERROR', ev);
      this.emit('error', ev);
    };
  }

  async waitForOpen(timeoutMs = 5000): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    return new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onClose = (ev: CloseEvent) => {
        cleanup();
        reject(new Error(`WebSocket closed (${ev.code}) before open`));
      };
      const onErr = (err: Event) => {
        cleanup();
        reject(new Error(`WebSocket error before open: ${String(err)}`));
      };
      const cleanup = () => {
        clearTimeout(timer);
        this.off('open', onOpen);
        this.off('close', onClose as any);
        this.off('error', onErr as any);
      };
      this.on('open', onOpen);
      this.on('close', onClose as any);
      this.on('error', onErr as any);

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('WebSocket connection timeout'));
      }, timeoutMs);
    });
  }

  send(msg: SignalingMessage) {
    const ready = this.ws?.readyState;
    if (ready !== WebSocket.OPEN) {
      throw new Error(`WebSocket not open (state=${ready}). Tried to send: ${msg?.['type']}`);
    }
    this.log('=>', msg);
    this.ws!.send(JSON.stringify(msg));
  }

  close(code?: number, reason?: string) {
    if (!this.ws) return;
    try {
      this.ws.close(code, reason);
    } catch (_) {}
  }
}

export const sig = new SignalingClient();
