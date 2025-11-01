// WebRTC configuration and helper functions for live streaming

// ICE servers configuration (STUN servers for NAT traversal)
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export type ICEQueue = { pending: RTCIceCandidateInit[]; ready: boolean };

export function createPeerConnection(opts?: { onTrack?: (ev: RTCTrackEvent) => void, onConnState?: (s: RTCPeerConnectionState) => void }) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      // { urls: 'turn:YOUR_TURN:3478', username: 'user', credential: 'pass' }
    ],
  });
  if (opts?.onTrack) pc.ontrack = opts.onTrack;
  if (opts?.onConnState) pc.onconnectionstatechange = () => opts.onConnState!(pc.connectionState);
  return pc;
}

export function createICEQueue(): ICEQueue { return { pending: [], ready: false }; }

export async function addOrQueueCandidate(pc: RTCPeerConnection, q: ICEQueue, cand: RTCIceCandidateInit) {
  if (!q.ready) q.pending.push(cand); else await pc.addIceCandidate(cand);
}

export async function flushICEQueue(pc: RTCPeerConnection, q: ICEQueue) {
  q.ready = true;
  for (const c of q.pending) { try { await pc.addIceCandidate(c); } catch {} }
  q.pending = [];
}

export async function safePlay(el: HTMLVideoElement) {
  el.muted = true; el.playsInline = true; el.autoplay = true;
  try { await el.play(); } catch (e) { /* surface via UI if needed */ }
}

// Add media stream tracks to peer connection
export const addStreamToPeer = (pc: RTCPeerConnection, stream: MediaStream) => {
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
};
