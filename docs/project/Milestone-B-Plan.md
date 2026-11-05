# Milestone B: Plan and First Interaction Test

Nov 3, 2026 · @Tomás Valladares

Hands-on crew direction, in steps small enough to playtest. This doc records the decisions, what is already built, what the first experiment found, and the order of work from here. All Milestone B work lives on the branch `milestone-b-lab`.

## Decisions locked (Nov 3)

| Question | Decision |
| --- | --- |
| Crew autonomy | Three tiers. **0 Newbie** finishes what it is given and waits. **1 Solid** keeps going at the station it is working at. **2 Veteran** picks eligible work in its department. Nobody changes shot order, spends money, starts risky perishables early or calls ACTION. Assist Mode raises the minimum to 1 and never lowers a veteran |
| Small problems | Different problems cost different things: some only quality, some block progress and cost time, some offer a choice between time, money and quality. Never all three at once by default. They happen in real time without pausing, with an in-world warning and a quick contextual choice. Full-screen interruptions stay for major chaos |
| Shoot failure | Real failure is possible: successful, compromised, or hard stop. Hard stops get advance warnings. The cost is real but recoverable (money and reputation). Keep the hard-stop framework and rebalance it for manual assignment |
| Departments | Each crew member works only their own department's tasks: art does art, camera does camera. Choosing who goes where is part of the challenge |
| Orientation | **Landscape shoot** (locked Nov 3, evening). HQ went landscape too on Nov 5, see HQ-Redesign.md. The shoot screen is the full-screen wide set with the pop-up HUD described below, in every shoot, not only the Layout Lab. On a phone held upright the game turns the shoot sideways itself. The Lab keeps its portrait run for comparison only |

## What is built so far (branch `milestone-b-lab`)

**Engine slice (B1, first part).** Per-crew `autonomy` 0, 1 or 2, with `opts.autonomy` (a number, or `'tier'` to derive it from Veteran, Solid or Newbie) and `opts.assist`. The default is 2, which is exactly today's behavior, so the live game and all 33 earlier simulation tests are unchanged. New queries: `canAssign(crew, station)` returns go, slow, busy or no with the reason, `stationTasks`, and `idleWork`. Choosing a repair on the chaos card now counts as the order for a crew member who would not pick it up alone.

**Tests.** 74 passed at this point (14 new); 95 now. They include a scripted test player that finishes the whole shoot with every crew member at autonomy 0, in all six shot orders, with a slow 2 second reaction, and deterministically. I also broke the engine on purpose twice to confirm the tests fail when they should.

