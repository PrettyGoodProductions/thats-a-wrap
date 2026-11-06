# That's a Wrap! Crew Kit 02 request

Nov 5, 2026 · for ChatGPT · goes with template A2 (`crew-kit-template.png`, `crew-kit-template.json`, `guides/`), the fitted Kit 01 pieces in `kit01-fitted/`, and the pictures in `reference/` (all in the Crew Kit A2 zip). Send only after Tomás approves the Kit 01 lineup.

## Where Kit 01 landed

Crew Kit 01 is in the game's engine. Ten test crew built from it walk, work and show on the hire cards in a test build, next to the hand-designed characters. Details are in Crew-Kit-01-Validation.md. In short:

| Part | Result |
| --- | --- |
| The nine head layers | Used exactly as delivered. They stack correctly on both heads |
| Recoloring | Works on every piece: six skin tones, six hair colors, eight clothing colors |
| Delivery format | Good. Full slot canvases at 8 px per unit, `kit.json`, native sources. Keep it |
| The body | Needed a refit. The drawings are unchanged, but their sizes and placement are |

## Template A2 replaces template A

Template A was Theo's slim body. With real kit pieces on it the figure read narrow next to Ro: a 9 unit chest under a 13 unit head, hands in front of the thighs, legs overlapping. Fit A2 resized and re-placed the same drawings. **Draw and export all new body pieces to A2.**

| Slot | Template A | Template A2 | What changed |
| --- | --- | --- | --- |
| Head | canvas 28 x 32, pivot 14, 26 | the same | Nothing |
| Torso | canvas 18 x 18, pivot 9, 16.5, guide 12.0 x 14.0 | canvas 20 x 21, pivot 10, 19.5, guide 14.4 x 16.8 | 1.2 times larger |
| Arms | canvas 10 x 20, pivot 5, 3.5, guide 5.6 x 15.5 | canvas 12 x 22, pivot 6, 4, guide about 5.8 x 16.7 | 1.08 times larger, hanging 5 degrees out from straight down |
| Legs | canvas 14 x 26, pivot 6, 5, guide about 11.6 x 22.8 | canvas 14 x 24, pivot 6, 4.6, guide about 10.5 x 20.4 | 0.9 times, with the leg centered on its pivot |
| Pelvis | canvas 18 x 14, pivot 9, 6.5, guide 14.0 x 9.9 | the same | Nothing |

| Joint (units, feet at 0, 0) | Template A | Template A2 |
| --- | --- | --- |
| Neck | 0, -34.38 | 0, -34.78 |
| Shoulders | 4.94 and -4.16, -32.83 | 5.8 and -5.8, -31.9 |
| Hem | 0, -22.5 | 0, -20.52 |
| Hip line | 0, -19.44 | 0, -17.46 |
| Hips | 2.77 and -2.77 | 3.5 and -3.5 |

Sizes are in set units. Game exports are 8 px per unit. The `kit01-fitted/` folder has the tee and shorts on their A2 canvases. They are the body to draw new pieces against.

## Rules that came out of the Kit 01 test

1. **Resize evenly.** The Kit 01 pelvis was stretched 1.5 times taller than wide to reach its slot. Draw a piece at the right shape and resize it by one factor.
2. **Size by the guide for that slot**, not by the piece's own height. The guides are in `guides/` at 27 px per unit.
3. **Long hair covers the back of the skull.** The Kit 01 long hair left a crescent of scalp showing behind the ear, about 3 units wide. It was filled in code. A front piece has to cover the head from the ear back to the skull's edge.
4. **No holes in a fringe.** The short and curly hair each have a small gap between a forelock and the forehead that shows the background. Close them in new hair.
5. **Arms hang 5 degrees out**, the hand away from the body, so hands rest beside the hips.
6. **Key colors as in Kit 01.** They worked: skin `#F0A56C`, hair `#7A4A2E`, top `#8E9B6B`, bottoms `#5F6470`.

## The 39 pieces

Files are named `kit.<slot>.<name>[.<part>]@8x.png`, on the full A2 slot canvas, as in Kit 01.

