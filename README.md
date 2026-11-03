# That's a Wrap!

Single-player production-management game for phones. You run a small crew through a tabletop commercial shoot: get the shots, make the day, keep the client happy.

Current build: **visual prototype**. Hiring with budget trade-offs, a paper-cut set where you watch the crew work, the key light chaos event, money, stars, and a wrap report. Art is drawn in code as placeholder (`src/art.js`).

Flow: title, your production office, job board, hire crew, shoot, wrap report, back to the office.

The office is a cutaway building. Profit from each job goes into the bank, and you spend it on rooms that change shoot day:

| Room | Cost | Effect |
| --- | --- | --- |
| Craft Services | $800 | Everyone works 8% faster |
| Prep Kitchen | $1,200 | Food stays fresh 40% longer, art works 15% faster |
| Gear Cage | $1,500 | A dead light becomes a free 2-second swap |
| Edit Bay | $2,000 | +10 quality on every shot |

Progress saves in the browser on that device only.

## Prototype 0.2, Milestone A (current)

The Burger Job set is now the game board. Everything on it is a separate SVG object whose state comes from the simulation:

- **Grip** carries the red hero platform in from the gear pile, unrolls the sweep from its tube, raises the flag, then builds the cheese and sauce rigs piece by piece.
- **Electric** wheels the key light from the wall to its mark, aims it, switches it on, and re-aims it for each setup. A fill light goes up during the hero setup, and the backlight lowers from the grid for the sauce pour. During chaos the light stays dark until it's actually fixed.
- **Camera** dollies to a new mark for each setup and swaps to a macro lens for the close-ups. Framing marks appear as the DP frames, and the video village monitor goes from color bars to the live shot.
- **Art** builds the burger layer by layer on the art table, then carries it to the platform.
- **Workstations:** each has a badge whose ring shows progress (red when blocked). Tap a station with nobody selected to see its task, crew, progress and blocker. Tap empty space to deselect.
- **ACTION:** house lights dim, a spotlight lands on the burger, and the camera pushes in.
- **Concept art in use:** the logo, the three shot thumbnails and a paper-grain texture are cut from `refs/concept-shoot.png` by `tools/extract_assets.py` into `src/assets.js`.
- **Company name** is editable from the office (tap the name).

The simulation is unchanged except for a read-only `stationInfo()` query. All motion follows sim state, quantized into stop-motion steps.

### Phone QA checklist

Run on an iPhone-sized screen (390x844) in portrait.

- [ ] Title shows the logo. Office loads, and tapping the company name renames it, which survives a reload
- [ ] Job board, brief and hire flow work. Referral and crew board buttons reveal art candidates
- [ ] Shoot: the whole set is visible without horizontal scroll, and nothing important sits under the status ribbon
- [ ] The platform slides in, the sweep unrolls and the flag goes up as the grip works
- [ ] The key light rolls in, aims and switches on. The fill light appears
- [ ] The burger builds on the art table, then travels to the platform
- [ ] The camera moves between setups and the lens gets longer for the cheese and sauce shots
- [ ] Tap each station with nobody selected: the card shows the right task, crew and blocker. Tap empty space to close it
- [ ] Select a crew member, tap a station: they're assigned. Tap empty space: deselected
- [ ] Key light failure: the light goes dark and the light badge turns red. It stays dark until the chosen fix completes
- [ ] ACTION: lights dim, spotlight, push-in, clapper. The shot row shows the quality stamp afterward
- [ ] Wrap report, bank update, and building a room all work
- [ ] Reduced motion setting stops the looping animations

`wip/crew-depth` (git branch) holds parked engine work for later milestones: walking time, organization, leadership, chemistry, specialties, take review, the 8 AM to 6 PM day clock and the $28,000 economy.

## Asset loader (real art drops in, placeholders stay)

Delivered art goes in `art/` (see `art/README.md`). `node build.mjs` packs it, and the game draws a real image wherever a file exists and keeps the code-drawn placeholder everywhere else. Swapping or adding art never needs a code change, only files plus an optional small `<dept>.<object>.json` for pivot and scale.

