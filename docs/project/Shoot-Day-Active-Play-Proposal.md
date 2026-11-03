# Shoot Day: Active Play Proposal

Nov 3, 2026 · @Tomás Valladares

How the current simulation becomes an Overcooked-style shoot without throwing away what works. HQ is where you build the company. Shoot Day is where you run the chaos.

## The gap

Today the Burger Job plays itself. Measured on the current build, with auto crew and instant ACTION taps:

| Measure | Today | Target |
| --- | --- | --- |
| Shoot length | 84 seconds | 3 to 5 minutes |
| Tasks started | 14, all chosen by the crew | 60 to 100, most chosen by the player |
| Player decisions | 4 (three ACTION taps, one chaos choice) | One every 2 to 4 seconds |
| Crew idle time | 57%, waiting with nothing they can do | Idle only when the player hasn't given orders, and visibly so |

The fix is not more rules on top of the auto crew. Crew should do what they're told, finish it, and then wait for you. The current auto-pick logic stays as an assist you earn.

## Crew states

The one big change in behavior: when a task finishes and nothing is queued, a crew member goes **idle and waits for you**. Today they pick their own next task. Autonomy is the switch that lets experienced crew pick for themselves at that moment.

&#91;embedded content: crew states · 4 states, 7 transitions\]

Carrying isn't a separate state: a crew member moving with an item has full hands and can't start other work until they set it down at its station.

## Simulation changes

The engine stays deterministic and tested. Most of the change is in who picks the next task.

| Area | Today | Proposed |
| --- | --- | --- |
| Who picks work | Every crew member auto-picks the best task in their department | **The player.** Crew run what they're given, then stop and wait |
| Autonomy | Always on | A per-crew level: **0** waits for orders, **1** keeps going at the same station (the grip moves from tabletop to flag without asking), **2** is today's full auto. Comes from experience, traits and HQ upgrades |
| Orders | One override at a time | A **queue of up to 3 tasks** per person. Tap to do it now, or add it to the queue |
| Movement | Instant, the art just slides | **Real walk time** between stations, already built on the `wip/crew-depth` branch. Distance becomes a decision: send whoever is closest |
| Task size | 13 tasks of 4 to 18 seconds | 25 to 35 shorter tasks of 3 to 8 seconds, so orders turn over faster |
| Carrying | None | Some tasks need an item fetched first: sandbags from the gear pile, the burger from the art table, a battery from the cart. A crew member carrying something can't do other work |
| Two-person tasks | None | A few heavy jobs (lifting the platform, flying the sweep) go twice as fast with two people, or can't start with one |
| Small problems | One big chaos event | Frequent small ones every 15 to 25 seconds: a wilting lettuce leaf, a crumb on the bun, a dying battery, a light gel fading. Each gives a short window to send someone over before it costs quality |
| Big chaos | Key light dies | Kept, plus one more per shoot. These freeze for a decision as today |
| Readiness pressure | The burger keeps forever | Food has a peak window. ACTION at peak gets a quality bonus, so a ready shot is an urgent shot |
| Soft-lock tests | Auto crew must always finish | A scripted test player must finish within the time limit, and nobody stays blocked forever without a reason the player can see |

The auto-pick code becomes the autonomy level 2 path, so nothing is thrown away.

## Controls

Two taps per order, everything on the set, no menus during play.

