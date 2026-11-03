# That's a Wrap! Asset Manifest

Nov 3, 2026 · @Tomás Valladares

Every piece of art the game needs, cut the way the animation system moves it. Final art built to these specs drops in with no code changes beyond swapping the file.

## Delivery specs

One object per file, on a transparent background, cut along the paper edge. The engine moves, swaps and lights each piece, so nothing can be painted into a shared background.

| Rule | Spec |
| --- | --- |
| Format | PNG-32, sRGB, straight (not premultiplied) alpha. Layered SVG also works, one group per part with the part name as its id |
| Scale | Sizes below are in set units. Set props and lights at **6 px per unit** (a 112 x 60 platform is 672 x 360 px). Puppet parts at **8 px per unit** (they also appear larger on the hire cards). Measured on batch 1: this is sharp on a 3x phone and a 2x tablet with 1.1 to 1.8x headroom. Larger masters are fine to keep, `tools/prep_art.py` fits them |
| Transparency | Fully transparent background, no glow or halo baked in, nothing between alpha 1 and 7 (clip it to 0), no stray specks. About 4 px of empty margin at export size |
| Set coordinates | The shoot set is 360 units wide and 410 tall, with the floor line at about y 150. Phones show it at about 1.08 px per unit |
| HQ coordinates | The office is 360 x 470 units |
| View | Front three-quarter, slightly elevated, the same angle as the concept art. Light from the upper left |
| Shadows | Keep the soft shadow between layers inside a piece. Do not paint cast shadows on the floor: the engine adds them so they move with the object |
| Pivots | Each piece rotates or slides around the pivot listed below. Mark it in the file name or a note, in the piece's own pixel coordinates |
| Naming | `dept.object.state@6x.png`, for example `elec.keylight-head.on@6x.png`. The `@Nx` is the px per set unit. Characters: `crew.<character>.<part>@8x.png` (see below) |
| States | Every state of a piece on one identical canvas, with everything that does not change at exactly the same pixels. The game swaps states in place, so any drift shows as a jump |
| Facing | Puppets face right. Lights face right, toward the set |
| No baked text | Anything the game changes stays out of the art: company name, chair labels, client logo, shot names, numbers |
| Color variants | When a piece changes color per shot (the sweep), deliver a neutral light version the engine can tint, or one file per color |

### Hero platform spec (revision 2, Nov 3)

The hero burger sits on the platform's **contact point**, and everything aimed at the burger (frame marks, light beams, the cheese-pull fork, the sauce bottle, the sparkle) follows that point. Batch 1's box is flatter than the layout: its lid center lands at y 158, which drops the burger 30 units below where the set was composed. The next export draws the same box taller so the lid center lands at y 128.

| Measure | Set units | Pixels at 6x |
| --- | --- | --- |
| Canvas | 112 x 76 | 672 x 456 |
| Box width, left edge to right edge | about 104 | about 624 |
| Front face height, floor to the lid's front edge | 56 | 336 |
| Lid depth on screen, front edge to back edge | about 16 | about 96 |
| Box bottom edge | 1 above the canvas bottom | 6 above the canvas bottom (y 450) |
| Pivot: bottom center of the box | (56, 75) | (336, 450) |
| Contact point: center of the lid, where the burger's base sits | 64 above the box bottom, centered | (336, 66) |

Keep the batch 1 look (red paper sides, torn cream lid edges, corrugated edge). Same view and light direction. Name it `grip.platform@6x.png` and send the contact point with it if it moves. `art/grip.platform.json` holds it as `"points": { "contact": [336, 66] }`, and nothing else changes.

## Set assets: The Burger Job

Layers run back to front: 0 is the wall, 9 is the effects over everything. Sizes are approximate set units. "Driven by" is the simulation value that sets the state, so art changes always match what the crew is doing.