- **Wired now:** `grip.platform`, `elec.keylight-head` (off, on, dead), `art.burger-build` (5 layers) and the modular crew puppet (`crew.*`).
- **How it stays safe:** a piece with no art is untouched. A half-delivered puppet is ignored until its required parts all exist. A key light with no `dead` image shows the code-drawn head for that state.
- **How it stays fast:** each image is defined once and drawn with `<use>`. State changes (key light, puppet pose) only toggle display, driven by the simulation. No per-frame rebuilding.
- **Testing:** `tests/loader.test.js` covers it. `python3 tools/make_standins.py` regenerates the rough stand-in images in `tests/fixtures/art/`. `tools/qa_art_e2e.py` plays a whole shoot in Chrome with and without art (see its header).

## Milestone B, first slice (branch `milestone-b-lab`)

Crew now have an **autonomy** level: 0 waits for orders, 1 keeps going at its station, 2 picks eligible work in its department (the original auto crew, still the default, so nothing changes unless a run opts in). `createGame(level, { autonomy: 0 | 1 | 2 | 'tier', assist: true })`. New engine queries: `canAssign`, `stationTasks`, `idleWork`. See `docs/project/Milestone-B-Plan.md` for the decisions and the sequence of work.

**Layout lab:** office screen, "Layout lab" button. Plays one seeded shoot with every crew member at autonomy 0, in portrait or landscape, and measures the interaction (orders per minute, wait for an order, idle share, taps per order, real pixel sizes). Lab runs never touch the bank. To test it in a real browser with real taps:

```bash
node build.mjs
python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab port       # portrait 390x844
python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab land       # landscape 844x390
python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab land-rot   # landscape on a portrait-locked phone
```

## Run it

