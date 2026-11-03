# Art Batch 1: Pipeline Validation

Batch 1 covers three groups: `grip.platform`, `elec.keylight-head` (off, on, dead) and Ro the Gaffer as a modular puppet. All three run in the game. They were checked file by file, in a test bench in Chrome, and in a full playthrough.

**Result: the pipeline works. All 25 bench checks and the in-game run pass.** Before more art is produced, the export settings need to change. The table at the end has the exact numbers.

## What was done with the delivery

| Delivered | Became | Notes |
| --- | --- | --- |
| Red box, 1713 x 918 | `grip.platform@6x.png`, 672 x 360 | The canvas already matched the manifest 112 x 60. The pivot is the bottom center of the box, not of the canvas |
| Key light dark / lit / cream, 1609 x 977 each | `elec.keylight-head.off/on/dead@6x.png`, 336 x 204 | Mirrored in settings (`flip`) so the lens faces the set. The pivot is the yoke ring, so the head turns on top of the stand |
| Head, torso, two arms, two legs | `crew.ro.head`, `.torso`, `.arm-front` (hand to the right), `.arm-back`, `.leg-front` (wider leg), `.leg-back` at 8 px per unit | Proportions come from the parts sheet. The assembled render draws Ro about 1.2x larger and is not exact, so it was used only as a visual reference |
| Loose hand, 133 x 147 | Not used | Nothing in the rig needs it yet. Tell us what it is for (holding props, the back arm?) |
| Parts sheet, assembled render | Reference only | |

`crew.ro.*` file names work as given. The loader now understands `crew.<character>.<part>`, so the original prompt names were kept and nothing had to be renamed to `crew.*`.

`tools/prep_art.py` with `tools/batch1.map.json` turns the raw files into the `art/` folder. It cleans stray alpha, resizes and writes the settings files. The originals are not in the repo.

## Fixed-character rig

- Ro's art is shown as delivered: no tint, no face overlays, no hair swap. Only the crew member named Ro gets it. Everyone else keeps their puppet, and the bench checks this.
- Parts hang from Ro's own joints, set in `art/crew.ro.json`. Every part rotates about its joint, and the upper body is one group so a lean carries the head and both arms.
- The animations are temporary and written in CSS by part role. Any future character on the rig moves the same way.
  - **Walk:** legs ±20°, arms swing against them, body bobs, 0.56 s per cycle. It plays while a crew member slides to a new spot.
  - **Work and reach:** the front arm reaches forward and pumps (-68° to -92°), the torso leans 3 to 5°, the back arm braces.
- Hybrid path: a character can later mix its own head and outfit with shared library parts. Pose images such as `crew.ro.arm-front.work@8x.png` drop in with no code.

## Checks and results

`tools/qa_pipeline.py` writes evidence to `docs/qa/batch1/`: GIFs, filmstrips, a key light state sheet, a transparency sheet and the hire portrait.

| Area | Check | Result |
| --- | --- | --- |
| Gameplay scale | Delivered px against drawn device px on a 390 px phone at 2x, a 430 px phone at 3x, an 820 px tablet at 2x, and the hire card at 3x | Sharp everywhere. Headroom on the hardest display is 1.10x (Ro's head on the hire card) to 1.40x |
| Transparency | Corners empty, no halo (file level), shown over white, black, magenta and checker | Pass. Raw files had a faint haze (alpha 1 to 7, about 1 to 2% of pixels) and a few specks. Export now cleans both |
| Platform | Bottom edge on y 192, centered on x 184 | Within 0.05 units. The box draws 104 x 43 against the 112 x 60 placeholder, see below |
| Key light jump | Each state against "off" at aim angles -12, 0, 20 and 34° | As delivered, "dead" was 0.28 units (8 master px) and "on" 0.10 units off. Settings offsets bring this to 0.23 device px or less, so no jump |
| Key light pivot | Rotated art lands where it is drawn, and the pivot sits on the yoke | 0.95 or better overlap, and the pivot is on the art |
| Ro idle | Feet on the mark, height, one connected silhouette | Feet within 0.09 units, 47.1 units tall (the crew average is about 47), no gaps |
| Ro walk, 8 frames | Stays in one piece, feet near the ground, visible bob and swing | Pass. Feet within 2 units, bob 1.1 units |
| Ro work, 12 frames | Arm stays attached through the reach, feet planted | Pass. Reaches 10.9 units forward |
| In game | Ro hired as gaffer, walks to the light, works, key light goes off, on, dead, shoot wraps | Pass, no page errors. Stand-in art and no-art runs still pass, and 67 unit tests pass |

## Findings that need a decision

1. **Weight.** As delivered the batch is 9.7 MB, about 13 MB once embedded, with images 15 to 28 px per set unit. The game needs 6 to 8. The exported batch is 654 KB, with no visible loss at gameplay scale.
2. **Key light states drift.** The housing moves sideways between states. Settings offsets fix it now, but every light state should come from one locked canvas.
3. **Key light faces left.** It is mirrored in settings for now. Draw future lights facing right.
4. **The platform is flatter than the placeholder:** 43 units tall against 60, so its top sits about 15 units lower. Confirm this is intended before the burger and props are placed on top in final art.
5. **The beam and glow are still placeholders.** Their shape was drawn for the old head. Once the light art is final they need a pass to start at the lens.
6. **The loose hand is unused.** What is it meant for?

## Revised export spec (use for the next batch)

| Rule | Spec |
| --- | --- |
| File | PNG-32, sRGB, straight alpha. Transparent background, no glow, no floor shadow (the game adds both) |
| Alpha | Nothing between 1 and 7 (clip to 0), no stray specks, about 4 px clear margin at export size |
| Set props and lights | 6 px per set unit, named `@6x`. Platform 672 x 360, key light head 336 x 204 |
| Puppet parts | 8 px per set unit, named `@8x`. All parts of a character from one master at one scale. For Ro, the master was 25 px per unit and the export is 0.32x of it |
| States | One identical canvas per piece. Anything that does not change stays on the exact same pixels in every state (housing, yoke, stand) |
| Facing | Characters and lights face right, toward the set |
| Pivots | Platform: bottom center of the box. Key light: center of the yoke ring. Head: bottom center of the neck stub. Torso: bottom center of the hem. Arms: center of the sleeve cap. Legs: center of the hip tab |
| Overlap | Keep the neck stub, sleeve cap and hip tab. They hide the joints when parts rotate. Ro's arm cap overlap is what keeps the arm attached in the reach |
| Character names | `crew.<character>.<part>[.<pose>]@8x.png`. Parts: head, torso, arm-front, arm-back, leg-front, leg-back |
| Masters | Larger masters are welcome. Keep them, and `tools/prep_art.py` fits them to this spec |
