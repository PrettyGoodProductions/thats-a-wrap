# Art Batch 4: wall, floor, flats, set dressing, HUD pieces

Batch 4 is 37 approved masters (approvals 33 to 69). The set is now almost entirely delivered art. The HUD stars, pause bars and shot-list marks are art too.

**Result: everything wired works on the landscape shoot. 95 of 95 unit tests, 28 of 28 bench checks, the art e2e and the Layout Lab runs in landscape, portrait and rotated landscape pass.** Panels, tag, crew card and button are fitted but not wired (below).

## How it was fitted

`tools/make_batch4_map.py` measures each master and writes `tools/batch4.map.json`. `prep_art.py` gained `seamless`, `crop`, `quantize` and `decontaminate` options.

| Piece | Fit |
| --- | --- |
| Wall, floor | 200 x 200 unit tiles at 5 px per unit (1000 px). The masters did not wrap (edge difference above the normal pixel difference), so they are made seamless by blending with a half-shifted copy. Drawn as SVG patterns, so one image covers the whole set |
| Flats 1 to 11 | Fitted by height so the skyline and floor line match the manifest, bottom center on the floor. Widths come out 67 to 104 units, within a few units of the manifest (flats 1 and 5 are about 10% narrower) |
| Practicals | Two IDs, `set.practical-red` and `set.practical-sage`, each with off and on. The set shows them lit |
| Grid | Strip tiled sideways, 200 units per tile |
| Tape, scuffs | Tape is one X used three times with small rotations. Scuffs are one 434 unit sheet placed six times on the floor |
| Cable | Starts at the key light (74, 198) |
| Weight | Paper textures use a 160 to 256 color palette without dithering, which keeps the grain and cuts the files by about 85%. Batch 4 adds 1.8 MB |
| HUD | Stars, pause bars and shot-list check and ring are drawn from the art. The check's green halo is removed (faint alpha under 40 cleared, edge color taken from the solid check) |

## Needs a different export

| File | Problem | Spec |
| --- | --- | --- |
| `cam.camera` (batch 3) | Art touches the bottom edge | At least 24 px transparent margin on every side |
| Backdrop 03 (`set.flat-3`) | The audit flags a darker edge ring (-30 luminance). It reads as a cut-paper edge, so it ships as is. Say if it should be flat | Same drawing without the dark edge, or confirm it is intended |

## Not wired yet, decisions needed

| Master | What it needs |
| --- | --- |
| Cream UI panel (35), job tag (38), dark HUD panel (36), crew card (37) | Nine-slice insets (the manifest gives 10 to 14 px corners) and a CSS change to draw the HUD from them. The edges are hand torn, so the slice has to be measured from the art |
| Coral-orange button (39) | The manifest calls for a cream paper button (`ui.button-paper`). The coral button is not in the manifest. Is it ACTION, the pause button, or a new piece? |
| Polaroid frame (64) | Needs the inner photo window measured, and clean shot thumbnails without a border (still cut from the concept) |

## Not in this zip

Fill beam, meter track and fill, time segments, station badge, bubble, progress ring, card frame, chaos icons, department icons, ACTION clapper parts, status dots, set condition checks.
