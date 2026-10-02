# hap-multiplayer (teaching exemplar, flunky v0)

A multi-user, real-time, persistent prototype built as a COMP4020/COMP8020
"Agentic Coding Studio" teaching exemplar, run by Bill (tutor) on the same
crit cadence as his students. **Not graded, not the real research tool.**

## What this is
A shared "room": everyone who opens the page sees everyone else's live
cursor moving over the map, and anyone can drop a timestamped, noted pin
that appears for every other open session immediately and is still there
after a reload/redeploy.

- **Multi-user**: every connected browser is a distinct session (random id
  + colour), told apart by colour + an optional name.
- **Real-time**: WebSocket to a Cloudflare Durable Object; cursor moves and
  pins broadcast to every other connected session, no reload needed.
- **Persists**: pins are written to the Durable Object's (SQLite-backed,
  Workers-Free-plan-eligible) storage, so they survive reconnects, Worker
  restarts, and redeploys. (Live cursor positions are NOT persisted --
  that's presence, not history.)

## Imagery
All 8 imagery years (1926, 1955, 1980, 2004, 2009, 2012, 2017, 2023, plus a
2025 Esri basemap) are loaded **directly from Bill's existing single-user
tool** at https://hapmap-dev.u5007063.workers.dev/ -- same URLs, same
EPSG:3857, same COG/ImageServer config, copied verbatim. Nothing is copied,
re-hosted, or duplicated; CORS is open on both the R2-backed COG endpoint
and the ACT Government ImageServer, so this project just points at them
cross-origin. Bill's real dev tool is untouched.

Carried-forward caveat (not new, from the real tool's own code): the
2004-2023 ACT Government imagery's licence for public reuse is **unconfirmed**
(ACT's general CC BY 4.0 excludes "images, photographs"). Treat this build as
a technical proof of concept, same as the source tool's own "TEST BUILD"
banner says.

## Explicitly NOT built yet -- needs a scope decision first
**"Trace logging"** -- Bill asked (2026-10-02) to "implement the trace
logging from the initial seed idea." In the original seed-idea spec
(`front-end-overview.md`, drawn from the real HAP research project), "trace
logging" is a specific, HREA-governed research instrument: opt-in consent,
pooled traces feeding an observational study, and traces/opt-in answers used
to select and prompt interview participants (`backlog.md` D-10). That's a
different, much more sensitive thing than "log cursor/pin events for this
demo's own sake" (e.g. a simple activity feed, or persisting per-user
viewport history as a feature). Deliberately not implemented here until
Bill confirms which one he means -- see chat / project notes
(`state/projects/comp4020-capstone.md` in the agent's memory) for the open
question.

## Architecture
- `src/worker.js` -- Cloudflare Worker. Routes `/ws` to a Durable Object
  (`Room`, one instance per room name, currently just `lobby`); everything
  else falls through to static assets.
- `public/index.html` -- MapLibre GL front end: imagery config ported from
  hapmap-dev, plus a `WebSocket` connection for live cursors/pins. No build
  step (same philosophy as the source tool -- ESM imports straight from
  esm.sh/unpkg).
- `wrangler.toml` -- Workers + Assets + one `Room` Durable Object class,
  `new_sqlite_classes` migration (SQLite storage backend -- works on
  Cloudflare's free Workers plan; the older KV-backed DO storage does not).

## Deploy
```
npx wrangler deploy
```

## Open questions / next steps
1. Trace logging scope (see above) -- blocked on Bill.
2. Currently one single shared "lobby" room; multiple named rooms (per the
   brief's own "what counts as co-presence" framing) would be a one-line
   change (`?room=<name>` is already wired through).
3. The full drag/scrub year-timeline UI from hapmap-dev was simplified to a
   button list for this first pass -- can port the real timeline over once
   the core multiplayer loop is confirmed to feel good.
4. No README.md/CLAUDE.md/spec/ scaffolding yet in the capstone-brief sense
   (that's the next layer once the prototype itself is validated).