You need [Node.js](https://nodejs.org) 18 or newer for the build and tests. Playing needs only a browser.

```bash
node build.mjs        # makes dist/index.html, packing any art in art/
node build.mjs --art tests/fixtures/art --out /tmp/standin   # build with the stand-in art
node --test           # runs the simulation tests
```

Then open `dist/index.html` in any browser. On a phone, use the published link.

After editing anything in `src/` or `data/`, run `node build.mjs` again and refresh.

## Folder map

| Path | What it is |
| --- | --- |
| `data/burger-job.js` | The level: crew, shots, tasks, durations, dependencies. Edit this to tune. |
| `src/sim.js` | All game rules. No drawing code. Runs in the browser and in Node. |
| `src/assets.js` | Generated pieces of the concept art (logo, shot thumbnails, paper grain). Rebuild with `python3 tools/extract_assets.py`. |
| `src/loader.js` | Runtime for delivered art: slots, state swaps, the modular puppet. |
| `src/slots.js` | Where each piece of art attaches (anchors, default pivots, puppet joints). |
| `tools/pack-art.mjs` | Scans `art/`, validates names and settings, builds the pack the page loads. |
| `art/` | Drop folder for delivered art. See `art/README.md`. |
| `src/art.js` | Placeholder art drawn in code: crew puppets, props, the set, the office building. |
| `src/ui.js` | Screens (title, hire, shoot, wrap). Draws the sim state and sends player commands. |
| `src/page.html` | Page markup and styles. Script tags are filled in by the build. |
| `build.mjs` | Inlines everything into one HTML file. |
| `tests/sim.test.js` | Rule tests and soft-lock fuzzing. |
| `HANDOFF.md`, `style-guide.png` | Creative brief and visual reference. |

## How the simulation works

Time runs in fixed ticks, 10 per second. The same level and the same commands at the same ticks always produce the same result, which keeps tests reliable and replays possible.

Every tick, in order:

1. **Assignment.** Each crew member keeps their current task, follows a manual override, or picks the best eligible task in their own department.
2. **Stage claim.** The first stage task started locks the tabletop to that shot until it's captured.
3. **Work.** Each task gains progress from everyone on it: 1x in their department, 0.5x outside it.
4. **Perishables.** Finished perishable tasks (melted cheese) go bad after a set time and need a shorter redo.
5. **Capture.** After ACTION, the shot rolls for 5 seconds, then it's in the can.

### Crew rules

- **Auto pick:** own department only, never a task someone else has, ranked by shot order, then the longest remaining chain of work, then data order. No randomness.
- **No mid-task switching** on auto. A crew member finishes what they start.
- **Override:** tap crew, tap task. Any department is allowed, at half speed outside their own. The task they were on keeps its progress. When the override task is done, they return to auto.
- **Waiting reasons** are always shown: "Needs Build tabletop", "Stage busy with Hero Burger", "Holding until Cheese Pull is on stage".
- **Perishables** are never started early on auto, only by a player override. Auto play can't trap itself in a melt, spoil, re-melt loop.

### ACTION rules

- ACTION works when every required task of the shot on stage is done.
- Optional tasks (lighting) can be skipped at a quality cost shown on screen before you tap.
- Skipped tasks are marked on the shot and in the log.

### Soft-lock guard

The tests check this every tick of every run: if nobody is working and nobody can pick up work, the shot on stage must be ready for ACTION. It runs on all 6 shot orders and 300 runs of random taps, reassignments and reorders.

## Hiring and money

- Budget is $7,000. Crew day rates come out first. Rentals and overtime ($150 per second past 2:00) come out during the shoot. What's left is profit.
- Each role has a Veteran, a Solid and a Newbie. Better crew are faster (`speed`) and botch less (`reliability`). A botched task loses half its progress, once per task. Botches use a seeded roll, so a replay with the same seed is identical.
- Perks change chaos options: Ro's spare bulb turns a 12s light fix into 5s. Paz keeps food fresh longer. Inés rolls faster.
- Your art network is dry (Vera and Lu are booked). Friends of friends show vouched, fuzzy stats. The crew board is cheap and fully unknown until the wrap report.
- Stars: all three shots, wrap by 2:00, then quality 90%+ with profit of at least $0.

## The Burger Job (current numbers)

| Shot | Task | Dept | Seconds | Needs |
| --- | --- | --- | --- | --- |
| Hero Burger | Build tabletop | Grip | 14 | |
| | Style burger | Art | 18 | (off stage) |
| | Place burger | Art | 4 | tabletop, styled burger |
| | Light the burger (optional, -30) | Lighting | 14 | tabletop |
| | Frame hero | Camera | 8 | burger placed |
| Cheese Pull | Rig the pull | Grip | 10 | |
| | Melt cheese (bad after 25s, 6s redo) | Art | 14 | (off stage) |
| | Re-aim lights (optional, -25) | Lighting | 8 | rig |
| | Frame macro | Camera | 7 | rig, cheese |
| Sauce Pour | Mount bottle | Grip | 10 | |
| | Prep sauce | Art | 10 | (off stage) |
| | Add backlight (optional, -25) | Lighting | 10 | bottle |
| | Frame pour | Camera | 8 | bottle, sauce |

A hands-off run with instant ACTION taps wraps at about 1:24. The 2:00 target leaves room for the chaos event in milestone 3.

## Placeholder asset list (for milestone 4)

- Crew puppets x4 (DP, Gaffer, Grip, Art): idle, working, waiting poses
- Tabletop stage: base, backdrop, flags, light stands, camera on sticks
- Props: hero burger, cheese pull rig with melted cheese, sauce bottle and pour
- Dept icons x4, ACTION clapper, star, clock
- UI paper: torn-edge cards, tape strips, corrugated card texture
- Chaos card: dead key light

## Build plan

1. **Simulation and debug UI** (this build)
2. **Touch controls and portrait HUD:** stage view on top, crew placed on the set, drag to assign
3. **Chaos and scoring:** the key light dies (fix, rent a backup, or bounce card), budget, stars, wrap report
4. **Paper-cut visuals:** the style guide look, stop-motion crew, ACTION moments, wrap replay

## Getting it on the App Store (recommendation)

For a first app, wrap this same web game with **Capacitor**. It packages the HTML into a real iOS app, so the code we're writing now ships as is. You'll need a Mac with Xcode and the Apple Developer account. Switching to Godot later is possible, but it means learning a new engine and rewriting the UI, so only do it if performance or animation needs demand it. We'll confirm after milestone 3.
