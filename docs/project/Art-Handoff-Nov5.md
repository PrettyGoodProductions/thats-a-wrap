# That's a Wrap! Art status and next asks (handoff)

Nov 5, 2026 · revision 3 · goes with Asset Manifest revision 15, Content-Roadmap.md, Crew-Kit-01-Validation.md, Crew-Kit-02-Request.md and the Crew Kit A2 zip. Revision 3: Crew Kit 01 is delivered and tested, and Ask 1 is now Crew Kit 02.

## Where things stand

| Area | Status |
| --- | --- |
| Shoot set, stage, props, video village, craft table | Delivered and in the game |
| HUD | Delivered and in the game |
| HQ, the landscape diorama | Delivered and in the game: shell, every room at levels 1 to 3, exterior, UI |
| Hand-designed characters | Eight delivered and in the game: Ro, Mika, Dani, Lu, Client, Agency, Receptionist, Theo |
| The rest of the crew | Not hand-drawn. Built from the crew kit. Crew Kit 01 (15 pieces) is delivered and works: ten kit crew play in a test build |

## What changed in the plan

1. **No more one-off characters.** The game builds new people from kit pieces and recolors them. `mix-proof.png` in the template zip shows twelve people made from delivered parts alone.
2. **Recoloring is done in code.** Skin, hair and each garment can change color on its own. Art does not need grey versions or masks. It needs flat, clearly different colors per area.
3. **Levels get their own look from a set kit.** The delivered flats already take any color. New wall and floor materials, flats with openings and pattern overlays make two levels look like different rooms.

## Ask 1: Crew Kit 02 (39 drawings)

Everything is in **Crew-Kit-02-Request.md**, with template A2 (`crew-kit-template.png`, `crew-kit-template.json`, `guides/`) and the fitted Kit 01 pieces to draw against. In short: four more faces on the same skull, four hair styles, a beanie and a beret, jeans, work pants, bare legs, a skirt, three shoes as their own layer, and four tops.

Read Crew-Kit-01-Validation.md first. The body template changed from A to A2 after the Kit 01 test, and six rules came out of it.

Send this once Tomás has approved the Kit 01 lineup.

## Ask 2: Studio shell kit (16 drawings)

This can go with Ask 1 or after it. Same delivery rules as the batch 4 set art: PNG-32, straight alpha, no cast shadows, light from the upper left, paper grain at the same real size as the delivered wall and flats.

**Color:** draw each piece in one paper color of your choice, light to mid tone. The game recolors it per level. Avoid very dark colors, which hide the grain.

| ID | Piece | Size (set units) | Export at 5 px per unit | Notes |
| --- | --- | --- | --- | --- |
| `set.wall.brick` | Brick wall, seamless tile | 200 x 200 | 1000 x 1000 | Same use as `set.wall`. Must tile on all four edges |
| `set.wall.cyc` | Smooth white cyc wall, seamless tile | 200 x 200 | 1000 x 1000 | Very light, soft grain only |
| `set.wall.wood-slat` | Vertical wood slats, seamless tile | 200 x 200 | 1000 x 1000 | |
| `set.wall.concrete` | Concrete, seamless tile | 200 x 200 | 1000 x 1000 | |
| `set.floor.concrete` | Concrete floor, seamless tile | 200 x 200 | 1000 x 1000 | Same use as `set.floor` |
| `set.floor.wood-plank` | Wood plank floor, seamless tile | 200 x 200 | 1000 x 1000 | Planks run left to right |
| `set.floor.checker` | Checker tile floor, seamless tile | 200 x 200 | 1000 x 1000 | Two tones of one color |
| `set.floor.cyc` | White cyc floor, seamless tile | 200 x 200 | 1000 x 1000 | |
| `set.flat-window` | Flat with a window opening | 90 x 200 | 450 x 1000 | The opening is transparent. Frame in the same paper |
| `set.flat-window.glass` | Glass and soft glow for the window | 90 x 200 | 450 x 1000 | Same canvas as the flat, so it drops in behind it |
| `set.flat-door` | Flat with a closed door | 90 x 204 | 450 x 1020 | Door and frame in a second, clearly different color |
| `set.flat-half` | Half-height flat | 90 x 100 | 450 x 500 | Stands on the floor line, top edge torn like the others |
| `set.pattern.stripes` | Vertical stripes, seamless overlay | 100 x 100 | 500 x 500 | Transparent background. One darker paper tone, about half coverage, so it sits over a flat of any color |
| `set.pattern.tile-grid` | Square tile grid lines, seamless overlay | 100 x 100 | 500 x 500 | Same |
| `set.pattern.wallpaper` | Simple repeating print, seamless overlay | 100 x 100 | 500 x 500 | Same |
| `set.grid.beams` | Wood ceiling beams, seamless strip | 200 x 24 | 1000 x 120 | Same use as `set.grid` |

A skylight strip and the hero surfaces (café table, bar top, counter, plinth, flat-lay board) come later, when a level needs them.

## Optional, small

| Ask | Why |
| --- | --- |
| Pelvis for Agency, Receptionist and Theo, redrawn 12.5 to 14.5 units wide with no dark leg openings | They were widened and trimmed in code. A redraw would be a little sharper |
| `crew.agency.arm-back.hold`: the Agency's near arm bent, hand closed around a cup | Her latte hangs at her side. The approved picture has it held up |
| `hq.sign.bulbs`: bulbs only, drawn on the `off` sign master (1320 x 204) | So the sign can blink without the board jumping |

## Delivery rules (short version)

- PNG-32, sRGB, straight alpha, transparent background, one object per file. Larger masters are welcome.
- No glow, halo or cast shadow on the floor. The game adds those.
- Nothing between alpha 1 and 7, no stray specks, about 4 px of clear margin.
- Every state of a piece on one identical canvas, with unchanged parts on the same pixels.
- Nothing the game changes is painted in: names, labels, numbers, prices, logos.
- Paper texture lives inside each piece, at about the same grain size everywhere.
- Each area that the game should recolor is one flat paper color, and no two areas in one piece are similar colors.
- Names: `dept.object[.state]@6x.png`, characters `crew.<name>.<part>@8x.png`, kit pieces `kit.<slot>.<name>[.<part>]@8x.png`, lower case.

## What to give ChatGPT

The Crew Kit A2 zip holds all of it:

1. This page.
2. Crew-Kit-01-Validation.md, then Crew-Kit-02-Request.md.
3. Template A2: the sheet, its data and the guides.
4. The fitted Kit 01 pieces, and pictures of the lineup, the before and after of the fit, the head layers and the recolors.
5. Content-Roadmap.md, for the plan behind the asks.
