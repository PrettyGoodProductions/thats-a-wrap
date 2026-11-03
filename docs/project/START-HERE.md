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
- **Concept art in use:** the logo, the shot thumbnails and a paper-grain texture, all cut from the concept image.
- **Tests:** 33 automated simulation tests pass, including soft-lock fuzzing.
- **Known gap:** the shoot plays itself. It takes 84 seconds, the crew pick all 14 tasks, the player makes 4 decisions and the crew are idle 57% of the time. The Active Play Proposal addresses this.

## Milestone B, first slice (in review, Nov 3)

- **Playable link (Layout Lab build):** https://claude.ai/artifact/RGUa3UpsSninEw3HBngVRE
- **Branch:** `milestone-b-lab`. `master` is still Milestone A until the experiment is reviewed.
- **Engine:** crew autonomy 0, 1 and 2, Assist Mode, and the `canAssign`, `stationTasks` and `idleWork` queries. The default is 2, so the normal game plays exactly as before.
- **Layout Lab:** office screen, "Layout lab" button. The same seeded shoot with everyone waiting for orders, played in portrait or landscape, with interaction metrics saved side by side. Phones locked to portrait get the shoot turned sideways automatically.
- **Tests:** 74 simulation tests pass, including a scripted player that finishes the shoot with every crew member at autonomy 0. A Chrome test bot (`tools/qa_lab_e2e.py`) finishes the Lab in portrait, landscape and rotated landscape with real taps.
- **Finding:** landscape needs no scrolling and keeps the crew and ACTION in view. Portrait pushes the crew tiles below the fold. The current Burger Job gives only about one order every 7 seconds even with everyone on orders, so the task split (C2) is what will create the pace.
- **Plan:** Milestone-B-Plan.md has the decisions, the findings and the step-by-step sequence.

## Asset loader (done, Nov 3)

Real art is used wherever a file is supplied and code placeholders stay everywhere else. Drop files in `art/`, run `node build.mjs`, done. File names follow the manifest and an optional `<dept>.<object>.json` holds pivot and scale. Wired for the first batch: hero platform, key light head (off, on, dead), burger build stack (5 layers) and the modular crew puppet (parts named in the manifest). Tested end to end with stand-in images in a real browser, with and without art. See `art/README.md` in the repo.

## Docs in this project

| Doc | What it is |
| --- | --- |
| START-HERE.md | This page: status, decisions, next steps |
| Milestone-B-Plan.md | Milestone B decisions, what the Layout Lab found, and the build sequence |
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

## Milestone B decisions (made Nov 3)

- **Autonomy:** 0 Newbie waits for orders, 1 Solid keeps going at its station, 2 Veteran moves to eligible department work within the current shot. Nobody changes shot order, spends money, starts risky perishables or calls ACTION. Assist Mode raises the floor to 1 and never lowers a veteran. The player always stays busy; better crew means less micromanagement, not less play.
- **Small problems:** each costs something different (quality, or time, or a time/money/quality choice), never all three by default. Real time with in-world warnings and quick choices. Full-screen cards only for major chaos.
- **Losing:** yes. Successful, compromised, or hard-stop failure, with advance warnings and recoverable money and reputation costs. Keep the hard-stop framework and rebalance it.
- **Orientation:** leaning portrait HQ and landscape shoot, pending the Layout Lab. No assets get converted until it is reviewed.

## Waiting on Tomás

- [ ] **Play the Layout Lab** in both layouts on your phone and pick the shoot orientation.
- [ ] **Small calls in Milestone-B-Plan.md:** narrowing veterans to the current shot, hard-stop warning timing, what counts as a compromised delivery.

## Next steps

See Milestone-B-Plan.md for the full sequence. In short:

1. **Orientation:** apply the Lab winner to the shoot screen only.
2. **Queues and small problems:** up to 3 queued tasks per person, real-time problems with the three consequence types.
3. **Walking:** walk time from the parked branch (not its economy), puppets read positions from the engine.
4. **Controls polish:** idle bell, queue pips, the Lab's station highlights.
5. **Content:** split the Burger Job into 25 to 35 short tasks, tuned to 3 to 5 minutes.
6. **Failure:** compromised delivery and hard stops with warnings.
7. **Tiers in the real game:** autonomy comes from who you hire, plus the Assist Mode setting.
- **Art test batch from ChatGPT** can land any time: drop it into `art/` and rebuild.

## How development works

- **Building:** Claude sessions like this one write the code, run the tests and publish a playable link. Tomás plays it on his phone and gives notes.
- **Testing:** use the phone QA checklist in README.md, plus the automated sim tests (`node --test`).
- **Code storage:** https://github.com/PrettyGoodProductions/thats-a-wrap (private). This is the source of truth. Every session starts by attaching and cloning it, and ends by pushing. Owned by the PGP account. tomasPSAA, the GitHub login connected to claude.ai, is a collaborator, and the Claude GitHub App is installed on the repo.
- **Code branches:** `master` is Milestone A. `milestone-b-lab` is the autonomy engine slice and the Layout Lab, in review. `wip/crew-depth` holds parked engine work: walking time, organization, leadership, chemistry, specialties, take review, the 8 AM to 6 PM day clock and the $28,000 economy.
- **iOS path, later:** Apple Developer Program ($99/year), then Capacitor, Xcode, TestFlight beta, App Store.

## Working preferences

- Avoid em-dashes. Keep writing concise and natural.
- The concept images (HQ and shoot set) are the style guide. Upload them to this project in claude.ai so future sessions can see them.