### Faces (4)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.head.c` to `kit.head.f` | Four more bald base heads | **The same skull outline, ear and neck as head A.** Start from `kit.head.a` and change only the face: eyes, brows, nose shape, mouth, age lines, freckles. Four clearly different people, with the range of the delivered characters: a strong nose like Ro's, a round one like Dani's, a small one like Lu's, an older face like the Client's |

### Hair and hats (8)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.hair.medium` | Chin-length hair | Covers the ear |
| `kit.hair.ponytail` and `kit.hair.ponytail.back` | Hair pulled back, with the tail as a back piece | The tail hangs behind the neck, within 5 units below the neck pivot |
| `kit.hair.bun` | Hair up in a bun | The bun sits on the crown, inside the head canvas |
| `kit.hair.coils` | Short, tightly coiled hair | Close to the skull |
| `kit.hat.beanie` | Knit beanie | Covers the top of the head down to the ear. Worn with a bald head or short hair |
| `kit.hat.beret` | Beret | Same |
| `kit.hair.short.under-hat` | Short hair cut to sit under a hat | Only the part below the hat line: sides and back |

### Bottoms (9)

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.bottoms.jeans.pelvis`, `.leg-front`, `.leg-back` | Jeans | Bottoms key color. Each leg ends at the ankle with a **bare foot in the skin key color**, small enough that any shoe covers it |
| `kit.bottoms.work.pelvis`, `.leg-front`, `.leg-back` | Work pants with cargo pockets | Same |
| `kit.bottoms.bare.leg-front`, `.leg-back` | Bare legs with a bare foot | Skin key color. For shorts and skirts with any shoe. The Kit 01 legs have sneakers painted in, so they only work with sneakers |
| `kit.bottoms.skirt.pelvis` | Knee-length skirt | A longer pelvis piece: waistband at the top, hem about 10 units below the hip line. Worn over the bare legs |

### Shoes (6)

A shoe is its own piece on the leg canvas, inside the shoe zone (the orange box on the template: from 10.5 to 17.5 units below the leg pivot, 4.2 units behind it to 7.1 in front). It is drawn over the leg and has to cover the whole bare foot. The sole sits on the bottom of the zone.

| ID | Piece |
| --- | --- |
| `kit.shoes.boots.leg-front`, `.leg-back` | Work boots, brown |
| `kit.shoes.sneakers.leg-front`, `.leg-back` | Low-top sneakers, like Kit 01's |
| `kit.shoes.loafers.leg-front`, `.leg-back` | Loafers or flats, dark |

### Tops (12)

Each top is a torso and two arms. The sleeve and the hand are on the arm.

| ID | Piece | Notes |
| --- | --- | --- |
| `kit.top.longsleeve.torso`, `.arm-front`, `.arm-back` | Long-sleeve tee | Top key color, hands in the skin key color |
| `kit.top.shirt.torso`, `.arm-front`, `.arm-back` | Button-down shirt with a collar, sleeves rolled to the elbow | Buttons in a color clearly different from the shirt |
| `kit.top.hoodie.torso`, `.arm-front`, `.arm-back` | Hoodie with the hood down and a front pocket | The hood sits behind the neck, inside the torso canvas |
| `kit.top.cardigan.torso`, `.arm-front`, `.arm-back` | Open cardigan over a tee | Cardigan in the top key color. The tee under it in a clearly different color, such as light blue. Not cream, which is too close to the key color |

## References to deliver

| File | What it shows |
| --- | --- |
| One picture per head layer | Head A wearing that piece |
| `ref.heads.png` | All six base heads in a row, bald, at the same size |
| One picture per top and per bottoms | The mannequin wearing it, with Kit 01 pieces for the rest |
| `ref.shoes.png` | The three shoes on the jeans legs and on the bare legs |

## Delivery format

The Kit 01 package layout, unchanged: `art/` at 8 px per unit on full slot canvases, `source/` native crops, `metadata/kit.json` with canvas, pivot and fitted bounds for each piece, `review/` contact sheets, and the validation report. The 27 px masters can be left out, since they were resampled from the native crops.

## How Claude will check it

The same way as Kit 01: file audit, head layers on all six heads, every piece recolored across the palettes, each top and bottoms on the mannequin in the game's bench (walk, work, floor contact, portrait crop), and a lineup next to Ro for Tomás.

## Not in this batch

A dress, jackets and aprons as over layers, a second body build, and children. They can follow once this wardrobe is in.