| Gesture | Result |
| --- | --- |
| Tap a crew member | Selects them. Every station lights up green (can do it now), amber (can queue it) or red (can't, with the reason on tap) |
| Then tap a station | They walk over and do that station's next task now. Anything they were doing is paused and keeps its progress |
| Tap a second station while still selected | Adds it to their queue. Numbered pips (1, 2, 3) appear over the queued stations |
| Tap a busy coworker | Go help them on their task (already working) |
| Tap a problem marker | Sends the selected crew member to deal with it |
| Tap the idle bell | Selects the next idle crew member, so you never hunt for who's free |
| Long-press a crew member | Clears their queue |
| Tap empty space | Deselects (already working) |

Idle crew show a raised hand and a "?" bubble, and their portrait in the crew bar bounces. The status line stays a one-line hint, never a list.

## Pacing and the Burger Job retune

The math behind a decision every few seconds: four crew, each on a task of 5 to 10 seconds including the walk, need about 25 to 50 orders a minute between them. Queues and autonomy 1 cut that roughly in half, landing at an order every 2 to 4 seconds. Problems and ACTION calls sit on top.

Retuned Burger Job, to be confirmed in playtests:

- **Shots:** the same three, each split into 8 to 12 short steps. Example for the hero shot: fetch apple boxes, build platform, fly the sweep (two people), fetch the light, set the light, aim the light, build the burger in three steps, carry the burger, place it, frame, lens.
- **Shoot length:** about 3.5 minutes for a good player and 5 for a struggling one, with the wrap time set at 4.
- **Problems:** about 8 small ones per shoot, plus the key light failure.
- **Peak windows:** the hero burger looks best for 20 seconds after placing, the cheese stays stretchy for 12, and the sauce has to roll within 8 seconds of starting the pour.

## How HQ feeds the shoot

HQ growth should make shoots bigger and your crew smarter, not easier. Each upgrade either adds an assist or unlocks harder jobs.

| HQ growth | Effect on Shoot Day |
| --- | --- |
| Veteran crew in your network | Autonomy 1 or 2: they chain their own next steps |
| Hire a 1st AD (new role) | Auto-dispatches anyone idle for more than 3 seconds. The current auto-crew logic becomes their brain |
| Walkie-talkies | Queues hold 4 tasks instead of 3, so you can plan further ahead |
| Gear Cage | Gear is staged on set, so fetch steps get shorter |
| Prep Kitchen | Longer peak windows for food |
| Bigger jobs | More shots, a fifth and sixth crew member, two stages, location shoots with travel |

The player always keeps the hard calls: priorities, problems, ACTION timing and who helps whom.

## Rendering readiness

Milestone A was built with this in mind, so B and C extend it rather than replace it.

- **Already in place:** every station, prop and crew member is its own object, updated only when it changes. Taps go to stations, crew and task icons through one handler. Selection and deselection work, and stations answer "what are you doing" from the simulation.
- **Add for B:** crew positions read the simulation's walk progress every frame instead of guessing with CSS transitions, so a puppet is always exactly where the engine says. Walk cycle and work poses swap with crew state.
- **Add for C:** a station highlight layer (green, amber, red) driven by a new `canAssign(crew, station)` query, queue pips, problem markers with countdown rings, the idle bell, and larger 44-point touch targets around each puppet.
- **Performance:** paper filters stay on static pieces. Moving pieces and new highlight layers use plain fills, so many fast updates stay cheap on an iPhone.

## Build sequence

1. **B1, engine:** autonomy levels, task queues, walking (merged from the parked branch), `canAssign`. Tests: a scripted test player finishes the shoot, autonomy 0 crew go idle, queues run in order.
2. **B2, crew animation:** walking from simulation positions, walk cycle, department work poses, idle hand-raise, blocked, mistake and celebrate reactions.
3. **C1, controls:** station highlights, queue pips, idle bell, long-press to clear, bigger touch targets.
4. **C2, content:** split the Burger Job into short steps, add carrying, two-person jobs, small problems and peak windows. Tune to 3 to 5 minutes.
5. **Playtest checkpoint:** measure orders per minute, crew idle time and how often players feel lost.

**Decisions needed before B1:**

- [ ] Default autonomy for the starting crew. My suggestion: 0 for newbies, 1 for solid crew, 2 only for veterans, plus an Assist Mode setting that sets everyone to 1.
- [ ] Should small problems cost only quality, or also time and money?
- [ ] Is losing possible on Shoot Day (the client pulls the plug), or does a bad day only cost stars and money?
- [ ] Keep the shoot portrait, or move to landscape like the concept art now that there's more to tap?
