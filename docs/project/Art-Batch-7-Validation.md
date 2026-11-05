# Art batch 7 validation (Prototype Art 05 and HQ Test 06)

Nov 5, 2026. Two zips: **Prototype Art 05** (17 exports: the re-exports and small HUD asks from the Nov 5 handoff, plus the HQ greybox) and **HQ Test 06** (the new hq.shell and the Art Dept room in every state). Checked independently of the delivery's own validation files. Not yet wired or tested in the game, since the repo was not reachable from the session that reviewed them.

**Result: everything delivered meets the spec and can be wired.** Two small open items (the sign states and a seam to handle in the engine) and one tuning call (crew scale in rooms), below.

## What was checked

Size against the manifest, PNG mode and color profile, alpha haze (1 to 7), clear margins, and registration between states. For HQ: every shell opening against HQ-Redesign.md, room states pixel by pixel, the front layer against the room, and an assembly render of the Art Dept L2 room behind the shell.

## Prototype Art 05

All 17 files are RGBA with an sRGB profile and no alpha haze.

| File | Size | Spec | Result |
| --- | --- | --- | --- |
| ui.chaos-icons.wrench | 132 x 132 | 44 CSS px at 3x | Pass |
| ui.dept-icons.grip | 96 x 96 | 32 CSS px at 3x | Pass. C-clamp, reads as a solid shape |
| ui.check.empty, partial, done | 60 x 60 each | 20 CSS px at 3x | Pass. Shared center (30, 30) |
| ui.progress-ring.track, fill | 84 x 84 each | 14 set units at 6x | Pass. Alpha footprints identical, fill is a full ring |
| cam.camera | 372 x 588 | 54 x 90 units plus 24 px padding | Pass. 24 px clear at the bottom, 34 to 38 elsewhere |
| crew.held (7 items) | 72 x 60, 60 x 48, 84 x 36 | 12 x 10, 10 x 8, 14 x 6 units | Pass. Grip point per item in `held-grip-points.json` |
| hq.sign.off, on | 1320 x 204 each | 220 x 34 units, 4 px margin | Pass on size and margin. See open item 1 |

**HQ greybox (phone and tablet):** delivered as SVG and PNG with `hq-greybox-layout.json`. It follows HQ-Redesign.md: two floors, four bays, the double office, the expansion slot, the van at the garage, the right panel with the phone week strip, and the seven-tab nav. Approved by Tomás on Nov 5, which unlocked the HQ test drop.

## HQ Test 06

| File | Size | Result |
| --- | --- | --- |
| hq.shell | 2712 x 1368 | Pass. All seven openings sit exactly at the spec coordinates and are fully transparent. Everything else is fully opaque |
| hq.room.art.for-rent, building, l1, l2, l3 | 600 x 576 each | Pass. Fully opaque. Ceiling, lamp and upper walls are identical in every state (top 200 px match 100%), so upgrades swap with no jump |
| hq.room.art.front | 600 x 576 | Pass. Table lip, legs and low shelf. Its pixels are alpha 250 to 254, so it hides crew as intended |
| hq.room.art.empty | 600 x 576 | Extra: the bare cavity, kept for building future states |

Each level adds to the one before: L1 shelf and worktable, L2 adds the fridge, hotplate and shelf, L3 adds the miniature set and paper rolls. The look matches the concept: warm wood beams, brick piers, a thick kraft slab with a lit top face, sage and plaster walls, upper-left light.

**Placement** (from the delivery, checked): shell origin (40, 56) in the HQ world. Art Dept at (162, 184), 100 x 96 units. Draw order: room state, crew at 0.6 shoot scale, front layer (L1 to L3 only), shell, room name tag.

## Open items

1. **Sign states are not one master.** The off and on drawings overlap 98% but differ beyond the bulbs, so switching or blinking would make the board jump. Until fixed, show `on` statically. Ask: a **bulbs-only overlay** (`hq.sign.bulbs@6x.png`, 1320 x 204) drawn on the `off` master, so the engine can blink the bulbs over a fixed board.
2. **Shell to room seam (engine, no re-export).** The openings and room canvases meet edge to edge with no overlap. At the scaled sizes on a phone, filtering can show a hairline at the edge. The engine draws each room half a unit larger under the shell to hide it.
3. **Crew scale in rooms (tuning, no re-export).** The tall furniture (shelf, fridge) is about 41 units against 31 for a crew member at 0.6 scale, so crew read a little small. Settle between 0.6 and 0.7 once a crew member stands in the room.

Accepted as delivered:
- The for-rent state keeps the lamp lit, only dimmer.
- The checks and progress ring are flat ink shapes with no paper grain. At 14 to 20 px the grain would not show anyway.

## Corrections to the Nov 5 review

The wrench was already delivered in batch 3 (asset 080). The Nov 5 review said no wrench existed, which was wrong. Art 05 exports that same drawing as `ui.chaos-icons.wrench`.

## Wiring notes

- **cam.camera:** the padding grows the canvas, not the camera. Draw the texture at 62 x 98 units with its top left offset (-4, -4) from the old origin, and add (24, 24) px to existing anchors (dolly base, lens mount). Keep the runtime REC dot.
- **Progress ring:** draw the track, then reveal the fill with a clockwise mask from 12 o'clock, centered at (42, 42) px.
- **Held props:** put each item's grip point on the hand and rotate about it.
- **HQ:** wire the new shell and Art Dept with the order above. Other bays stay greybox until their art arrives. Retired batch 6 HQ art is not wired.

## Next, per the queue

Client and Agency characters, then the remaining HQ cavities (office, edit, gear, lobby, garage, boarded slot), roof, backdrop, sidewalk and street, then the office UI pieces.