**Layout Lab.** Office screen, "Layout lab" button. One seeded shoot, same crew, everyone at autonomy 0, played once in portrait and once in landscape. It measures orders per minute, wait for an order, crew idle share, taps per order, dropped selections and refused orders, plus the real pixel size of everything you tap on your device. Results save per layout and show side by side. Stations light up green (go) or red (can't, tap for the reason) once someone is selected, plus amber (half speed) on levels that allow help across departments, and crew with work available but no orders show a "?". If a phone is locked to portrait, landscape turns the shoot sideways itself (turn the phone counterclockwise, or tap Flip).

**Merged in from master (Nov 3, later).** The asset loader, art batch 1 (platform, key light, Ro the Gaffer on the fixed-character rig) and the removal of the set-wide paper texture.

**Walk (part of B2, rendering only).** `src/walk.js` replaces the fixed 0.9 second slide. Crew walk at one speed in game time, with a whole number of steps per trip so the last step lands on the mark. Each step has four stepped poses: contact, down, passing, up. The planted boot stays on its spot and rolls on its own outline instead of sinking or sliding. The advancing foot lifts a little, the bob is only what keeps the planted foot on the floor, and the arms swing gently against the legs. Trips start and end in the idle pose, the walk pauses with the game, and 2x walks faster. The engine still has no walk time, which step 3 adds.

**Hero contact point.** The platform's settings name a `contact` point on its lid. The burger sits there, and the frame marks, sparkle, pour, rig and beam ends move with it. Batch 1's flat box drops the burger 30 units. The Asset Manifest has the spec for a taller box (112 x 76, lid center at y 128).

**Landscape shoot: full-screen set with pop-up HUD.** In landscape the set is recomposed wide and covers the whole screen. The stage keeps its place, the walls and floor run on to both sides, video village moves to the left and the craft table to the right. Screens of other shapes show more set, never empty bands.

The HUD floats on the set in small paper pieces:
- **Top:** a thin status bar with the logo, job tag, budget and spend, time of day with hour segments, stars on track and pause.
- **Left edge:** crew portraits colored by department, each with a progress strip.
- **Right:** a shot list tab that opens as a pop-up with the shot rows, task icons and set conditions.
- **Under the top bar:** a one-line quest tracker.
- **Bottom right:** ACTION.

Task prompts pop up on the set: a "?" over anyone waiting for orders, bouncing over the one the next step needs. Portrait is unchanged. The Lab bot finishes the shoot on an 844 x 390 phone, a rotation-locked phone and a 1280 x 800 tablet.

**Departments only.** A level setting, `departmentsOnly`, on for the Burger Job. Nobody takes another department's task: an order across departments is refused with the reason ("Build tabletop is grip work. Ro only does lighting"), a station offers a person only their own department's work, and while someone is selected the other departments' task icons fade. The half-speed help rule (`crossDeptRate`) stays in the engine for levels or perks that allow it. 95 tests pass, including the scripted player wrapping every shot order at every autonomy level with nobody out of department.

**Set texture.** No surface texture is drawn over the set or any group of pieces. The last leftover was the "cut" filter's noise-driven edge wobble, which also warped the delivered key light; it now keeps only the soft paper shadow. The striped backdrop flat is a flat color until its art arrives. Texture lives inside each asset. (The batch 1 set screenshot with the strong texture was taken six minutes before the set-wide grain was removed.) The UI page behind the game keeps its faint kraft paper background.

**Walk fix.** If a crew member's mark changed to a spot within a nudge of where a walk had reached, the walker snapped there but stayed "moving" and crashed on the next frame (about 1 run in 6 with stand-in art). It now ends the walk. A regression test covers it. A second walk built in parallel (branch `art-walk-polish`) is superseded by this one and kept only for reference.

**Layout pass (Nov 3, evening).**
- **Walk:** the stride is shorter (10 units, widest leg angle about 11°) and the upper body leans less, so the pelvis stays a steady center.
- **Station highlights:** while someone is selected, each station badge gets a small green, amber or red marker, and only the best spot gets a thin light outline. The big colored rectangles are gone.
- **Craft table:** the idle spots at crafty are spread out and staggered in depth. In landscape the set shows only one "?" (for the next step) and "!" for anyone blocked. Others waiting pulse on their crew cards.
- **Safe area:** the set's working frame fits between the crew portraits, the status bar, the ACTION column and a bottom margin, so nobody you tap is cut off or under a control. The camera push-in is off in landscape.
- **Lights:** the key beam starts at the lens (named points on the light art) and follows the aim. The beams are blurred and dimmer, and the rolling spotlight is a soft oval centered on the burger.

**Ro's pelvis.** A new pelvis part (shorts) sits between the shirt and the legs, and the new rounded-top legs hinge inside it. All of Ro's parts share one 27 px per unit master. He is about 51 set units tall with the cap.

**Landscape is the shoot (Nov 3, late).** Starting a shoot from the office now opens the landscape layout, not only the Layout Lab's landscape run:
- the wide set covering the screen inside the safe area
- the floating paper HUD: status bar, crew portraits, shot list pop-up, quest line, ACTION
- in-world pop-ups and small station markers
- the soft, lens-anchored lights and the walk with the pelvis

On an upright phone the shoot is turned sideways for you, and the pause menu has a Flip button if it comes out upside down. HQ, hiring and the office were portrait at this point (HQ went landscape on Nov 5). A full shoot with Ro hired passes held sideways and upright, the Lab bot passes portrait, landscape and tablet, and 95 tests pass.

**Branches folded in or superseded.** This branch has everything from the landscape and art work on Nov 3:
- **`feature/landscape-shoot-layout`:** the layout adopted from the ChatGPT prototype review. It is superseded by the wide set and pop-up HUD here. Its open ideas are in the backlog below.
- **`art-walk-polish`:** a parallel walk, superseded by `src/walk.js`.

Neither needs merging.

## What the experiment found

A test bot played all three setups with real taps (portrait 390x844, landscape 844x390, landscape on a locked-portrait phone). Every run finished, every target was tappable, and the chaos card fit. These facts are measured. How each layout **feels** is only yours to judge, because the bot has no thumbs.

| | Portrait | Landscape |
| --- | --- | --- |
| Scrolling needed to see everything | 63 px at 844 tall, more with browser bars | 0 |
| Set scale (px per set unit) | 0.94 | 0.91 |
| Crew tap target on the set | 45 x 68 px | 44 x 66 px |
| Crew tile | 81 x 108 px | 96 x 145 px |
| Task icon | 34 px | 34 px |
| ACTION button | 105 x 100 px, over the set | 198 x 76 px, under the right thumb |

- **Portrait pushes the crew tiles below the fold.** In a hands-on game the crew are the main thing you tap, and they sit off screen even on a tall phone.
- **Landscape keeps the set almost as big** (0.91 against 0.94) because the HUD sits over the ceiling band. The set was composed for portrait, so it letterboxes about 33 px each side. Wide art would use that space, so landscape will only get better with the real art.
- **Landscape costs a redesign of the chaos card.** The default card was taller than a landscape screen and cut off the third option. It now lays out as three columns.
- **Same tap counts in both** (2.2 taps per order), as expected. A bot cannot tell us about thumb reach or mis-taps. That is what the Lab's own numbers will show once you play.

**A second finding that matters more than orientation.** With every crew member waiting for orders and a bot reacting within 1.5 seconds, the current Burger Job produces only 13 orders in about 89 seconds, one every 7 seconds. The target is a decision every 2 to 4 seconds. Autonomy levels make the player necessary, but they do not make the player busy. The task split in C2 (25 to 35 shorter tasks, carrying, two-person jobs) is what creates the pace, so it should not wait until the end.

**Not tested, and worth knowing:** real thumbs, how iOS Safari's toolbars change the usable height, notch safe areas on your phone, and how the Claude app's viewer handles rotation.

## Implementation sequence

Each step ends at something you can play. We only move on after a review.

| Step | Scope | Gate |
| --- | --- | --- |
| **0. Done** | Autonomy engine slice, Layout Lab, tests | Done |
| **1. Orientation, done** | Landscape is the shoot screen: wide set, pop-up HUD, safe area, chaos and wrap cards laid out for landscape. HQ was portrait at this step and went landscape on Nov 5. The portrait shoot remains only in the Layout Lab | Play it on your phone held sideways |
| **2. Queues and problems (B1b)** | Task queue of up to 3 per person (do it now, or add to the queue), long-press to clear. Small problems in real time with the three consequence types, shown as in-world markers with countdown rings. Level 2 narrowed to "within the current shot" as decided | Test player still finishes. Playtest 1 |
| **3. Walking (B2)** | Port only the walk-time logic from `wip/crew-depth`, not its economy. Puppets read their position from the engine each frame. Walk cycle and work poses. Distance becomes a real decision | Crew visibly walk. Tests for walk time |
| **4. Controls polish (C1)** | Idle bell (jumps to the next idle person), queue pips, bigger targets, and the highlights now prototyped in the Lab | Two taps per order holds on a phone |
| **5. Content (C2)** | Split the Burger Job into 25 to 35 short tasks. Carrying, two-person jobs, peak windows for food. Tune to 3 to 5 minutes | Orders per minute and idle time measured in the Lab. Playtest 2 |
| **6. Failure (B3)** | Compromised delivery and hard-stop failure, advance warnings, rebalanced stars and costs, recoverable money and reputation consequences | A failed shoot can be recovered from |
| **7. Tiers in the real game** | Autonomy comes from the crew you hire. Assist Mode setting. Hire cards show it | Hiring choices change how the shoot plays |

Why queues and problems come before walking: they are the first things that make you busy, and they are cheap to test with the code-drawn puppets. Walking is mostly a rendering change plus one engine rule, and it benefits from knowing the orientation first.

## Backlog from the ChatGPT prototype review

These are ideas from `ChatGPT-Landscape-Prototype-Review.md` that still need a decision. Each fits a step above:
- **Client review loop after a take** (approve, or a note leading to a retake or a quality penalty). Fits step 2 as a small problem.
- **Rush crew** ($600 for 20 seconds of faster work) as a money-for-time button. Fits step 2.
- **Freshness countdown on perishable shots** ("FRESH FOR 23s", then "STALE -20") with an art refresh action. Fits step 5.
- **A "turn your phone" hold screen.** Not needed: an upright phone turns the shoot sideways instead.

## Open questions

- **Level 2 scope.** Today a veteran can pick work for any shot. Your note says within the current shot. I plan to narrow it in step 2 unless you object.
- **Hard-stop warnings.** My default is a warning at 30 and 10 seconds before the hard stop, with the day bar turning red. Tell me if you want it gentler or harsher.
- **Compromised delivery.** My default is all three shots captured but average quality under 60 percent, with the client paying a reduced rate.
- **Lab seed.** Every Lab run uses the same crew and seed so only the layout changes. If you would rather vary the crew, say so, but the comparison gets noisier.
