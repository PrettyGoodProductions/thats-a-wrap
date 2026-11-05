# Art batch 5 validation (zip "Approved Assets 03")

Nov 5, 2026. The zip is named "03" because it is the third approved set. In the repo it is the fifth batch fitted (`tools/make_batch5_map.py`, `tools/batch5.map.json`).

## What was done

- 63 files matched to 40 manifest IDs by sight on contact sheets. Pivots and points were measured from alpha and checked on an overlay.
- Fitted with `tools/prep_art.py` (set props at 6 px per unit, HQ shell at its master scale). `tools/audit_art.py` passes on the whole `art/` folder.
- 20 pieces wired, the rest parked in `art/_parked/` (the packer skips folders starting with `_`).
- Packed art is 5.3 MB, under the 6 MB warning. Heavy pieces (sign, room, craft table) are quantized to 256 colors.
- Tests: 96 pass (one new loader test for three-part room IDs and parked files). `qa_art_e2e.py --expect crew` passes with every driven piece seen up. `qa_pipeline.py` passes 28/28 for Ro and Mika. `qa_lab_e2e.py` finishes in port, land, land-rot and land-tab.

## Wired

| Piece | How it is used |
| --- | --- |
| grip.flag, grip.gear-pile | Replace the code flag and apple-box pile |
| grip.rig-pole, rig-arm, rig-fork, rig-bottle | The C-stand. Pole is a tripod, 46 x 162 units, fitted so the clamp lands at y 58. The pour stream starts at the bottle nozzle point |
| elec.beam, elec.fill-beam | Screen-blended wedges stretched from the light to the burger |
| elec.backlight, elec.dead-fx | Backlight lowers from the grid. Sparks show while the key light is dead |
| art.table, art.sauce-bowl | Cart and bowl. Sauce is a separate fill layer |
| fx.sparkle | Two frames, steps animation (static under reduced motion) |
| village.monitor | The screen is clipped to the inset (53.2 x 28.8 units) and shows color bars, the live shot and the REC dot |
| village.chair | One file used twice, the engine prints CLIENT and AGENCY |
| crafty.table, crafty.coffee | Table with the engine-drawn CRAFTY label. Agency's latte uses the cup |
| hq.sign | Marquee with off layer and animated bulbs on layer, company name drawn in ink |
| hq.room.edit.for-rent | Dark Edit Bay in the office |

## Parked (fitted, not wired)

hq.shell, ui.shot-status next state, ui.time-seg, ui.station-badge, ui.bubble, ui.crew-ring, ui.progress-ring, ui.logo, ui.shot-thumbs, ui.dept-icons, ui.chaos-icons, fx.spotlight, fx.puff, fx.steam, crew.held, crew.shadow, ui.card, ui.quest, ui.meter-track and fill, ui.action. Most of these are blocked by the exports below or need a layout change, not a new file.

## Needs a different export

1. **hq.shell** (blocks wiring). The room openings do not match the layout. Needed: 2016 x 2040 at 6x (336 x 340 units), openings exactly 152 x 112 units at (24,56), (184,56), (24,176), (184,176), and a lobby opening 312 x 84 at (24,296). The delivered shell is 3.58 px per unit with different opening positions.
2. **hq.room.edit** `building` and `built` on the same 912 x 672 canvas as `for-rent`. Same three states for craft, gear and kitchen rooms.
3. **ui.progress-ring**: a track-only file plus a full-ring fill file on one canvas, so the engine can draw the fill.
4. **Grip dept icon** is missing from ui.dept-icons (grip, electric, camera, art, fix are all needed).
5. **crew.held** items need a named grip point each (the sandbag, hammer, gel frame, light head, lens case, plate, tweezers are fitted by centre today).
6. **Cut-paper edges**: confirm the edge on gel-frame, the ui.action stick, set flat-3 and ui.button-paper. They read slightly hard at 2x.
7. **cam.camera** bottom margin (still open from batch 3): 4 px of empty margin below the dolly.
8. **crafty.table** proportions: delivered ratio is 1.97, the manifest spec is 2.5 (150 x 60). It is fitted at 150 wide, so it reads about 25% taller than planned. Either confirm or re-export at 150 x 60.
9. **Rig pole and flag**: tripod feet are wider than the manifest 20 wide. Manifest updated to 46 wide. Confirm.
10. **Fork rod** is a fixed length, so the engine stretches it. Optional: send a 2-frame short and long rod.
11. **Chaos icons**: the hammer was drawn where the manifest says wrench. Confirm which the Fix it option should show.
12. **ui.logo and ui.shot-thumbs**: clean versions were delivered but are not wired. Say if they should replace the concept cut-outs.
13. **hq.sign** has little margin at its edges. Add about 4 px of empty margin.

## Checked and fine

Pivots (pole clamp, arm knuckle, bottle tab and nozzle, monitor screen inset), beam tips, shared canvases for on/off and empty/fill pairs, no stray specks or haze after fitting.
