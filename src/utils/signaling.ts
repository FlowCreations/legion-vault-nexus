export type SignalMessage = {
  type: string;
  roomId: string;
  role: 'broadcaster' | 'viewer';
  payload?: any;
};

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: ((msg: SignalMessage) => void)[] = [];

  constructor(url = import.meta.env.VITE_SIGNALING_URL || 'wss://dlwyndcvnunvomgkbkhn.supabase.co/functions/v1/livestream-signaling') {
    if (!url) throw new Error('SIGNALING_URL not configured');
    this.url = url;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (ev) => {
      try { const msg = JSON.parse(ev.data); this.listeners.forEach(l => l(msg)); } catch {}
    };
  }

  onMessage(cb: (msg: SignalMessage) => void) { this.listeners.push(cb); }

  send(msg: SignalMessage) {
    const data = JSON.stringify(msg);
    const trySend = () => {
      if (!this.ws) return;
      if (this.ws.readyState === WebSocket.OPEN) this.ws.send(data);
      else setTimeout(trySend, 50);
    };
    trySend();
  }

  close() { try { this.ws?.close(); } catch {} }
}
