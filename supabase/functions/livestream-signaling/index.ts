// WebRTC Signaling Server for Live Streaming with HTTP health check
// Handles WebSocket connections and routes messages between broadcaster and viewers

// deno-lint-ignore-file no-explicit-any
type WS = WebSocket;
type Room = { broadcaster?: WS; viewers: Set<WS> };

const rooms = new Map<string, Room>();

function getRoom(id: string): Room {
  if (!rooms.has(id)) rooms.set(id, { viewers: new Set() });
  return rooms.get(id)!;
}

function safeSend(ws: WS | undefined, msg: unknown) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  } catch (e) {
    console.error('[Signaling] safeSend error:', e);
  }
}

function broadcastViewers(room: Room, msg: unknown) {
  for (const v of room.viewers) safeSend(v, msg);
}

function cleanupSocket(ws: WebSocket) {
  for (const [id, room] of rooms) {
    if (room.broadcaster === ws) {
      room.broadcaster = undefined;
      broadcastViewers(room, { type: 'broadcaster-left', roomId: id });
    }
    room.viewers.delete(ws);
    if (!room.broadcaster && room.viewers.size === 0) rooms.delete(id);
  }
}

Deno.serve((req) => {
  // Health check endpoint for HTTP requests
  const upgradeHeader = (req.headers.get("upgrade") || "").toLowerCase();
  if (upgradeHeader !== "websocket") {
    return new Response(
      JSON.stringify({ ok: true, name: "livestream-signaling" }), 
      { 
        status: 200, 
        headers: { "content-type": "application/json" } 
      }
    );
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  let role: "broadcaster" | "viewer" | undefined;
  let roomId = "unknown";

  socket.onopen = () => {
    console.log('[Signaling] WebSocket opened');
  };

  socket.onmessage = (e) => {
    let msg: any;
    try {
      msg = JSON.parse(e.data);
    } catch {
      console.log('[Signaling] Non-JSON message ignored');
      return;
    }

    const type = msg?.type as string | undefined;
    roomId = msg?.roomId ?? roomId;
    
    if (!roomId || roomId === "unknown") {
      console.log('[Signaling] Message missing roomId');
      return;
    }

    const room = getRoom(roomId);

    // Handle join separately (only message with 'role' field)
    if (type === 'join') {
      role = msg?.role;
      console.log(`[Signaling] join: role=${role} room=${roomId}`);

      if (role === 'broadcaster') {
        room.broadcaster = socket;
      } else if (role === 'viewer') {
        room.viewers.add(socket);
      }
      return;
    }

    if (!type) return;

    // Route messages based on type
    switch (type) {
      case 'viewer-offer': {
        console.log(`[Signaling] viewer-offer → broadcaster (room=${roomId})`);
        safeSend(room.broadcaster, msg);
        break;
      }

      case 'broadcaster-answer': {
        console.log(`[Signaling] broadcaster-answer → viewers (room=${roomId})`);
        broadcastViewers(room, msg);
        break;
      }

      case 'ice-candidate': {
        const from = msg?.from as "viewer" | "broadcaster" | undefined;
        console.log(`[Signaling] ice-candidate from=${from} room=${roomId}`);
        
        if (from === 'viewer') {
          safeSend(room.broadcaster, msg);
        } else if (from === 'broadcaster') {
          broadcastViewers(room, msg);
        }
        break;
      }

      case 'ping': {
        safeSend(socket, { type: 'pong' });
        break;
      }

      case 'end': {
        console.log(`[Signaling] Stream ended in room ${roomId}`);
        broadcastViewers(room, { type: 'end', roomId });
        break;
      }

      default: {
        console.log(`[Signaling] Unknown type=${type} room=${roomId}`);
      }
    }
  };

  socket.onerror = (ev) => {
    console.error('[Signaling] WebSocket error:', ev);
    cleanupSocket(socket);
  };

  socket.onclose = (ev) => {
    console.log(`[Signaling] WebSocket closed: role=${role} room=${roomId} code=${ev.code} reason=${ev.reason || '(no reason)'}`);
    cleanupSocket(socket);
  };

  return response;
});