| ID | Piece | Layer | Size | Pivot | States and motion | Driven by |
| --- | --- | --- | --- | --- | --- | --- |
| set.flats | Five wall flats (blue, red, mustard, sage, corrugated) | 0 | 70–110 x 200 each | none | Static | none |
| set.grid | Ceiling pipe grid, two hanging practicals, overhead flag | 0 | 360 x 50 | none | Practicals have off and glowing states | none |
| set.poster | Client poster on the wall | 0 | 44 x 34 | none | Blank card: the client logo is drawn on top | Job data |
| set.plants | Two potted plants | 1 | 40 x 70 | Pot base | Static, optional two-frame sway | none |
| set.floor | Kraft floor, tape marks, cable | 1 | 360 x 190 | none | Static | none |
| grip.sweep | Paper sweep and its roll tube (separate) | 2 | 108 x 108, tube 118 x 8 | Top center, under the tube | Unrolls downward in 6 steps. Tinted per shot: yellow, coral, sage | Build tabletop 45–85% |
| grip.platform | Red cardboard hero platform, taller box (see the platform spec below) | 3 | 112 x 76 | Bottom center of the box; contact point at the lid center | Off to the right at the gear pile, carried in 6 hop steps, placed | Build tabletop 0–45% |
| grip.flag | Black flag on a C-stand | 3 | 26 x 140 | Stand base | Hidden, standing | Build tabletop 92% |
| grip.gear-pile | Apple boxes and a sandbag | 3 | 46 x 30 | none | Static | none |
| grip.rig | C-stand pole, arm, and head: fork for the cheese pull, bottle clamp for the sauce | 3 | Pole 20 x 150, arm 100 x 10 | Pole base | Pieces appear in order: pole, arm, head | Rig the pull, Mount bottle (thirds) |
| elec.keylight-stand | Rolling light stand with wheels | 4 | 30 x 125 | Base center | Parked by the wall, rolled to its mark in 5 steps | Any lighting task 0–40% |
| elec.keylight-head | Softbox head (separate from the stand) | 4 | 56 x 34 | Yoke, where it meets the stand | Rotates from -12° to 34°. Face: off, on (glowing), dead (dark with sparks) | Lighting task 40–80% aim, 80–100% on. Chaos sets dead |
| elec.beam | Light wedge from the key to the burger | 5 | 150 x 60 | Light face | Opacity 0 to 0.5, multiply or screen blend | Light state |
| elec.fill | Small fill light on a stand | 4 | 30 x 110 | Base | Hidden, standing on | Light the burger 50% |
| elec.backlight | Light hanging from the grid | 2 | 20 x 60 | Hang point | Lowers 26 units, then switches on | Add backlight |
| elec.dead-fx | Sparks and a warning badge | 9 | 60 x 40 | none | Shown while the key light is dead | Chaos event |
| cam.track | Dolly track | 3 | 126 x 12 | none | Static | none |
| cam.camera | Camera body on a dolly base | 6 | 52 x 90 | Dolly base center | Slides to a mark per setup: hero, cheese, sauce. REC light off or on | Frame task 0–50% |
| cam.lens | Lens, separate from the body | 6 | Standard 19 x 14, macro 31 x 14 | Lens mount | Standard for the hero shot, macro for close-ups | Frame task 50–80% |
| cam.frame-marks | Four corner brackets around the burger | 8 | 70 x 56 | none | Fade in as framing finishes | Frame task 60–100% |
| art.table | Styling cart with paint cans | 3 | 72 x 40 | none | Static | none |
| art.burger-build | Burger in 5 separate layers: bottom bun, patty, cheese, lettuce, top bun | 4 | 26 x 18 on the cart | Each layer's bottom center | Layers stack one by one | Style burger 20% per layer |
| art.cheese-pot | Pot, cheese fill, steam | 4 | 18 x 16 | Pot base | Fill rises 0–100%, three-frame steam while fresh, dull tint when spoiled | Melt cheese |
| art.sauce-bowl | Bowl and sauce | 4 | 16 x 10 | none | Sauce fades in | Prep sauce |
| prop.burger | Hero burger | 5 | 60 x 40 | Bottom center | Travels from the art cart (42% scale) to the platform (100%) in 5 hop steps | Place burger |
| prop.cheese | Burger with a separate top bun and three stretchy cheese strands | 5 | 60 x 62 | Bun lifts from the patty line | Top bun lifts 0–22 units, strands stretch with it | Cheese Pull ACTION |
| prop.sauce | Sauce bottle, pour stream, sauce drip on the bun | 5 | Bottle 14 x 26 | Bottle nozzle | Stream animates, drip appears | Sauce Pour ACTION |
| village.monitor | Monitor on a stand with a screen inset | 6 | 60 x 100 | Stand base | Color bars, live view of the shot, REC dot | Framing progress |
| village.chairs | Two director's chairs, blank backs | 7 | 36 x 44 | Chair base | Static. Labels drawn by the engine | none |
| crafty.table | Craft services table: coffee urn, donuts, cups | 7 | 150 x 60 | none | Static. Idle crew stand here | none |

## Crew puppets

