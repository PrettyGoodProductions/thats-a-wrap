# Art drop folder

Put delivered art here, run `node build.mjs`, and the game uses it. No code changes. Anything not delivered keeps its code-drawn placeholder, so batches can ship one at a time.

## File names

Follow the Asset Manifest: `<dept>.<object>[.<state>]@3x.png`

| Example | Meaning |
| --- | --- |
| `grip.platform@3x.png` | One look, no state |
| `elec.keylight-head.off@3x.png`, `.on@`, `.dead@` | One file per state |
| `art.burger-build.bottom-bun@3x.png` | The state is the layer name |
| `crew.arm-front.work@3x.png` | A pose variant of a puppet part |

Lower case, no spaces. Subfolders are fine, only the file name counts. PNG, WEBP or SVG. If both an SVG and a raster exist for the same look, the SVG is used. Files and folders starting with `_` or `.` are ignored.

## Settings file (optional)

One small file per piece, named `<dept>.<object>.json`, next to the images. Every key is optional.

```json
{
  "pivot": [84, 51],
  "scale": 3,
  "offset": [0, 0],
  "shadow": false,
  "states": { "dead": { "offset": [0, 1] } }
}
```

| Key | Meaning |
| --- | --- |
| `pivot` | The point the piece rotates and slides around, in the image's own pixels. Or a name: `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`. Default comes from the piece, for example the platform is `bottom-center` |
| `scale` | Image pixels per set unit. Wins over everything |
| `size` | `[width, height]` the image should be in set units. The width sets the scale |
| `offset` | `[x, y]` nudge in set units, added to where the piece attaches |
| `shadow` | `true` adds the soft paper shadow. Default depends on the piece |
| `tint` | `"skin"`, `"dept"`, `"hair"`, a `#hex` color, or `false`. Multiplies a neutral light image by that color |
| `states` | Overrides for one state, using any key above except `states` |

Scale, when nothing says otherwise: `@3x` in the file name, then 3 for PNG and WEBP, then 1 for SVG (one viewBox unit is one set unit).

Set units: the shoot set is 360 wide and 410 tall. A puppet is 48 units tall.

## What the build tells you

`node build.mjs` lists every piece it found and what it will draw (size in set units, pivot). It warns when a file name does not match, when a pivot falls outside the image, when a piece draws far from its manifest size (usually a wrong `@3x`), and when a puppet is incomplete. Bad JSON fails the build with the file name.

## What is wired in the game today

| Piece | States | Attaches |
| --- | --- | --- |
| `grip.platform` | one look | Bottom center at the hero platform spot. Carried in by the sim |
| `elec.keylight-head` | `off`, `on`, `dead` | Pivot at the yoke. The sim rotates it and picks the state. A missing state shows the code-drawn head |
| `art.burger-build` | `bottom-bun`, `patty`, `cheese`, `lettuce`, `top-bun` | Layers stack on the art cart, bottom center pivot. Layers not delivered stay code-drawn |
| `crew.*` puppet | see below | Used for every crew member, client and portrait |

### Modular puppet

Required: `crew.head`, `crew.torso`, `crew.arm-front`, `crew.leg-front`, `crew.leg-back`. Until all five exist, the code-drawn puppet is used, so a half-built puppet never shows up.

Optional: `crew.arm-back`, `crew.hair.<look>` (`cap`, `beanie`, `bun`, `beret`, `slick`, `default`), `crew.face.<extra>` (`eyes`, `nose`, `beard`, `mustache`, `glasses`, `earring`).

| Part | Pivot (default) | Notes |
| --- | --- | --- |
| `crew.head` | neck, bottom center | Deliver a neutral light version. The engine tints it with each person's skin tone |
| `crew.torso` | hips, bottom center | Neutral light. Tinted with the department color |
| `crew.arm-front`, `crew.arm-back` | shoulder, top center | The front arm is the one that swings when working |
| `crew.leg-front`, `crew.leg-back` | hip, top center | |
| `crew.hair.*` | bottom center, sits at the hairline | The state name is the look |
| `crew.face.*` | center | Draw each on a canvas the size of the head, so they line up with it |

Poses: add a state to any of head, torso, arms or legs, for example `crew.arm-front.work@3x.png`. Parts with no art for a pose keep their default look. The game asks for `idle` (falls back to the default) and `work` today. Walk and the reactions arrive with the crew animation milestone.

## Adding a new piece

Art for a piece that is not wired yet is ignored with a warning. Wiring is one entry in `src/slots.js` plus wrapping its placeholder in `slot()` in `src/art.js`. After that, any delivery of that piece is drop-in.
