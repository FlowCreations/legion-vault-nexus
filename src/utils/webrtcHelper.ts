// WebRTC configuration and helper functions for live streaming

// ICE servers configuration (STUN servers for NAT traversal)
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Create a new RTCPeerConnection
export const createPeerConnection = (onTrack?: (stream: MediaStream) => void) => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  
  if (onTrack) {
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      onTrack(stream);
    };
  }
  
  return pc;
};

// Add media stream tracks to peer connection
export const addStreamToPeer = (pc: RTCPeerConnection, stream: MediaStream) => {
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
};
