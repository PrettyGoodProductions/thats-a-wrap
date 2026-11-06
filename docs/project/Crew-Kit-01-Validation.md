# Crew Kit 01 validation

Nov 5, 2026. Zip "Thats-A-Wrap-Crew-Kit-01-Claude-Test": the 15 pieces asked for in Crew-Kit-01-Request.md at 8 px per unit on full slot canvases, the same at 27, native source crops, assembled reference pictures, a catalog (`metadata/kit.json`), twelve test recipes and a viewer.

**Result: the kit works.** Twelve different people assemble from it, every piece recolors, and ten kit crew walk, work and show on the hire cards in a test build of the game. The head layers are used exactly as delivered. The body needed a refit, which was done in code from the delivered masters with no redraw.

The main build is unchanged. Kit crew are in a separate kit test build so the look can be judged on a phone first.

## What to look at

| Picture | What it shows |
| --- | --- |
| `docs/kit/lineup-12.png` | Twelve kit people next to Ro and Theo, at one scale |
| `docs/kit/before-after.png` | The kit as delivered on template A, and after fit A2, next to Ro and Dani |
| `docs/kit/head-layers.png` | Every hair, hat, beard and glasses combination on both heads |
| `docs/kit/recolor-sheet.png` | Every piece across the skin, hair and clothing palettes |
| `docs/qa/kit01/` | Kit crew in the game: the shoot on a phone and a tablet, the hire cards, a walk strip and a work strip |
| Kit test build | The game with the ten roster crew built from the kit. Link in START-HERE.md |

## File checks

| Check | Result |
| --- | --- |
| Count and names | 15 of 15, named as asked |
| Canvases and pivots | Every file is on its template A slot canvas with the pivot where the template puts it |
| Format | RGBA, straight alpha, no pixel between alpha 1 and 7 |
| Key colors | Found in every piece: skin, hair, top and bottoms each within 9 units of the asked color in Lab. No two areas inside one piece are close to each other |
| Resolution | The source sheet is 1620 x 971 px for all 15 pieces, about 16 px per unit. That is enough for the game's 8. The 27 px masters are upscaled, as the delivery says |
| References | The reference pictures were assembled from the exported files, not drawn first. They show the delivery's own fit and cannot confirm it |

## Head layers: good as delivered

| Check | Result |
| --- | --- |
| Shared canvas | All nine head pieces are 224 x 256 px with the neck pivot at 112, 208 |
| The two heads | One skull, two faces. Head A is young with freckles and an open smile. Head B is older, with smile lines |
| Short and curly hair | Cover the skull on both heads. No scalp shows |
| Long hair | The front piece left a crescent of scalp showing behind the ear, about 3 units wide and 11 tall, because the back piece sits behind the head. **Filled in fitting** from the back piece's own paper (574 px) |
| Cap | Sits correctly on a bald head and over short hair. Curly or long hair pokes through it, so those pairs are excluded, as the delivery says |
| Beard and glasses | Line up with both faces. The mouth shows through the beard |

Small flaws, not fixed, to avoid in new art:

1. The short and curly hair each have a gap of about 1 unit between a forelock and the forehead that shows the background.
2. The beard's sideburn ends in a round knob beside the ear, which reads as a lump on a bald head.

## Body: refitted to A2

On template A the kit body read wrong next to the hand-designed crew, in the delivery's own lineup and in the game's assembly alike.

| Problem on template A | Measured |
| --- | --- |
| Narrow chest under a big head | Chest 9 units wide, head 13.2. Ro's torso is 13.1 under a 15 unit head |
| Hands in front of the thighs | Arms hang straight at 4.2 to 4.9 units from center, inside a 14 unit pelvis |
| Legs read as one mass | Thighs 6.4 wide on hips 5.5 apart, so they overlap by a unit |
| Pelvis stretched | Its source is 231 x 106 px. It was fitted to 14.0 x 9.9 units, 1.5 times taller than wide |

The cause is the template, not the drawing: template A was Theo's body, the slimmest of the delivered ones.

Fit A2 keeps every drawing and changes size and placement only (`tools/fit_kit01.py`, resampled once from the 27 px masters):

| Slot | Change |
| --- | --- |
| Torso | 1.2 times larger: chest 10.6, hem 14.4, height 16.8 units |
| Arms | 1.08 times larger, turned 5 degrees out, each centered on its pivot |
| Legs | 0.9 times, each centered on its pivot |
| Pelvis | As delivered |
| Shoulders | From 4.94 and -4.16 at height 32.8, to 5.8 and -5.8 at height 31.9 |
| Hips | From 2.77 to 3.5 units each side, so the thighs sit side by side |
| Whole person | Drawn at 0.98 of template size, so a person in a cap stands level with Ro in his |