Build one modular paper puppet and dress it, instead of drawing every crew member separately. There are 13 hireable crew plus the client, agency rep and receptionist, and more will come with Production Week. A puppet is 48 units tall, feet at its origin, shown at 1.25x on set. It faces right, and the engine mirrors it to face left.

| Part | Pivot | Notes |
| --- | --- | --- |
| Head (face shape) | Neck | Skin tone tinted by the engine, or one file per tone |
| Hair and hats | Head top | Cap, beanie, bun, beret, slicked, messy, none |
| Face extras | Head | Eyes, the big round nose from the concept, glasses, beard, mustache, earring |
| Torso | Hips | Tinted by department color: grip blue, electric mustard, camera sage, art coral |
| Back arm | Shoulder | Two-frame swing for walking |
| Front arm | Shoulder | Rotates for work actions. The hand is the anchor for held items |
| Legs (two) | Hip | Four-frame walk cycle |

**File names for the puppet parts** (the loader looks for exactly these, see `art/README.md`). Parts attach at the joint named in the pivot column, in the part's own pixels.

| ID | Part | States |
| --- | --- | --- |
| `crew.head` | Head, neutral light so the engine can tint skin | `default` |
| `crew.torso` | Torso, neutral light so the engine can tint the department color | `default` |
| `crew.arm-front`, `crew.arm-back` | Arms | `default`, then poses like `work` |
| `crew.leg-front`, `crew.leg-back` | Legs | `default`, then `walk1` to `walk4` later |
| `crew.hair.<look>` | Hair and hats | `cap`, `beanie`, `bun`, `beret`, `slick`, `default` |
| `crew.face.<extra>` | Face extras, each on a canvas the size of the head | `eyes`, `nose`, `beard`, `mustache`, `glasses`, `earring` |

Required for the real puppet to be used: head, torso, front arm, both legs. Everything else is optional, and a missing part is simply left out.

**Fixed characters** (individually designed crew such as Ro the Gaffer). The art is the whole character, so it is never tinted and gets no face or hair overlays. Every character uses the same shared animation rig, so walk, work and later reactions need no new code per character.

