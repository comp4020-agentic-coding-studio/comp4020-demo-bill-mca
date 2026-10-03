# Process overview

*Written by Strix, Bill's agent, from my own perspective. Bill reviewed and can
edit/annotate; this is my honest account of how we got here, not a polished
marketing story. The raw source material is the committed conversation log at
[`process/conversation-log.md`](process/conversation-log.md).*

## What we were trying to do

Bill is both the tutor of this course and a PhD researcher building a
single-user tool for exploring historical aerial photography (HAP) of
Canberra, under its own ethics approval (HREA). He wanted a teaching exemplar
to build live, crit-by-crit, in front of his students — and saw the capstone's
low-stakes four-week window as a safe-to-fail chance to prototype an idea he'd
previously judged too risky to attempt for real: a **multi-user** version of
his exploration tool, where several people share a live view of the same
historical imagery together.

That framing set the one rule that mattered most throughout: the real,
ethics-governed research tool and its data stay completely separate from this
exemplar. I raised that boundary at the start and re-raised it (once per new
concrete instance, not as a standing anxiety) whenever a new request came
close to it — e.g. when "trace logging" was proposed, I checked what that
term meant in Bill's own source material before building anything, found it
named a specific research instrument, and asked rather than assumed.

## How we made decisions

A few patterns held for the whole project:

- **Bill's calls on scope, ethics, and pacing were authoritative.** My job was
  to surface concerns clearly before building, not to silently comply *or*
  silently refuse. The clearest example: his first seed idea (a direct
  reskin of the real research tool) didn't fit the brief and risked blurring
  into the governed research project — I said so plainly, with reasons, and
  proposed an alternative that kept the theme without the risk. He agreed.
- **Verify, don't assert.** Pricing, library behaviour, CORS, API capability —
  wherever a technical answer mattered, I checked it live (docs, curl, a real
  deploy) rather than answering from memory, and said explicitly when I had.
- **Ship, don't describe.** When Bill said "build it and let me see," the
  right answer was a deployed, smoke-tested URL, not a proposal document.
  Every architecture pivot in this project ended with something running and
  verified, not just planned.
- **Infrastructure changed twice, and that was fine.** Fly access was blocked
  early (no API key for tutors yet), so we prototyped on Cloudflare
  Workers/Durable Objects instead. Once the real course-managed Fly repo
  arrived, we ported the realtime logic across properly rather than quietly
  leaving the demo on the wrong platform. Pivoting infra mid-project cost
  time but not correctness, because each version was verified working before
  we moved on.

## Who did what

Bill: set direction and scope at every decision point, supplied the real
imagery/tile sources and confirmed ethics clearance for reusing them, made
the final call on every open question (Cloudflare vs. Fly, what to tear
down, what to keep), and will write the student-facing reflections himself.

Me (Strix): did essentially all of the hands-on engineering — scaffolding,
coding, deploying, debugging, and verifying — across two platforms, and
surfaced the scope/ethics/governance questions as they came up rather than
building past them. I also wrote this file and the README.

## A few things worth citing directly

The first working prototype — MapLibre front end over Bill's real imagery
layers, Durable-Object-backed shared cursors — shipped as
[`af77aa8`](https://github.com/comp4020-agentic-coding-studio/comp4020-demo-bill-mca/commit/af77aa8).

Two real bugs surfaced and got fixed once Bill actually tested with two
browsers side by side: peer cursors rendering in the wrong place (a CSS
`position` collision with MapLibre's own marker styling), and pins/identity
being ahead of what the feature set should support yet — both fixed in
[`b1096eb`](https://github.com/comp4020-agentic-coding-studio/comp4020-demo-bill-mca/commit/b1096eb).

When Fly access came through via the course template, the Cloudflare-specific
realtime logic was ported — not just git-merged — into a plain Node/`ws`
server matching this repo's actual deploy contract, in
[`9d6371d`](https://github.com/comp4020-agentic-coding-studio/comp4020-demo-bill-mca/commit/9d6371d).
The earlier prototype's history came along for the ride in
[`b24f6e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-demo-bill-mca/commit/b24f6e9)
so it stays part of the citable record even though the Cloudflare deployment
itself has since been torn down.

## What's still open

Bill is writing the per-crit reflections (`reflections/crit-8.md` etc.)
himself — those are first-person process/growth questions I shouldn't answer
on his behalf. Everything else in this file is my account; add to or correct
it as you like.
