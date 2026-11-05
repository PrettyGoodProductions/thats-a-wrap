# Art batch 6 validation (zip "Approved Assets 04", the HQ set)

Nov 5, 2026. The project calls this zip "04"; in the repo it is the sixth batch fitted (`tools/make_batch6_map.py`, `tools/batch6.map.json`).

## What was done

- 20 files matched to 16 manifest IDs by sight on contact sheets: 11 room pictures (edit building and built, craft, gear and kitchen in three states), for-rent card, lobby, job board, flyer, street, van, sky and two clouds.
- Fitted with `tools/prep_art.py`, audited with `tools/audit_art.py`. The only audit failures left are the older parked cut-paper edges already listed in batch 5.
- Everything is wired. Rooms use the art for `for-rent`, `building` (shown for 1.6 s after you build) and `built`. The preview card in the room pop-up shows the built picture.
- Tests: 96 pass. `qa_art_e2e` (crew), `qa_pipeline` (Ro) and `qa_lab_e2e` (port, land) pass. Office screenshots are in `docs/qa/batch6`.

## How the art was fitted

| Piece | Fit | Why |
| --- | --- | --- |
| Rooms (11) | Cropped to 152 x 112 around the art, 4 px per unit | Three came out wider than the box (1.43 against 1.36), so a sliver at each side is trimmed instead of stretching. The pictures arrive about 97% opaque, so the fitting step makes them solid, otherwise the wall behind tints them |
| hq.for-rent | 84 wide, hangs from the rope | The engine prints the price on the blank lower half |
| hq.lobby | 312 x 60 | Delivered 5.2 : 1, the spec is 3.71 : 1 (312 x 84) |
| hq.street | 360 x 64 | Delivered 5.7 : 1, the spec is 4.19 : 1 (360 x 86) |
| hq.van | 84 x 61 | Delivered as a boxy van with a roof rack (1.39 : 1), not the 2.5 : 1 canvas in the manifest |
| hq.sky | 360 x 70, drawn at 112% and shifted so the sun sits right of the sign | The painted sun (x 274) sat behind the marquee sign |
| hq.jobboard | Fitted at 116 wide, drawn at 55% | The lobby wall has no clear 116 x 58 space (see below) |
| Clouds | 64 and 36 wide | The manifest gave no size |

Because the lobby and street are shorter than planned, the building now ends at y 372 and the whole office frame is 446 tall instead of 470. Without these files the old layout still draws.

Weight: the six 6 px per unit room, lobby, street and sky files added 1.6 MB, so those are 4 px per unit (about native on a 3x phone, 1 unit is about 1.2 CSS px). Packed art is 6.0 MB.

## Needs a different export

1. **hq.lobby** at 1872 x 504 (312 x 84). The delivered wall is only 32 units tall above the desk and 21 between the door and the desk, so the 116 x 58 job board does not fit and is drawn at 55%. Either re-export the lobby taller with a clear wall zone of 116 x 58, or confirm a smaller board (64 x 32).
2. **hq.shell** (still parked from batch 5): 2016 x 2040, openings 152 x 112 at (24,56), (184,56), (24,176), (184,176), lobby opening 312 x 84 at (24,296).
3. **Rooms**: export opaque (alpha 255), and keep every state on the same canvas. Craft for-rent and building, and gear built, came at 1501 x 1047 while the others are about 1464 x 1075, so the framing differs by 1 to 3% between states. Target 912 x 672.
4. **hq.sky**: move the painted sun to about x 318 (right of the sign, which spans x 70 to 290), then no scaling trick is needed. Clouds are separate files, good.
5. **hq.street** at 2160 x 516 if the taller layout is wanted (86 units). The shorter one works as is.
6. **hq.van**: if a long, low grip truck was meant (140 x 56), re-export it. The boxy van works as is.
7. **hq.flyer** is blank and tiny at 55% board scale (about 18 units wide). The engine pins a burger icon on one and a line sketch on the other.
8. From batch 5, still open: progress-ring files, grip dept icon, held-item grip points, camera bottom margin, the cut-paper edge confirmations.
