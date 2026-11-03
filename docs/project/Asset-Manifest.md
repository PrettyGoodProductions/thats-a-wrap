# That's a Wrap! Asset Manifest

Nov 3, 2026 · @Tomás Valladares

Every piece of art the game needs, cut the way the animation system moves it. Final art built to these specs drops in with no code changes beyond swapping the file.

## Delivery specs

One object per file, on a transparent background, cut along the paper edge. The engine moves, swaps and lights each piece, so nothing can be painted into a shared background.

| Rule | Spec |
| --- | --- |
| Format | Layered SVG preferred, one group per part with the part name as its id. Otherwise PNG at 3x |
| Scale | Sizes below are in set units. Deliver PNGs at 3x (a 112 x 60 platform is 336 x 180 px) |
| Set coordinates | The shoot set is 360 units wide and 410 tall, with the floor line at about y 150. Phones show it at about 1.08 px per unit |
| HQ coordinates | The office is 360 x 470 units |
| View | Front three-quarter, slightly elevated, the same angle as the concept art. Light from the upper left |
| Shadows | Keep the soft shadow between layers inside a piece. Do not paint cast shadows on the floor: the engine adds them so they move with the object |
| Pivots | Each piece rotates or slides around the pivot listed below. Mark it in the file name or a note, in the piece's own pixel coordinates |
| Naming | `dept.object.state@3x.png`, for example `elec.keylight-head.on@3x.png` |
| No baked text | Anything the game changes stays out of the art: company name, chair labels, client logo, shot names, numbers |
| Color variants | When a piece changes color per shot (the sweep), deliver a neutral light version the engine can tint, or one file per color |

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
| grip.platform | Red cardboard hero platform | 3 | 112 x 60 | Bottom center | Off to the right at the gear pile, carried in 6 hop steps, placed | Build tabletop 0–45% |
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
| ui.paper-grain | Seamless paper fiber tile, neutral gray | 256 x 256 px | **In use now**, made from the concept art's foam board. A real seamless tile would remove the faint repeat |
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

Start where the eye goes and where code-drawn shapes look weakest. When the first batch arrives, I'll add an asset loader that uses delivered files and keeps the temporary art for the rest, so each batch can ship on its own.

1. **One modular crew puppet** with all parts and the four work poses. This proves the rig before anyone draws 16 people.
2. **The hero corner:** platform, sweep, burger in all states, burger-build layers.
3. **Electric and camera:** key light stand and head (all three face states), fill light, camera body with both lenses, dolly track.
4. **Rest of the set:** flats, grid, plants, art cart, cheese pot, rigs, crafty, village.
5. **HQ:** shell, sign board, four rooms in the for-rent and built states, lobby, van.
6. **UI:** clean logo, shot thumbnails, card frame, clapper, icons.

When a batch arrives, I swap it in and check every state against this list.
