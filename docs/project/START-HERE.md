# That's a Wrap! Start Here

Status and context for anyone (or any Claude session) picking up the project. Updated Nov 3, 2026.

## The game

A single-player mobile game about running a small video production company, made by Tomás (Pretty Good Productions). It's a paper-cut diorama style, based on the concept art.

- **Production HQ** is the Last Shelter-style layer. You build the company: rooms, roster, money, reputation.
- **Shoot Day** is the Overcooked-style layer. You run the chaos, directing crew in real time through a tabletop shoot.
- "HQ is where you build the company. Shoot Day is where you run the chaos."
- The company name is editable. "Pretty Good Productions" is the placeholder.

## Who does what

- **Tomás:** creative direction, playtesting on his phone, the final calls.
- **ChatGPT:** big-picture design thinking and the handoff docs.
- **Claude:** writes and tests the code, and turns the handoffs into builds. Best idea wins.

## Current build: Prototype 0.2, Milestone A (done)

- **Playable link:** https://claude.ai/artifact/LPPVKvNVCANaQMEa72Uty8
- **Flow:** title, office (rename the company, build rooms), job board, brief, hire crew, shoot, chaos card, wrap report.
- **The set:** layered SVG objects driven by the simulation. The platform, sweep, flag, rigs, key light, fill light, backlight, camera dolly and lens all change state as the crew work, and the burger is built and then carried to the platform. Tapping a workstation shows its task, crew, progress and blocker.
- **Concept art in use:** the logo and the shot thumbnails, cut from the concept image. There is no shared paper texture over the set: each asset carries its own texture.
- **Tests:** 33 automated simulation tests pass, including soft-lock fuzzing.
- **Known gap:** the shoot plays itself. It takes 84 seconds, the crew pick all 14 tasks, the player makes 4 decisions and the crew are idle 57% of the time. The Active Play Proposal addresses this.

## Asset loader (done, Nov 3)

Real art is used wherever a file is supplied and code placeholders stay everywhere else. Drop files in `art/`, run `node build.mjs`, done. File names follow the manifest and an optional `<dept>.<object>.json` holds pivot and scale. Wired for the first batch: hero platform, key light head (off, on, dead), burger build stack (5 layers) and the modular crew puppet (parts named in the manifest). Tested end to end with stand-in images in a real browser, with and without art. See `art/README.md` in the repo.

## Docs in this project

| Doc | What it is |
| --- | --- |
| START-HERE.md | This page: status, decisions, next steps |
| Shoot-Day-Active-Play-Proposal.md | How the sim becomes Overcooked-style active play (Milestones B and C) |
| Asset-Manifest.md | Every art piece, with its layers, pivots, states and what drives it. The spec for final art |
| Prototype-0.2-Build-Plan.md | The 0.2 plan: money model, crew attributes, Net 30, referrals |
| Call-Sheet-Design-Doc-and-Plan.md | The original design doc (the "Call Sheet" era), kept for history |
| DIRECTION.md | Tomás's gameplay direction note (HQ is management, Shoot Day is active control) |
| HANDOFF.md, HANDOFF-0.2.md, HANDOFF-0.2-targeted.md | The ChatGPT handoffs, in order |
| README.md | The code repo readme: how it runs, the folder map, the phone QA checklist, sim rules |

Live versions of the four docs are in claude.ai: [Active Play](https://claude.ai/artifact/Q4xW3bxv4Xq3HtSuodifLa), [Asset Manifest](https://claude.ai/artifact/23N1DamZCc4nuyamvW7qkf), [0.2 Build Plan](https://claude.ai/artifact/7mUB1C15yRypekugQDnUwK), [Design Doc](https://claude.ai/artifact/56up6Y8Pm5TMEyxA63KwQ3).

## Decisions made

- Single player, mobile first, no co-op.
- Build in HTML/JS, playable from a link on any phone. Phaser is a fallback only if phones struggle.
- Grow the current prototype rather than rebuild it.
- Keep the office rooms, even though the 0.2 handoff deferred them.
- For iOS, wrap the same code with **Capacitor**, then submit with Xcode on a Mac. Unity and Godot are not needed.
- Use temporary code-drawn SVG art until the final assets arrive. Final art is built to the Asset Manifest.
- Keep the autonomous crew logic. It becomes the "autonomy level 2" path, an assist you earn.

## Decisions waiting on Tomás (before Milestone B)

- [ ] **Default autonomy.** Suggested: 0 for newbies, 1 for solid crew, 2 only for veterans, plus an Assist Mode setting that sets everyone to 1.
- [ ] **Small problems.** Do they cost only quality, or also time and money?
- [ ] **Losing.** Can you lose a shoot (the client pulls the plug), or does a bad day only cost stars and money?
- [ ] **Orientation.** Keep the shoot in portrait, or move to landscape like the concept art?

## Next steps

1. **Milestone B1, engine:** autonomy levels, task queues, walking (merged from the parked branch), `canAssign`. A scripted test player must finish the shoot.
2. **B2, crew animation:** walking from sim positions, work poses, idle hand-raise, reactions.
3. **C1, controls:** station highlights, queue pips, idle bell, bigger touch targets.
4. **C2, content:** split the Burger Job into short steps, then add carrying, two-person jobs, small problems and peak windows. Tune to 3 to 5 minutes.
5. **Art test batch from ChatGPT:** the hero platform, the key light head (off, on, dead), one modular puppet in parts and optionally the burger build stack. The loader is ready, so the batch only needs to be dropped into `art/`.

## How development works

- **Building:** Claude sessions like this one write the code, run the tests and publish a playable link. Tomás plays it on his phone and gives notes.
- **Testing:** use the phone QA checklist in README.md, plus the automated sim tests (`node --test`).
- **Code storage:** https://github.com/PrettyGoodProductions/thats-a-wrap (private). This is the source of truth. Every session starts by attaching and cloning it, and ends by pushing. Owned by the PGP account. tomasPSAA, the GitHub login connected to claude.ai, is a collaborator, and the Claude GitHub App is installed on the repo.
- **Code branches:** `master` is Milestone A. `wip/crew-depth` holds parked engine work: walking time, organization, leadership, chemistry, specialties, take review, the 8 AM to 6 PM day clock and the $28,000 economy.
- **iOS path, later:** Apple Developer Program ($99/year), then Capacitor, Xcode, TestFlight beta, App Store.

## Working preferences

- Avoid em-dashes. Keep writing concise and natural.
- The concept images (HQ and shoot set) are the style guide. Upload them to this project in claude.ai so future sessions can see them.
