# That's a Wrap! Crew Kit 01: test batch request

Nov 5, 2026 · for ChatGPT · goes with `crew-kit-template.png`, `crew-kit-template.json`, the `guides/` folder and the `reference/` pictures (all in the Crew Kit Template zip)

## What this is

A small test batch for a crew wardrobe kit. The game will build new people from kit pieces and recolor them, so that one set of drawings gives many different crew. This batch is 15 drawings. If they fit together, the full kit follows.

## What already works (no art needed)

The eight delivered characters (Ro, Mika, Dani, Lu, Client, Agency, Receptionist, Theo) are in the game. Claude can already recolor one color area of a piece at a time: skin, hair, a jacket, trousers. Eyes, glasses, buttons and boots keep their colors, and a nose follows the skin it sits on. `reference/mix-proof.png` shows twelve new people made this way from delivered parts only: a head from one character, the outfit of another, new skin tone, hair color and clothing colors.

So the kit does not need neutral grey art or separate color masks. It needs **new shapes**, drawn in the normal style in a few agreed colors.

## What is missing

1. **Hair and hats are painted into every head.** A bald base head with hair, hats, beards and glasses as separate layers lets any head wear any hair.
2. **Every outfit is long trousers and a shirt or jacket.** A tee and shorts add bare arms and legs, which also tests skin recoloring on the body.

## The mannequin

All pieces fit one body, shown on `crew-kit-template.png`. It is Theo's body as fitted in the game, on Ro's rig. His seven parts are in `reference/body-example-theo/` as an example of the format, with the pelvis at the corrected width. Sizes are in set units. Masters are 27 px per unit, game exports are 8 px per unit, as in the last delivery.

| Slot | Guide size (units) | At 27 px per unit | Pivot |
| --- | --- | --- | --- |
| Base head, bald, with ear, nose and neck stub | 12.5 x 15.5 | 338 x 419 | Bottom center of the neck stub |
| Torso | 14.1 tall, 10.5 to 14.5 wide | 381 tall | Bottom center of the hem |
| Pelvis | 12.5 to 14.5 wide, 10 to 12 tall | 338 to 392 wide | Center of the hip line, 5.2 units below the waistband top |
| Arm, front and back | 15.5 tall | 419 tall | Center of the round sleeve cap |
| Leg, front and back | 22.8 tall | 616 tall | Center of the rounded leg top |

Plus or minus 8% is fine. Claude fits each piece to the rig after delivery.

**Head canvas.** Every head layer for one base head (the head, hair, hair back piece, hat, beard, glasses) is exported on one shared canvas: 28 x 32 units (756 x 864 px at 27, 224 x 256 px at 8), with the neck pivot at 14, 26 units from the top left. The layers must stack exactly when laid over each other.

The reliable way to get that: draw the base head once. For each layer, make an approved picture of that same head wearing the piece, then cut the piece out of that picture and export it on the head canvas without moving it. Do not draw the pieces as loose wigs at their own scale.

## Key colors

Draw these areas in these colors, so the game can find and recolor them. Everything else is drawn in whatever color suits it.

| Area | Color |
| --- | --- |
| Skin (head, neck, hands, bare arms and legs) | `#F0A56C`, the same family as Ro and Theo |
| Hair, beard | `#7A4A2E` |
| Top (tee body and sleeves) | `#8E9B6B` |
| Bottoms (shorts) | `#5F6470` |

Close is fine, exact hex is not required. Two rules matter: each area is one flat paper color with the usual grain and soft inner shading, and no two areas inside the same piece are similar colors.

## The 15 pieces

Files are named `kit.<slot>.<name>[.<part>]@8x.png`, with masters at `@27x`.

### Heads (2)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.head.a` | Bald base head A | Friendly neutral face: eyes, brows, nose, mouth, ear, neck stub. No hair, no hat, no glasses |
| `kit.head.b` | Bald base head B | **The same skull outline, ear and neck position as head A**, so every hair piece fits both. A different face: other eyes, brows, nose and mouth, a little older |

