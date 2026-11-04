# Art Batch 3: props, lights, camera

Batch 3 is 29 approved masters (design approvals, not exports): hero platform, sweep and tube, key light stand, fill light, track, frame marks, camera, two lenses, hero burger, cheese pull parts, sauce drip and stream, the cart burger stack and the cheese pot. Characters were already in. Wall flats, floor, grid, practicals, overhead flag, call sheet and poster were not in this delivery.

**Result: everything delivered is wired and works on the landscape shoot. 95 of 95 unit tests, 28 of 28 bench checks, the art e2e and the landscape Layout Lab run pass.** One file needs a different export.

## How it was fitted

`tools/make_batch3_map.py` measures each master and writes `tools/batch3.map.json`. `prep_art.py` fits to 6 px per set unit and now supports per-state scale and pivot and a `core` mask for translucent haze (strand 03). `audit_art.py` skips the one-canvas check for parts that are separate pieces (burger layers, strands, lenses, pot).

| Piece | Fit |
| --- | --- |
| Platform | Pivot on the lid contact point, burger base lands within 0.1 units |
| Camera, fill light, lenses | Art faces right, so `flip: true`. Lens flange matches the camera mount ring |
| Sweep | Neutral paper, tinted per shot in game (`Ld.tint`) |
| Hero burger, cheese, sauce | Delivered hero replaces the code burger. Cheese top bun lifts and three strands stretch with the engine lift. Sauce is the hero plus the drip, with a real pour stream |
| Cart stack | Drawn at 0.6 of the hero, so the carry now starts at 0.6 to avoid a size pop |
| Cheese pot | Fill is clipped to the pot opening and rises with melt, tints when spoiled, steam animates in steps |

## Needs a different export

| File | Problem | Spec |
| --- | --- | --- |
| `cam.camera` | Art touches the bottom edge of the canvas (audit FAIL) | Same drawing with at least 24 px of transparent margin on every side, exported at 6 px per set unit (about 333 x 555 now, keep the proportions) |

Everything else can ship as is. Real exports at 6 px per unit would sharpen the lens and strands slightly.

## Not delivered yet

Wall, flats 1 to 11, floor, floor scuffs, grid, practicals, overhead flag, call sheet, poster, fill beam. They keep their code placeholders.
