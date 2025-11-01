// WebRTC Signaling Server for Live Streaming
// Handles WebSocket connections and routes messages between broadcaster and viewers

// deno-lint-ignore-file no-explicit-any
export const rooms: Map<string, { broadcaster?: WebSocket; viewers: Set<WebSocket> }> = new Map();

function getRoom(roomId: string) {
  if (!rooms.has(roomId)) rooms.set(roomId, { viewers: new Set() });
  return rooms.get(roomId)!;
}

function removeSocket(ws: WebSocket) {
  for (const [id, room] of rooms) {
    if (room.broadcaster === ws) room.broadcaster = undefined;
    if (room.viewers.has(ws)) room.viewers.delete(ws);
    if (!room.broadcaster && room.viewers.size === 0) rooms.delete(id);
  }
}

Deno.serve((req) => {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onmessage = (e) => {
    let msg: any;
    try { msg = JSON.parse(e.data); } catch { return; }
    const { type, role, roomId, payload } = msg || {};
    if (!roomId) return;
    const room = getRoom(roomId);

    console.log(`[Signaling] ${type} from ${role} in room ${roomId}`);

    // Register roles
    if (type === 'join' && role === 'broadcaster') { room.broadcaster = socket; return; }
    if (type === 'join' && role === 'viewer') { room.viewers.add(socket); return; }

    // Viewer offer -> broadcaster
    if (type === 'viewer-offer' && room.broadcaster) {
      try { 
        room.broadcaster.send(JSON.stringify({ type, role, roomId, payload }));
        console.log(`[Signaling] Forwarded viewer offer to broadcaster`);
      } catch (e) {
        console.error('[Signaling] Failed to forward viewer offer:', e);
      }
      return;
    }

    // Broadcaster answer -> all viewers
    if (type === 'broadcaster-answer') {
      for (const v of room.viewers) { 
        try { 
          v.send(JSON.stringify({ type, role, roomId, payload }));
          console.log(`[Signaling] Forwarded broadcaster answer to viewer`);
        } catch (e) {
          console.error('[Signaling] Failed to forward answer to viewer:', e);
        }
      }
      return;
    }

    // ICE relay (both directions)
    if (type === 'ice') {
      if (role === 'viewer' && room.broadcaster) {
        try { 
          room.broadcaster.send(JSON.stringify({ type, role, roomId, payload }));
          console.log(`[Signaling] Forwarded ICE candidate from viewer to broadcaster`);
        } catch (e) {
          console.error('[Signaling] Failed to forward ICE to broadcaster:', e);
        }
      } else if (role === 'broadcaster') {
        for (const v of room.viewers) { 
          try { 
            v.send(JSON.stringify({ type, role, roomId, payload }));
            console.log(`[Signaling] Forwarded ICE candidate from broadcaster to viewer`);
          } catch (e) {
            console.error('[Signaling] Failed to forward ICE to viewer:', e);
          }
        }
      }
      return;
    }

    if (type === 'end') {
      console.log(`[Signaling] Stream ended in room ${roomId}`);
      for (const v of room.viewers) { 
        try { v.send(JSON.stringify({ type: 'end', role, roomId })); } catch {} 
      }
      return;
    }
  };

  socket.onclose = () => {
    console.log('[Signaling] Socket closed');
    removeSocket(socket);
  };
  
  socket.onerror = (e) => {
    console.error('[Signaling] Socket error:', e);
    removeSocket(socket);
  };

  return response;
});
