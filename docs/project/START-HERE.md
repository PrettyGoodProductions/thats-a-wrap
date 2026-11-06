# That's a Wrap! Start Here

Status and context for anyone (or any Claude session) picking up the project. Updated Nov 5, 2026.

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

## Milestone B (in progress, Nov 3)

- **Playable link (Milestone B build, version 14, Nov 5: landscape HQ and the batch 8 characters):** https://claude.ai/artifact/RGUa3UpsSninEw3HBngVRE. Start a shoot from the office and it plays in landscape. Hold the phone sideways, or upright and the game turns the shoot for you
- **Branch:** `milestone-b-lab` holds all Milestone B work, including the landscape layout, the art loader, Ro and the walk. `master` is still Milestone A. Clone with `-b milestone-b-lab` to work on Milestone B
- **Engine:** crew autonomy 0, 1 and 2, Assist Mode, and the `canAssign`, `stationTasks` and `idleWork` queries. The default is 2, so the normal game plays exactly as before.
- **Layout Lab:** office screen, "Layout lab" button. The same seeded shoot with everyone waiting for orders, played in portrait or landscape, with interaction metrics saved side by side. Phones locked to portrait get the shoot turned sideways automatically.
- **Tests:** 101 tests pass, including a scripted player that finishes the shoot with every crew member at autonomy 0. A Chrome test bot (`tools/qa_lab_e2e.py`) finishes the Lab in portrait, landscape and rotated landscape with real taps.
- **Finding:** landscape needs no scrolling and keeps the crew and ACTION in view. Portrait pushes the crew tiles below the fold. The current Burger Job gives only about one order every 7 seconds even with everyone on orders, so the task split (C2) is what will create the pace.
- **Plan:** Milestone-B-Plan.md has the decisions, the findings and the step-by-step sequence.

## Landscape HQ (Nov 5)

The office is a landscape cutaway diorama: two floors of four bays (Production Office and Lounge, Lobby, Art Dept, Edit, Gear, Garage, one boarded expansion slot), rooms that grow in levels 1 to 3, the van at the curb, city and trees behind, a right-hand panel and a seven-tab bottom nav (Locations, Research and Reputation show as "Soon"). All non-character HQ art is delivered and wired. Spec in HQ-Redesign.md, checks in Art-Batch-7-Validation.md and Art-HQ-Complete-Validation.md. The batch 6 portrait HQ art below is retired, apart from the sky, clouds, sign, van, FOR RENT card, job board and flyer.

## Asset loader (done, Nov 3)

Real art is used wherever a file is supplied and code placeholders stay everywhere else. Drop files in `art/`, run `node build.mjs`, done. File names follow the manifest and an optional `<dept>.<object>.json` holds pivot and scale. Wired so far (batch 3 added the taller platform, sweep and tube, key stand, fill light, camera, lenses, track, frame marks, hero, cheese and sauce props, cheese pot): hero platform, key light head (off, on, dead), burger build stack (5 layers), the modular crew puppet (parts named in the manifest) and four fixed characters, Ro (batch 1) and Mika, Dani and Lu (batch 2). Tested end to end with stand-in images in a real browser, with and without art. See `art/README.md` in the repo.

## Art batch 8 (Nov 5): Client, Agency, Receptionist, Theo

All four are in the game on the shared rig. The Client and Agency stand in video village (the Agency with her own latte), the Receptionist is at the lobby desk, and Theo is the booked art crew on the Burger Job. Eight hand-designed characters are now delivered. Each pelvis was refitted to the width of its legs and its dark leg openings trimmed, and for three of them both arms draw over the torso. A character's settings file can now set its upper body draw order and a prop it always carries. The art bench no longer counts the floor shadow as part of the puppet. Details in Art-Batch-8-Validation.md.

## Crew kit (Nov 5)

New crew are built from kit pieces and recolored. **Crew Kit 01 is delivered and works** (Crew-Kit-01-Validation.md): two bald heads, three hair styles, a cap, a beard, glasses, a tee and shorts. The nine head layers stack as delivered. The body was refitted in code (`tools/fit_kit01.py`) because the first template was too slim, and template A2 in `docs/kit/` is the result. The fitted kit is parked in `art/_kit/`, which the game's packer skips.

