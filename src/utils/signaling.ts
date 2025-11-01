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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(url = import.meta.env.VITE_SIGNALING_URL || 'wss://dlwyndcvnunvomgkbkhn.functions.supabase.co/livestream-signaling') {
    if (!url) throw new Error('SIGNALING_URL not configured');
    this.url = url;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    
    console.log('[SignalingClient] Connecting to:', this.url);
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('[SignalingClient] WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (ev) => {
      try { 
        const msg = JSON.parse(ev.data);
        console.log('[SignalingClient] Received:', msg.type, msg.role);
        this.listeners.forEach(l => l(msg));
      } catch (e) {
        console.error('[SignalingClient] Failed to parse message:', e);
      }
    };
    
    this.ws.onerror = (err) => {
      console.error('[SignalingClient] WebSocket error:', err);
    };
    
    this.ws.onclose = () => {
      console.log('[SignalingClient] WebSocket closed');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        console.log(`[SignalingClient] Reconnecting in ${delay}ms...`);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      }
    };
  }

  onMessage(cb: (msg: SignalMessage) => void) { 
    this.listeners.push(cb); 
  }

  send(msg: SignalMessage) {
    const data = JSON.stringify(msg);
    console.log('[SignalingClient] Sending:', msg.type, msg.role);
    
    const trySend = () => {
      if (!this.ws) {
        console.error('[SignalingClient] WebSocket not initialized');
        return;
      }
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      } else {
        console.log('[SignalingClient] Waiting for connection... state:', this.ws.readyState);
        setTimeout(trySend, 50);
      }
    };
    trySend();
  }

  close() { 
    console.log('[SignalingClient] Closing connection');
    try { 
      this.ws?.close(); 
    } catch (e) {
      console.error('[SignalingClient] Error closing:', e);
    }
  }
  
  getState(): number | undefined {
    return this.ws?.readyState;
  }
}
