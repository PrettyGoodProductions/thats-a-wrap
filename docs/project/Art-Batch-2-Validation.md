# Art Batch 2: Mika, Dani, Lu

Batch 2 is 21 unchanged crops from the approved character sheets: head, torso, pelvis, two arms and two legs for each of Mika, Dani and Lu. All three run in the game on the same fixed rig as Ro. Everything was checked file by file, in the Lab bench in Chrome, and in a full playthrough on the landscape shoot.

**Result: the three characters work. 111 of 112 bench checks pass (28 each for Mika, Dani and Lu, plus Ro's 28 as a regression, one failure, below), the live shoot passes, all four Layout Lab runs pass and 95 unit tests pass.** Nothing needs to be re-exported to ship. Specs for a cleaner next export are at the end.

## Matching to the manifest

The delivered names are `crew.<name>.<part>.png`, which already follow the manifest. Two things needed deciding: left and right, and scale.

| Delivered file part | Manifest ID | Note |
| --- | --- | --- |
| `head` | `crew.<name>.head` | Pivot at the bottom center of the neck stub |
| `torso` | `crew.<name>.torso` | Pivot at the bottom center of the hem |
| `pelvis` | `crew.<name>.pelvis` | Pivot 60% down the piece, centered between the leg openings |
| `arm-right` | `crew.<name>.arm-front` | Right-hand crop on the sheet, hand toward the stage. **Assumed, please confirm** |
| `arm-left` | `crew.<name>.arm-back` | |
| `leg-right` | `crew.<name>.leg-front` | The wider leg, with the toe showing, as in Ro |
| `leg-left` | `crew.<name>.leg-back` | |

Pivots were read from each crop's alpha (neck stub, hem, sleeve cap and hip tab centers). `tools/batch2.map.json` holds them. The originals are not in the repo.

## What was done with the delivery

| Step | Detail |
| --- | --- |
| Scale | The crops are 1024-sheet pieces, 24 to 26 px per set unit. Each character gets its own scale so it stands 51.8 units tall like Ro: Mika 25.7, Dani 25.6, Lu 26.5. All export at 8 px per unit |
| Cleaning | The crops keep their original alpha, so they carry a faint haze (alpha 1 to 7, about 2,500 to 7,000 px per part) and a few specks. `prep_art.py` clips alpha under 8 to 0 and drops specks. It now cleans again after resizing, because resampling brought the haze back. Re-running batch 1 would change it slightly |
| Joints | Computed from the stacked parts, feet at 0,0. Hips, neck, shoulders and hip joints in `art/crew.<name>.json`, plus the portrait crop for hire cards and the crew bar |
| Weight | 21 files, 368 KB in total for the three characters |
| Registration | One line each in `CHARACTERS` in `src/slots.js` |
| Rig | No tint, no face overlays, only the crew member with the same name gets the art. Everyone else keeps their puppet |

## Checks and results

`tools/qa_pipeline.py --char <id>` writes evidence to `docs/qa/batch2/` (work filmstrips, walk strips, portraits, results per character). `tools/qa_art_e2e.py --expect crew` plays a real shoot with all four characters hired.

| Area | Result |
| --- | --- |
| Sharpness at gameplay scale | Pass for all three. Softest part is 1.07x the pixels the hardest display can show, most oversized 1.40x |
| Transparency | Pass. Corners empty, one connected piece per pose |
| Idle | Feet on the mark within 0.1 units, 51.3 units tall (Ro is 51.8), one solid silhouette |
| Work, 12 frames | Pass for all three. The arm stays attached, feet planted. Reach is 15.6 to 16.2 units against Ro's 11 (arms are longer, see below) |
| Walk across the set, both directions | Pass for all three, except the one start check below for Lu. Planted foot does not slide, feet on the floor, even steps |
| Portraits | Pass. Whole head shows on the hire card and crew bar, nothing cut off |
| Live shoot, landscape, 2x phone | Pass, no page errors. Mika and Dani walk and work with their own art, the hire cards show it, the shoot reaches the wrap report |
| Layout Lab, portrait, landscape, rotated landscape, tablet | All four pass |
| Unit tests | 95 pass |

**One failing check: Lu, walk start and stop.** When Lu starts walking to the left, the first frame overlaps the standing pose by 0.65 against about 0.84 for ordinary frames. The cause is the turn to face left on the first step, which every character does, and Lu's narrow silhouette makes it count more. Mika and Dani pass the same check. It is a rig behavior, not an art defect, and the threshold was not loosened. Fixing it means turning in place before the first step, which belongs to the crew animation milestone.

## Findings that need a decision

1. **Lu is booked on the Burger Job.** The level data marks her as on another job, so she cannot be hired in the default shoot, and the art shows only in the Lab bench. Do you want her hirable (unbooked, or swapped in for Theo as the default art hire)?
2. **Left and right.** The files name sides as seen on the sheet. I used the right-hand arm and leg as front. If the near side should be the other one, it is a one line swap per character in the map.
3. **Arms are long.** Batch 2 arms are 19 to 21 units tall against Ro's 15.5, and torsos are about 25% bigger. The work animation reaches 16 units against 11. It looks fine, but it reads as a different build. Intended, or should the next characters match Ro?
4. **The art is now the look of record.** Dani has no cap and Lu has brown skin, a bun and gold hoops, unlike the old manifest notes. The manifest roster is updated to describe the art. The hire card blurbs and the old code-drawn looks for Dani and Lu are unused.
5. **Poses are not delivered yet.** No `arm-front.work`, `head.blink` or `head.oops`. The shared work animation covers them for now.

## Export spec for the next characters

Nothing below blocks the game. These make the next export drop in with no fitting.

| Item | Spec |
| --- | --- |
| Master | One master per character, all parts at 27 px per set unit (Ro's scale). Keep masters, `prep_art.py` fits them |
| Proportions | Sole to top of head 51.8 units (1399 px). Head 15 x 18 units (405 x 486 px), torso 13.4 x 14.1 (362 x 381), pelvis 14.9 x 9.4 (402 x 254), arm 8.4 x 15.5 (227 x 419), leg 11.5 x 22.8 (310 x 616). Plus or minus 8% is fine |
| Alpha | PNG-32, straight alpha. Nothing between alpha 1 and 7, no stray specks, about 4 px of clear margin. No background or matte color in the semi-transparent edge pixels (Dani's arms show a dark edge ring of about 15 luminance) |
| Names | `crew.<name>.<part>.png` with `arm-front` and `arm-back`, `leg-front` and `leg-back`, so no left and right guessing |
| Joint hints | Optional: mark the pelvis center between the leg openings and the neck stub bottom in a small note, so the pivots are exact instead of read from the art |
| Poses | Optional, same canvas and pivot as the base part, at 8 px per unit: `arm-front.work`, `head.blink`, `head.oops` |
| One stray pixel | Mika's head has 1 faint pixel far from the art. Harmless |

## Files

Evidence is in `docs/qa/batch2/` in the repo. The fit is `tools/batch2.map.json`, and the QA additions are `--expect crew` in `tools/qa_art_e2e.py` and `--char` in `tools/qa_pipeline.py`. Run the bench one character at a time, since four at once crash Chrome.
