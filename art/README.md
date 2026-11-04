# Art drop folder

Put delivered art here, run `node build.mjs`, and the game uses it. No code changes. Anything not delivered keeps its code-drawn placeholder, so batches can ship one at a time.

## File names

Follow the Asset Manifest: `<dept>.<object>[.<state>]@6x.png`, where `@6x` is the px per set unit (6 for set pieces, 8 for puppet parts)

| Example | Meaning |
| --- | --- |
| `grip.platform@6x.png` | One look, no state |
| `elec.keylight-head.off@6x.png`, `.on@`, `.dead@` | One file per state |
| `art.burger-build.bottom-bun@3x.png` | The state is the layer name |
| `crew.arm-front.work@3x.png` | A pose variant of a puppet part |
| `crew.ro.head@8x.png` | Part `head` of the fixed character Ro |
| `crew.ro.arm-front.work@8x.png` | A pose of one of Ro's parts |

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
| `flip` | `true` mirrors the image left to right about its pivot (art drawn facing the wrong way) |
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

### Fixed characters

A character drawn as a whole person (Ro the Gaffer) is delivered as `crew.<character>.<part>`: `head`, `torso`, `arm-front`, `leg-front`, `leg-back` are required, `arm-back` is optional. The art is never tinted and gets no face or hair overlays. The crew member whose name matches the character (Ro) gets it, everyone else keeps their own puppet.

One more file, `crew.<character>.json`, fits the character to the shared rig:

```json
{
  "scale": 8,
  "fixed": true,
  "joints": { "hips": [0, -16.3], "neck": [0.3, -28.9], "shoulderFront": [5.4, -25.8], "shoulderBack": [-5.3, -25.7], "hipFront": [3.8, -21.6], "hipBack": [-4, -22] },
  "portrait": [-11.5, -51, 23, 25.5]
}
```

`joints` say where each part's pivot lands, in puppet units with the feet at 0,0 (a puppet is about 48 tall). `portrait` is the head crop for the hire cards and crew bar, `[x, y, width, height]`. `scale` and `tint` here are defaults for every part, a part's own `.json` (usually just its `pivot`) refines them.

The walk, work and reach animations live in `src/page.html` (`.wl-rig` rules) and move parts by role, so every character on the rig animates the same way. A pose image such as `crew.ro.arm-front.work@8x.png` replaces the part while that pose plays.

A new character is its files plus one line in `CHARACTERS` in `src/slots.js`. Batch 2 (Mika, Dani, Lu) shows the path: `tools/batch2.map.json` is generated from each crop's alpha (pivots at the neck stub, hem, sleeve cap and hip tab) and gives each character its own `native` scale, so every one stands 51.8 units tall like Ro.

## Checking a batch

| Command | What it checks |
| --- | --- |
| `python3 tools/prep_art.py <map.json> <delivery folder> art` | Names a raw delivery, cleans stray alpha, resizes to spec and writes the settings files. See `tools/batch1.map.json` |
| `python3 tools/audit_art.py art` | Per file: size, weight, margins, specks, haze, edge halos. Per piece: how far states drift from each other |
| `node build.mjs --lab --out /tmp/lab && python3 tools/qa_pipeline.py /tmp/lab /tmp/qa` | In Chrome: sharpness at phone and tablet scale, transparency, platform placement, key light jump and pivot, puppet walk and work frames (writes GIFs and contact sheets) |
| `python3 tools/qa_art_e2e.py dist/index.html /tmp/e2e --expect ro` | Plays a real shoot with Ro hired and checks everything shows up |
| `python3 tools/qa_art_e2e.py dist/index.html /tmp/e2e --expect crew` | Same, with every delivered character hired (Ro, Mika, Dani; Lu when she is not booked): each must walk and work on the fixed rig |
| `python3 tools/qa_pipeline.py /tmp/lab /tmp/qa --char mika` | The bench checks on one character (`ro`, `mika`, `dani`, `lu`). Run one at a time: four in parallel crash Chrome |

## Adding a new piece

Art for a piece that is not wired yet is ignored with a warning. Wiring is one entry in `src/slots.js` plus wrapping its placeholder in `slot()` in `src/art.js`. After that, any delivery of that piece is drop-in.