`tools/kit_person.py` builds a person from a recipe, recolors it and can bake it into a normal seven-part character. The ten roster members with no art are baked this way in a **separate kit test build** (link below). The main build does not ship kit crew yet: baked people cost about 140 KB each, and everyone wears the one test outfit. The next ask to ChatGPT is Crew-Kit-02-Request.md (faces, hair, trousers, shoes, tops), to send once Tomás approves the lineup in `docs/kit/lineup-12.png`.

- **Kit test build:** https://claude.ai/artifact/BEbG171qg1GqftcqUd2D4s
- **Rebuild it:** `python3 tools/kit_person.py art/_kit bake <copy of art/> roster`, then `node build.mjs --art <that folder> --out <out>`

## Art batch 6 (Nov 5): the HQ set

Zip name "Approved Assets 04". 20 files, all wired: the Edit Bay, Craft Services, Gear Cage and Prep Kitchen in their for-rent, building and built states, the FOR RENT card (the engine prints the price), lobby with the front desk, job board and flyers, street, van, sky and two clouds. A newly built room shows its building picture for about a second and a half. HQ pictures are fitted at 4 px per unit to keep the page under 6 MB. The HQ shell is still parked. Details and the exports still needed are in Art-Batch-6-Validation.md.

## Art batch 5 (Nov 5): rigs, lights, props, village, craft table, HQ sign

Zip name "Approved Assets 03", which is the fifth fitted batch in the repo (the name counts the approvals, not the repo batches). 63 files matched to 40 manifest pieces. Wired: flag, gear pile, the C-stand rig (pole, arm, fork, bottle), key and fill light beams, backlight, dead-light sparks, styling cart, sauce bowl with fill, sparkle, monitor with live screen, two director chairs, craft table, coffee cup, HQ marquee sign (bulbs on and off) and the for-rent Edit Bay. The rest is fitted and parked in `art/_parked/` (HQ shell, HUD extras, steam, held items). Details and the exports still needed are in Art-Batch-5-Validation.md.

## Art batch 4 (Nov 4): wall, floor, flats and set dressing

37 masters fitted. Wired: wall and floor (seamless tiles), all 11 flats, call sheet, poster, both practical lamps (lit), flag, ceiling pipes, both plants, tape marks, cable, floor scuffs, and the HUD stars, pause bars and shot-list check and ring. The cream panel, dark HUD chip, job tag, crew cards (tinted per department), coral button (replaces the cream paper button) and polaroid frame are sliced and wired as nine-slices. See Art-Batch-4-Validation.md.

## Art batch 3 (Nov 4): props, lights, camera

29 approved masters fitted and wired. Wall flats, floor, grid, practicals, call sheet and poster were not in this delivery and still use code art. Details and the one re-export (camera bottom margin) are in Art-Batch-3-Validation.md.

## Art batch 2 (Nov 4): Mika, Dani, Lu

Character components for the three default-crew characters are in the game on the same fixed rig as Ro, with pelvis. Mika and Dani are in the default shoot (DP and Grip) and walk and work with their own art. Lu is delivered, but the Burger Job lists her as booked, so the art shows only in the Layout Lab bench until she is hirable. Set and background assets are a separate batch. Details, checks and the exact specs for the next export are in Art-Batch-2-Validation.md.

## Docs in this project

| Doc | What it is |
| --- | --- |
| START-HERE.md | This page: status, decisions, next steps |
| Milestone-B-Plan.md | Milestone B decisions, what the Layout Lab found, and the build sequence |
| Shoot-Day-Active-Play-Proposal.md | How the sim becomes Overcooked-style active play (Milestones B and C) |
| Content-Roadmap.md | The level backlog, HQ growth ideas, the reusable art library, the set and studio parts list, and the crew component kit |
| HQ-Redesign.md | The landscape diorama HQ: rooms, levels, geometry, art pieces and screen layout |
| Art-Handoff-Nov5.md | Art status and the asks for ChatGPT (revision 3): Crew Kit 02 and the studio shell kit |
| Crew-Kit-01-Request.md | The crew kit test batch as asked of ChatGPT (delivered) |
| Crew-Kit-01-Validation.md | What came back, how it was fitted and tested, and what to correct |
| Crew-Kit-02-Request.md | The next kit batch for ChatGPT: faces, hair, trousers, shoes, tops, drawn to template A2 |
| Asset-Manifest.md | Every art piece, with its layers, pivots, states and what drives it. The spec for final art |
| Art-Batch-1 to Art-Batch-8-Validation.md, Art-HQ-Complete-Validation.md | What each art delivery was fitted to, how it was checked, and what needs a different export |
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
- **Orientation (locked):** the shoot is landscape: a full-screen wide set with a floating paper HUD (status bar, crew portraits, shot list pop-up, quest line, ACTION). See Milestone-B-Plan.md
- **HQ orientation (changed Nov 5):** HQ is landscape too, so the phone never turns between screens. It is the cutaway diorama in HQ-Redesign.md. This replaces the Nov 3 call that HQ stays portrait.

