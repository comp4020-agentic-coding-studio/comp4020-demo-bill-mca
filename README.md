# HAP Multiplayer — a shared window onto historical aerial photography

This is a teaching exemplar for COMP4020/COMP8020, built live at crits
alongside students: a small web app where several people open the same link
and explore historical aerial imagery of Canberra together, in real time,
seeing each other move.

## What "good" means here

Good is **co-presence that's honest about what it is**: a room of people
looking at the same old photographs of the same place, aware of each other,
with nothing hidden and nothing pretending to be more than it is. Concretely,
that means:

- **Shared, not solitary.** The whole point is seeing someone else's cursor
  move across 1950s Canberra while you're looking at 2025. A single-user
  viewer — however polished — would not be "good" by this app's own
  standard, no matter how nice it looked.
- **Low-friction identity.** No accounts, no login, no consent form: open the
  link, get a generic visitor name, start looking. Anything heavier belongs
  to a different kind of project (see below).
- **Honest about data.** The only thing this app persists is a room's
  connection state — who's here, where their cursor is. There is no personal
  data collection, no research logging, and no analytics. That's a
  deliberate boundary, not an oversight: the imagery is drawn from a real,
  separately governed PhD research tool on historical aerial photography,
  and this exemplar deliberately does not reuse any of that project's
  consent, interview, or data-custodianship machinery — only the base map
  layers, with explicit clearance to do so.
- **Fast enough to not be annoying.** Pre-tiled imagery (cloud-optimised
  GeoTIFFs plus a live government image service) over a CDN, not something
  we tile or proxy ourselves — multi-user only feels good if the base map
  doesn't lag.

## What this deliberately isn't (yet)

Earlier iterations had pins/annotations; they were removed until there's a
real identity story, rather than left half-working. There's no persistent
account system, no moderation, and no history/replay of a room after
everyone leaves — each is a live-only decision, open to revisit at a later
crit rather than solved up front.

## How it's built

A single Node/TypeScript server (`src/server.ts`) serves the static
MapLibre front end and runs one WebSocket room per `?room=` query param,
broadcasting cursor positions and an authoritative live headcount to
everyone connected. It runs as one Fly.io machine with a small persistent
volume, per the course template. The full build story — including an
earlier Cloudflare Workers prototype and why it moved to this stack — is in
[`PROCESS.md`](PROCESS.md).
