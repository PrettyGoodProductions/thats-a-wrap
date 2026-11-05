# Art validation: HQ Complete (Test 06, Rooms 07, Exterior and UI 08)

Nov 5, 2026. 77 PNGs. Wired and tested in the game on `milestone-b-lab`.

**Result: everything delivered meets the spec and is in the game.** All non-character HQ art is now delivered.

## Checks

- **Sizes:** every file matches HQ-Redesign.md at 6 px per unit (rooms 600 x 576, office 1248 x 576, shell 2712 x 1368, tiles 320 and 160 wide) or 3 px per CSS px (UI).
- **Alpha:** no haze. Edges sit at alpha 250 to 255, so fronts and layers occlude cleanly.
- **Room states:** ceiling, walls and lamp are pixel-identical across building, l1, l2 and l3 for every room. For-rent is the same room darkened.
- **Front layers:** match their rooms on 98.7 to 99.2% of opaque pixels. The Gear L3 front also carries the cart.
- **Shell and Art Dept:** byte-identical to Test 06.
- **Missing from the zip:** the `reuse/` and `review/` folders and the notes with nine-slice borders and coordinates. The carryover art was already in the game, and the slices were measured from the art.

## How it was fitted

- Rooms, exterior and HQ UI at 4 px per unit as WebP (sharp on a 3x phone, 1/10 the weight). The heaviest older PNGs were also moved to WebP. Packed art: 4.96 MB.
- The office has no for-rent or building state (it is always yours). Upgrading it shows the new level straight away.
- Level 3 of the office and gear uses its own front layer (`front-l3`).
- Room names are written by the engine on the room-sign art, along the top of each room so they clear the lamps. COMING SOON is written on the boarded slot's paper tag.
- City, trees, sidewalk and street are seamless strips tiled past both edges of the screen. Foreground plants frame the corners.
- HQ UI: nav tabs, resource pills, week rows and chips, and the primary button are CSS frames. Icons are images. The money and favors icons sit on light discs so they read on the dark pill. The next-up photo sits in the frame's window (measured: 9.8%, 11%, 80.9% square).
- The badge shows the number of jobs still short of three stars. Week arrows are not shown yet: there is no week to page through.

## Open

- The sign states are still not one master, so the sign shows lit and does not blink.
- Optional extras (cone, hydrant, plant sway, fork rods) are not needed.
- Characters remain: Client, Agency, Receptionist, Theo and the rest of the roster.