## Content and library decisions (made Nov 5)

- **Art library:** parts drawn once, variants derived by scripts, scenes and crew assembled from data. Details in Content-Roadmap.md.
- **Level identity:** each tabletop level gets its own palette, layout, room, hero and signature stations, dressing pack and light mood.
- **Recolor:** works on whole single-color pieces (the flats, approved by Tomás) and on one color area inside a piece (skin, hair, a garment). Art needs flat, clearly different colors per area, not grey versions or masks.
- **Art pipeline:** ChatGPT makes the art. Claude writes paste-ready requests, Tomás pastes them. Calling an image model from Claude is parked.
- **Characters:** eight hand-designed characters are delivered (Ro, Mika, Dani, Lu, Client, Agency, Receptionist, Theo). Everyone else comes from the crew kit: bald base heads, hair and hats as layers, tops and bottoms on one mannequin, recolored by the game. Crew Kit 01 proved it. One body build. No more one-off characters are planned.
- **Backlog:** the level and HQ ideas in Content-Roadmap.md are the content backlog. Suggested first four after the burger: beverage, e-comm flat lay, fashion lookbook, rooftop.

## Waiting on Tomás

- [ ] **Approve the kit look:** `docs/kit/lineup-12.png` and the kit test build on a phone. Then send Crew-Kit-02-Request.md and the Crew Kit A2 zip to ChatGPT.
- [ ] **Content-Roadmap.md calls:** the first four levels, and whether kit crew wear their department color.
- [ ] **Look at the batch 8 characters** in the published build: video village and the lobby.
- [ ] **Play the landscape shoot** on your phone and send notes.
- [ ] **Small calls in Milestone-B-Plan.md:** narrowing veterans to the current shot, hard-stop warning timing, what counts as a compromised delivery.

## Next steps

See Milestone-B-Plan.md for the full sequence. In short:

1. **Orientation:** done. The shoot is landscape.
2. **Queues and small problems:** up to 3 queued tasks per person, real-time problems with the three consequence types.
3. **Walking:** walk time from the parked branch (not its economy), puppets read positions from the engine.
4. **Controls polish:** idle bell, queue pips, the Lab's station highlights.
5. **Content:** split the Burger Job into 25 to 35 short tasks, tuned to 3 to 5 minutes.
6. **Failure:** compromised delivery and hard stops with warnings.
7. **Tiers in the real game:** autonomy comes from who you hire, plus the Assist Mode setting.
- **Library groundwork** (needs no new art, see Content-Roadmap.md): code audit, manifest as a catalog the game reads, burger set as the first scene recipe.
- **More art** can land any time: drop it into `art/`, fit it with `tools/prep_art.py` and a batch map, and rebuild. Next deliveries expected: Crew Kit 02 and the studio shell kit (both in Art-Handoff-Nov5.md).

## How development works

- **Building:** Claude sessions like this one write the code, run the tests and publish a playable link. Tomás plays it on his phone and gives notes.
- **Testing:** use the phone QA checklist in README.md, plus the automated sim tests (`node --test`).
- **Code storage:** https://github.com/PrettyGoodProductions/thats-a-wrap (private). This is the source of truth. Every session starts by attaching and cloning it, and ends by pushing. Owned by the PGP account. tomasPSAA, the GitHub login connected to claude.ai, is a collaborator, and the Claude GitHub App is installed on the repo.
- **Code branches:** `master` is Milestone A. `milestone-b-lab` is the autonomy engine slice and the Layout Lab, in review. `wip/crew-depth` holds parked engine work: walking time, organization, leadership, chemistry, specialties, take review, the 8 AM to 6 PM day clock and the $28,000 economy.
- **iOS path, later:** Apple Developer Program ($99/year), then Capacitor, Xcode, TestFlight beta, App Store.

## Working preferences

- Avoid em-dashes. Keep writing concise and natural.
- The concept images (HQ and shoot set) are the style guide. Upload them to this project in claude.ai so future sessions can see them.