### Head layers, all cut to fit head A (7)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.hair.short` | Short hair | Covers the top and back of the skull, ear visible |
| `kit.hair.curly` | Short curly hair | Bigger outline than short, ear visible |
| `kit.hair.long` | Long hair, front piece | The part in front of the head and ear |
| `kit.hair.long.back` | Long hair, back piece | The part that hangs behind the neck and shoulders. Drawn behind the head. Ends within 5 units below the neck pivot |
| `kit.hat.cap` | Baseball cap, facing right | Sits over a bald head or short hair. Any one cap color |
| `kit.face.beard` | Full beard | Hair key color. Leaves the mouth visible |
| `kit.face.glasses` | Glasses | Frames only, clear lenses (transparent) |

### Top: tee (3)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.top.tee.torso` | Tee body | Top key color. No arms. No armholes painted on it: both arms draw over the torso |
| `kit.top.tee.arm-front` | Arm with a short sleeve | Sleeve in the top key color, bare forearm and hand in the skin key color. Hanging straight down, relaxed hand |
| `kit.top.tee.arm-back` | The other arm | Same |

### Bottoms: shorts (3)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.bottoms.shorts.pelvis` | Shorts-shaped pelvis | Bottoms key color. Waistband at the top. **12.5 to 14.5 units wide, as wide as two thighs side by side.** The leg tubes end on fabric: no dark openings drawn at the bottom |
| `kit.bottoms.shorts.leg-front` | Bare leg with a sneaker | Short leg of the shorts at the top in the bottoms key color, bare leg in the skin key color, sneaker in any color. Rounded top, toe pointing right |
| `kit.bottoms.shorts.leg-back` | The other leg | Same |

## References to deliver with the pieces

| File | What it shows |
| --- | --- |
| `ref.head-a.<piece>.png`, one per head layer | Head A wearing that one piece. This is the picture the piece is cut from |
| `ref.head-a.long-cap-beard-glasses.png` | Head A with several layers at once, to check the stacking order |
| `ref.mannequin.tee-shorts.png` | The whole figure: head A with short hair, the tee and the shorts, assembled |

## Rules carried over from earlier batches

- Faces right, front three-quarter view, light from the upper left. Paper cut-out style matching Ro: torn and cut edges, fiber grain, soft shadow between layers.
- Real transparency. PNG-32, straight alpha, nothing between alpha 1 and 7, about 4 px of clear margin on tight crops.
- No cast shadow on the ground, no glow, no text or labels.
- Arms hang straight down. Legs stand straight with the sole flat.
- Keep the hidden overlap at every joint: the neck stub under the collar, the round sleeve cap under the shoulder, the rounded leg top under the pelvis, the hem over the waistband.
- Draw to Ro's proportions, using the guides. In the last delivery every part was resized to its guide height on its own, which made each pelvis too narrow for its legs. For the pelvis, size by width.

## Delivery format

The same layout as the Agency, Receptionist and Theo zip:

- `art/` game exports at 8 px per unit
- `masters/parts/` the same pieces at 27 px per unit
- `masters/references/` the reference pictures
- `metadata/` one JSON per group with each piece's size, pivot and source crop
- `review/` labeled contact sheets

For the nine head pieces, export on the full head canvas. For the body pieces, tight crops with a 4 px border and the pivot in the metadata are fine.

## How Claude will check it

1. Files: size against the guides, alpha, margins, key colors found in each piece.
2. Head layers: each one laid over head A and compared with its reference picture.
3. Recolor: every piece in five skin tones, five hair colors and five clothing colors.
4. Fit: the tee and shorts on the mannequin, with the walk and work animations in the game's test bench.
5. A lineup of twelve kit people at game size, next to Ro, for Tomás to approve.

## Optional, from the last delivery

None of these block anything. The game already works around them.

| Ask | Why |
| --- | --- |
| Agency, Receptionist and Theo pelvis, redrawn 12.5 to 14.5 units wide with no dark leg openings | Claude widened them from the masters and trimmed the openings in code. A clean redraw would be a little sharper |
| `crew.agency.arm-back.hold`: the Agency's near arm bent, hand closed around a cup | Her latte hangs in a straight arm at her side. The approved picture has it held up in front |