Template A2 in `docs/kit/` is this fit. New kit pieces are drawn to it.

## Recolor: works on every piece

| Area | Pieces | Colors tried | Result |
| --- | --- | --- | --- |
| Skin | Both heads, both arms, both legs | 6 tones, porcelain to deep | Clean. Noses and ear shadows follow the skin. Mouths, eyes and freckles keep their colors |
| Hair | Short, curly, long with its back piece, beard | 6, black to white, plus teal | Clean. Shading inside the hair carries over |
| Top | Tee torso and both sleeves | 8 | Clean. The sleeve and torso match |
| Bottoms | Pelvis and the cuff at the top of each leg | 6 | Clean. Sneakers keep their color |
| Hat | Cap | 6 | Clean |

One thing to check on a phone: on the deepest skin tone, head B's smile line and wrinkles nearly disappear, and both heads' brows get faint. The eyes still read. If it bothers, the fix is in code: darken those lines along with the skin.

## In the game

A kit person is baked into a normal seven-part character (`tools/kit_person.py bake`), so the game shows it with the code it already has. Two small engine additions:

| Addition | Why |
| --- | --- |
| A `hair-back` part | Long hair's back piece hangs from the neck and draws behind the torso and arms |
| The ten roster names registered as characters | Baked files for Bo, Lee, Inés, Sam, Max, Chuy, Vera, Paz, Kit and Jules are drop-in. With no files they keep the code-drawn puppet. Inés finds her files without the accent |

The ten were given kit looks close to the game's descriptions of them, with tees in their department color.

| Test | Result |
| --- | --- |
| Unit tests | 101 pass (2 new) |
| Kit test build in a browser, phone and tablet | Hire cards show all ten with head crops that fit. Lee, Inés and Chuy hired, on set, walking and working next to Lu, the Client and the Agency. No page errors |
| Art bench, first run | Inés 26 of 28 and Bo 25 of 28. The misses were the turn-around reading as a pop (a measuring fault, fixed below), Bo standing 53.6 units tall in his cap against a limit of 53 (fixed by the 0.98 size), and the control puppet sharing a name with a kit person. A rerun on the final build is in progress |

Two fixes to the bench came out of this run. The walk check compared the standing frame with the first walking frame even when the person had just turned around, which scored any one-sided silhouette (long hair, a cap's brim) as a pop. It now compares against the mirrored frame as well. The control puppet was named Paz, who is now a kit person in the test build, so it has a name that is not on the roster.

## Weight

| Build | Art | Page |
| --- | --- | --- |
| Main build, eight characters | 5.5 MB | 8.0 MB |
| Kit test build, plus ten baked kit crew | 7.0 MB | 10.0 MB |

A baked person is about 140 KB. That is the cost of baking: every person carries their own copy of the tee and shorts. When the game stacks kit layers itself, people share files and the 15 kit pieces weigh 0.3 MB in total, however many people there are. That engine work comes before kit crew go into the main build.

## What to tell ChatGPT

No redraw of Kit 01 is needed. For the next batch, in Crew-Kit-02-Request.md:

1. Draw and export body pieces to template A2.
2. Resize a piece by one factor. Do not stretch it in one direction.
3. Size a piece by its slot's guide, not by its own height.
4. Long hair's front piece covers the back of the skull.
5. No gaps in a fringe.
6. Arms hang 5 degrees out.

The delivery format was right and should stay: full slot canvases at 8 px per unit, the catalog, the native sources and the honest validation notes.

## For Tomás to decide

1. Is the kit look approved? See the lineup, and the kit test build on a phone.
2. Is Crew Kit 02 the right next batch: four more faces, hair, a beanie and a beret, jeans, work pants, a skirt, shoes and four tops?
3. Should kit crew wear their department color on top, as in the test build?

## New and changed tools

| Tool | What it does |
| --- | --- |
| `tools/fit_kit01.py` | Fits the delivery to A2 and writes the catalog `art/_kit/kit.json` |
| `tools/kit_person.py` | Builds people from the kit: lineup, recolor sheet, and baking into game characters |
| `tools/make_kit_template.py` | Now writes template A2 from the fitted kit |
| `tools/pack_kit_handoff.py` | Zips the validation, the Kit 02 request, template A2 and the fitted pieces for ChatGPT |
| `tools/qa_pipeline.py` | Knows the roster names. Two measuring fixes, above |
