# Process overview

*Written by Bill, from my own perspective. The raw source material is the committed conversation log at
[`process/conversation-log.md`](process/conversation-log.md).*

## What I'm trying to do

- I am both the tutor of this course and a PhD researcher building a tool for exploring historical aerial photography (HAP) of Canberra.
- I want a teaching exemplar that I can demo live to students at the weekly tutorial
to help teach the process of iterating a design with the help of a software development agaent. 
- This is a safe-to-fail chance to prototype an idea I've previously judged too risky: a **multi-user** version of
my exploration tool, where several people share a live view of the same historical imagery together.

## Agentic Setup

For this demo, I'm testing out [Strix](https://github.com/tkellogg/open-strix) as [developed by Tim Kellogg](https://timkellogg.me/blog/2025/12/15/strix). I setup A stateful agent as per the repo instructions along with the discord integration. The agent is configured to use STR Proxy to run on a Claude Opus model and bill my COMP4020 budget. 

## Idea development

As stated above, I already had the idea of making a multi-user version of my tool but the technical challenge of building a robust backend for the live data transfer seemed too daunting to me. 

I'm astounded that the agent was able to make this prototype with relative ease. I was very impressed when I saw [Felt GIS](https://felt.com/) for the first time as it seemed to me to be a big step in GIS user experience with had been dominated by maximalist monolithic user interfaces that emphasise expert knowledge. I didn't think that the engineering of the back-end would be simple enough for an agent to one-shot prototype. Thus I was pleasantly surprised that my minimal description of a live multi-user GIS tool resulted in this prototype that resembles a budget version of Felt. I'm also surprised that the codebase seems to be a manageable size. 

## Reflections

To be honest I don't really understyand how state is tracked on the backend of this site. I can see that it is using websockets and I would assume that the socket is transacting x/y coordinates for all users. I'm interested to see if this architecture can withstand many users in the same room I would imagine that the amount of text is unmanageable after ~20 users. I'm keen to try it in the crit on Wednesday and see if we can break it with too many users.

So far, I haven't seen much difference from using Strix compared to my usual Claude process. Kellog suggests that it takes a few weeks of prompting Strix before it starts to see patterns in your ideas and to act more autonomously. I'll be interested to see if that happens. In the meantime, it does seem to be a nice way of automatically managing contxt; Each time I message strix it starts a new session with some of the context from previous sessions held over. It is nice to have that automated and it seesms to be working very well. 

## Next steps

As built, this website doesn't fulfil the design ideal. my ultimate goal is to create a n interface that allows people to deliberate about the history of their urban environment as part of the process of making decisions about environmental problems. As it is, the interface might make users somewhat interested in each other's activity but it doesn't allow users to explore together or to actually discuss their interpretations of what they have seen. I still need to consider how this could be achieved. Having everyone together physically in the same room with this interface live would allow people to have the type of discussion that I'm interested in but, for this tool to be truly effective, the users need to be able to interact asyncronously.

__Design:__
- Show the interface at the crit session and solicit feedback.
- Spec a couple of alternative ways of visualising users, interactions and interpretations in the interface.
- Prototype an alternative interface using the above to test in the Week 10 crit

__Technical:__
- Ask COMP4020 students to live test my interface during the crit to see if the volume of traffic starts to break the interface.
- Build an agentic user of the interface that I can see working in the interface and so potentially interact with. 
- Use many of said agentic users to test the technical limits of my design. 


A few patterns held for the whole project:

I'm working on the

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



## A note from Strix

Bill wrote everything above this point himself, in his own words, after a
few days of actually directing this build — I didn't draft or edit it. It's
his honest reaction as the person steering the project: what surprised him
(how little backend code a working multi-user prototype actually took),
what he's still unsure about (how the websocket/state model holds up once a
room has a few dozen people in it), and where he wants to take the design
next (asynchronous, discussion-oriented interaction, not just shared
viewing).

My own fuller account — written from my perspective as the one doing the
hands-on engineering — used to sit in this file and is still intact in git
history, at commit
[`6cd61c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-demo-bill-mca/commit/6cd61c4).
It goes decision-by-decision (the scope/ethics calls, what got verified and
how, why the infra changed twice) and cites specific commits for anything
checkable. The two accounts describe the same project from two different
seats: his is the researcher/tutor's impression of watching and directing
the build happen; mine was the engineer's log of what actually got checked,
broken, and fixed.

Both accounts are summaries, though. The ground truth is the full, unedited
conversation transcript committed at
[`process/conversation-log.md`](process/conversation-log.md) — every message,
in order, nothing paraphrased. If either account seems to compress or
simplify a decision, that's the file to check it against.
