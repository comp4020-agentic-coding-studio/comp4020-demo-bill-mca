// hap-multiplayer, ported from the standalone Cloudflare Workers prototype
// (https://github.com/bill-mca/hap-multiplayer, retired 2026-10-02 in favour
// of this repo) onto the course's Fly.io/Docker/Node contract.
//
// Single Node process, single Fly machine: every room's live sessions live
// in memory here (one process = no need for the Durable-Object-per-room
// abstraction the Workers version used). `/data` (the course's persistent
// volume) is NOT used yet -- nothing in this app currently needs to survive
// a restart; the original Workers version didn't persist anything by this
// point either (pins/annotations, the one thing that was ever persisted,
// are switched off -- see public/index.html and the port notes in
// PROCESS.md). Revisit when the brief's "server-side logging" milestone
// (crit 11) lands.
//
// Three things this file serves, over plain HTTP + WebSocket on $PORT:
//   - GET /        the MapLibre front end (public/index.html, unchanged
//                   from the Workers version -- it already talks to
//                   `/ws?room=...` on its own origin, which works here too)
//   - GET /readme/ README.md, rendered server-side (spec/invariants.test.ts
//                   checks this -- see spec/README.md)
//   - GET /ws      WebSocket upgrade; realtime room logic below, ported
//                   near-verbatim from the Workers version's `Room` Durable
//                   Object class (see git history for the original)

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = Number(process.env.PORT) || 8080;

const INDEX_HTML = readFileSync(join(ROOT, "public", "index.html"), "utf8");

function renderReadme(): string {
  const md = readFileSync(join(ROOT, "README.md"), "utf8");
  const body = marked.parse(md, { async: false }) as string;
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>About -- Hap-Map Multiplayer</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 680px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #16365c; }
  a { color: #1f4d83; }
  img { max-width: 100%; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

// --------------------------------------------------------------------
// Realtime rooms -- ported from the Workers `Room` Durable Object class.
// One Map per room name, created lazily on first join; a room with no
// sessions left is dropped (DOs would idle out on their own; here we just
// delete the entry so the Map doesn't grow unbounded for one-off room
// names).
// --------------------------------------------------------------------

const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#9A6324", "#808000",
];

interface Session {
  id: string;
  color: string;
  name: string;
  cursor: { lng: number; lat: number } | null;
}

interface Room {
  sessions: Map<WebSocket, Session>;
  visitorCount: number;
}

const rooms = new Map<string, Room>();

function getRoom(name: string): Room {
  let room = rooms.get(name);
  if (!room) {
    room = { sessions: new Map(), visitorCount: 0 };
    rooms.set(name, room);
  }
  return room;
}

function peerList(room: Room, exceptWs: WebSocket) {
  const out: Array<{ id: string; color: string; name: string; cursor: Session["cursor"] }> = [];
  for (const [ws, s] of room.sessions.entries()) {
    if (ws === exceptWs) continue;
    out.push({ id: s.id, color: s.color, name: s.name, cursor: s.cursor });
  }
  return out;
}

function broadcast(room: Room, msg: unknown, exceptWs: WebSocket | null) {
  const data = JSON.stringify(msg);
  for (const ws of room.sessions.keys()) {
    if (ws === exceptWs) continue;
    try {
      ws.send(data);
    } catch {
      // dead socket; its own close/error handler will clean it up
    }
  }
}

function handleConnection(ws: WebSocket, roomName: string) {
  const room = getRoom(roomName);

  const id = crypto.randomUUID();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  room.visitorCount += 1;
  const name = "Visitor " + room.visitorCount;
  const session: Session = { id, color, name, cursor: null };
  room.sessions.set(ws, session);

  ws.send(JSON.stringify({
    type: "init",
    id,
    color,
    name,
    peers: peerList(room, ws),
    count: room.sessions.size,
  }));
  broadcast(room, { type: "join", id, color, name, count: room.sessions.size }, ws);

  ws.on("message", (data) => {
    let msg: any;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === "cursor") {
      session.cursor = { lng: msg.lng, lat: msg.lat };
      broadcast(
        room,
        { type: "cursor", id, color: session.color, lng: msg.lng, lat: msg.lat, name: session.name },
        ws,
      );
    } else if (msg.type === "name") {
      session.name = String(msg.name || "").slice(0, 40);
      broadcast(room, { type: "name", id, name: session.name }, ws);
    }
  });

  const onClose = () => {
    room.sessions.delete(ws);
    broadcast(room, { type: "leave", id, count: room.sessions.size }, null);
    if (room.sessions.size === 0) rooms.delete(roomName);
  };
  ws.on("close", onClose);
  ws.on("error", onClose);
}

// --------------------------------------------------------------------
// HTTP server + WebSocket upgrade
// --------------------------------------------------------------------

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(INDEX_HTML);
    return;
  }

  if (url.pathname === "/readme/" || url.pathname === "/readme") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(renderReadme());
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }
  const roomName = url.searchParams.get("room") || "lobby";
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleConnection(ws, roomName);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`hap-multiplayer listening on 0.0.0.0:${PORT}`);
});
