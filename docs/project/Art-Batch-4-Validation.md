# Art Batch 4: wall, floor, flats, set dressing, HUD pieces

Batch 4 is 37 approved masters (approvals 33 to 69). The set is now almost entirely delivered art. The HUD stars, pause bars and shot-list marks are art too.

**Result: everything wired works on the landscape shoot. 95 of 95 unit tests, 28 of 28 bench checks, the art e2e and the Layout Lab runs in landscape, portrait and rotated landscape pass.** The HUD frames are sliced and wired too (below).

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

## HUD nine-slices (added the same day)

The cream panel, job tag, dark chip, crew card, coral button and polaroid frame are sliced and wired. Each piece's `art/<id>.json` holds `nine`: the slice insets in exported px and the CSS widths. The game turns them into `border-image` rules at startup (`installNineSlice` in `src/ui.js`), so an element with no art keeps its CSS frame.

| Piece | Used for | Corner size (CSS px) |
| --- | --- | --- |
| `ui.panel` | Shot list tab and pop-up | 14.6 |
| `ui.tag` | Job name | 10.4 |
| `ui.chip-dark` | Budget, time and stars | 10.4 |
| `ui.crew-card` | Crew portraits, one pre-tinted file per department (camera, lighting, art, grip) plus the neutral default | 6.6 |
| `ui.button-paper` | Pause and the pop-up close button. This is the coral-orange button, which replaces the cream one | 5.1 |
| `ui.polaroid` | Shot thumbnails. The frame's window is wider than the old 40 x 31 photo (about 1.64 to 1), so thumbnails crop to 42 x 25.6 | 1.9 top and sides, 8.1 bottom |

The insets were read off the corners' curves, the frames were cropped to the paper, and the crew card tints keep the paper grain (each channel is scaled so the paper's median color becomes the department color). Corners stay at their CSS size at any element size, so the tablet layout stretches only the straight edges. All pieces export at 4 px per CSS px, 0.4 MB in total.

Two small fixes came with it. The shot list pop-up now sits above the quest line and ACTION (a shared rule gave it z-index 5, which outranked its own 7). The pipeline check no longer divides by zero on tiles drawn through an SVG pattern.

Audit note: `ui.button-paper` is flagged for a darker orange rim (-38 luminance). It reads as the button's cut-paper edge, so it ships as is.

## Open

The polaroid window shape: if you want the old 40 x 31 photo ratio, the window needs to be re-cut to about 1.29 to 1 and the polaroid re-sliced.

## Not in this zip

Fill beam, meter track and fill, time segments, station badge, bubble, progress ring, card frame, chaos icons, department icons, ACTION clapper parts, status dots, set condition checks.