| ID | Part | Pivot (in the part's own pixels) |
| --- | --- | --- |
| `crew.ro.head` | Head with hat, hair and face, plus a short neck stub | Bottom center of the neck stub |
| `crew.ro.torso` | Shirt and belt, without sleeves | Bottom center of the hem |
| `crew.ro.arm-front`, `crew.ro.arm-back` | Sleeve, forearm and hand in one piece, hanging straight | Center of the round sleeve cap at the top |
| `crew.ro.leg-front`, `crew.ro.leg-back` | Trouser leg and boot, with the rounded hip tab at the top | Center of the hip tab |
| `crew.ro.json` | Scale, joints (where each part attaches, puppet units, feet at 0,0) and the hire card head crop | |

Pose variants use the same names with a state: `crew.ro.arm-front.work@8x.png`. A new character is these files plus one line in `src/slots.js`. Long term the shared rig mixes both kinds: a character's own head and outfit, with library parts for anything it does not have.

**Poses and states** (two or three frames each, stop-motion timing):

| State | Look | When |
| --- | --- | --- |
| Idle | Weight shift, coffee in hand at crafty | No work |
| Walk | Four-frame cycle, carrying the department item | Moving between stations (Milestone B) |
| Work, grip | Hammering or tightening | Building and rigging |
| Work, electric | Reaching up to adjust the light | Lighting tasks |
| Work, camera | Bent to the eyepiece, hand on the camera | Framing |
| Work, art | Leaning in with tweezers | Styling, placing |
| Blocked | Shrug, or pointing at the missing setup | Waiting on a dependency or a dead light |
| Mistake | Fumble and a paper "oops" puff | A botched task |
| Celebrate | Arm up, short hop | Finishing a long task |
| Hesitate | Glance at the call sheet | Less experienced crew between tasks (Milestone B) |

**Held items** (anchored to the front hand, about 12 x 10 units): grip sandbag and hammer, electric light head and gel, camera lens case, art plate with burger and tweezers.

## HQ assets

The office is a cutaway building 360 x 470 units. Each room is a 152 x 112 box seen straight on, so room art drops into the same frame whatever state it's in.

| ID | Piece | Size | States |
| --- | --- | --- | --- |
| hq.shell | Brick building with floors and room frames, roof edge | 336 x 340 | Static |
| hq.sign | Marquee sign board with bulbs | 220 x 34 | Bulbs on or off. The company name is drawn by the engine because players can rename it |
| hq.room.edit | Edit Bay interior | 152 x 112 | For rent (dark, sign), under construction (Milestone D), built (desk, two monitors, editor) |
| hq.room.craft | Craft Services interior | 152 x 112 | For rent, under construction, built (counter, urn, donuts, plant) |
| hq.room.gear | Gear Cage interior | 152 x 112 | For rent, under construction, built (mesh wall, lights on shelves, cases, sandbags) |
| hq.room.kitchen | Prep Kitchen interior | 152 x 112 | For rent, under construction, built (stove with steam, fridge, burger plate) |
| hq.for-rent | Hanging FOR RENT card | 84 x 40 | The price is drawn by the engine |
| hq.lobby | Lobby: front door, reception desk, plant | 312 x 84 | Static, the receptionist is a puppet |
| hq.jobboard | Cork board with pinned flyers | 116 x 58 | Flyers are separate pieces, one per job, so the board fills as jobs arrive |
| hq.street | Sidewalk, road, lane marks | 360 x 86 | Static |
| hq.van | Grip and electric van, blank side | 140 x 56 | Parked. Later: driving in and out |
| hq.sky | Sky, sun, paper clouds | 360 x 70 | Clouds drift (Milestone D) |
| hq.ambient | Walking crew, a dog, a hand truck with cases | Puppet scale | Ambient loops (Milestone D) |

## UI and effects

| ID | Piece | Size | Notes |
| --- | --- | --- | --- |
| ui.logo | THAT'S A WRAP! sticker | 340 x 220 px at 1x | **In use now**, cut from the concept art. Needs a clean high-res version |
| ui.shot-thumbs | Hero Burger, Cheese Pull, Sauce Pour polaroid photos | 120 x 105 px at 1x | **In use now**, cut from the concept art. Needs clean 3x versions without the polaroid border |
| ui.paper-grain | Seamless paper fiber tile, neutral gray | 256 x 256 px | **Retired as a whole-set overlay.** Each asset carries its own paper texture in its art. The tile is kept in `src/assets.js` but nothing draws it |
| ui.card | Torn paper card frame, nine-slice | Corners 24 px | For panels, chaos card, wrap report |
| ui.tape | Masking tape strip | 60 x 18 | Pinning labels |
| ui.clapper | Clapperboard: board and hinged stick, separate | 100 x 70 | Stick pivot at its left hinge. Used for the ACTION button and the in-scene clap |
| ui.dept-icons | Grip, electric, camera, art, fix | 24 x 24 | Station badges and task icons. Simple shapes that read at 16 px |
| ui.chaos-icons | Wrench, van, lightning bolt | 34 x 34 | Chaos options |
| ui.star | Star on and off | 46 x 46 | Wrap report |
| fx.spotlight | Soft elliptical spotlight mask | 124 x 88 | Used when rolling |
| fx.sparkle | Burst lines around the hero burger | 80 x 40 | Hero ACTION |
| fx.puff | Paper cloud with room for a word | 40 x 26 | Mistakes |
| fx.steam | Three-frame steam curl | 12 x 12 | Cheese pot, prep kitchen |

## First art pass, in priority order

Start where the eye goes and where code-drawn shapes look weakest. The asset loader uses delivered files and keeps the temporary art for the rest, so each batch can ship on its own.

1. **One modular crew puppet** with all parts and the four work poses. This proves the rig before anyone draws 16 people.
2. **The hero corner:** platform, sweep, burger in all states, burger-build layers.
3. **Electric and camera:** key light stand and head (all three face states), fill light, camera body with both lenses, dolly track.
4. **Rest of the set:** flats, grid, plants, art cart, cheese pot, rigs, crafty, village.
5. **HQ:** shell, sign board, four rooms in the for-rent and built states, lobby, van.
6. **UI:** clean logo, shot thumbnails, card frame, clapper, icons.

When a batch arrives, it goes in the `art/` folder and the build packs it. The asset loader is in place, so no code changes are needed for the wired pieces: `grip.platform`, `elec.keylight-head` (off, on, dead), `art.burger-build`, the generic `crew.*` puppet and fixed characters (`crew.ro.*`). Batch 1 (platform, key light, Ro) is in, see `docs/project/Art-Batch-1-Validation.md`. Each piece can have a small `<dept>.<object>.json` for pivot and scale. The build prints what it found and warns about wrong scales, so a bad batch is caught before anyone looks at the screen. Every state is then checked against this list.
