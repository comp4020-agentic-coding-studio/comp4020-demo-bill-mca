// hap-multiplayer -- teaching-exemplar multi-user layer over Bill's Hap-Map
// imagery. This Worker only handles the realtime "/ws" endpoint; everything
// else (the MapLibre front end) is served as static Workers Assets from
// ./public (see wrangler.toml [assets]).
//
// Shared state = live cursors + dropped "pins" inside one Durable Object
// ("Room"). Real-time = WebSocket broadcast to every other connected session.
// Persists = pins are written to the Durable Object's SQLite-backed storage,
// so they survive reconnects, Worker restarts, and redeploys.
//
// Deliberately NOT implemented yet: the "trace logging" feature from the
// real HAP research tool's seed design (opt-in consent, pooled observational
// traces, interview recruitment -- see HREA_Questions.md / backlog D-10 in
// the real project). That's a different, ethics-governed thing from "log
// cursor/pin events for this demo" and needs an explicit scope decision
// before it's built here. See README.md.

const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#9A6324", "#808000",
];

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // WebSocket -> { id, color, name, cursor }
    this.pins = null; // lazy-loaded from durable storage
  }

  async loadPins() {
    if (this.pins === null) {
      this.pins = (await this.state.storage.get("pins")) || [];
    }
    return this.pins;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleSession(ws) {
    ws.accept();

    const id = crypto.randomUUID();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const session = { id, color, name: null, cursor: null };
    this.sessions.set(ws, session);

    const pins = await this.loadPins();
    ws.send(JSON.stringify({
      type: "init",
      id,
      color,
      pins,
      peers: this.peerList(ws),
    }));
    this.broadcast({ type: "join", id, color }, ws);

    ws.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        return;
      }

      if (msg.type === "cursor") {
        session.cursor = { lng: msg.lng, lat: msg.lat };
        this.broadcast(
          { type: "cursor", id, color: session.color, lng: msg.lng, lat: msg.lat },
          ws
        );
      } else if (msg.type === "pin") {
        const pin = {
          id: crypto.randomUUID(),
          lng: msg.lng,
          lat: msg.lat,
          year: msg.year,
          note: String(msg.note || "").slice(0, 280),
          authorName: session.name || "anonymous",
          color: session.color,
          ts: Date.now(),
        };
        this.loadPins().then((list) => {
          list.push(pin);
          this.state.storage.put("pins", list);
        });
        this.broadcast({ type: "pin", pin }, null);
      } else if (msg.type === "name") {
        session.name = String(msg.name || "").slice(0, 40);
        this.broadcast({ type: "name", id, name: session.name }, ws);
      }
    });

    const onClose = () => {
      this.sessions.delete(ws);
      this.broadcast({ type: "leave", id }, null);
    };
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onClose);
  }

  peerList(exceptWs) {
    const out = [];
    for (const [ws, s] of this.sessions.entries()) {
      if (ws === exceptWs) continue;
      out.push({ id: s.id, color: s.color, name: s.name, cursor: s.cursor });
    }
    return out;
  }

  broadcast(msg, exceptWs) {
    const data = JSON.stringify(msg);
    for (const ws of this.sessions.keys()) {
      if (ws === exceptWs) continue;
      try {
        ws.send(data);
      } catch (err) {
        // dead socket; will be cleaned up by its own close/error handler
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const roomName = url.searchParams.get("room") || "lobby";
      const doId = env.ROOMS.idFromName(roomName);
      const stub = env.ROOMS.get(doId);
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
