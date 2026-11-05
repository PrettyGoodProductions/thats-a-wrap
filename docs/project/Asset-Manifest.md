# That's a Wrap! Asset Manifest

Nov 5, 2026 (revision 8: batch 5 set pieces wired, pole is a tripod C-stand 162 tall, hq.sign and Edit Bay for-rent wired. Revision 7: batch 4 HUD frames sliced and wired. Revision 6: batch 4 set and HUD pieces. Revision 5: batch 3 props and set pieces wired. Revision 4: Mika, Dani and Lu delivered. Revision 3: wide landscape set, pop-up HUD, pelvis on the crew rig) · @Tomás Valladares

Every piece of art the game needs, cut the way the engine moves it, with the exact size to export. Drop finished files in `art/`, rebuild, and the game uses them. Anything not delivered keeps its temporary code-drawn look, so pieces can arrive in any order.

**How to read the tables.** Sizes are in set units. The export column is the PNG size at the scale for that kind of piece. Positions are where the piece sits on the wide landscape set (see coordinates below). "Wired" says whether the game already uses a delivered file today. "Ready" pieces still need about 15 minutes of wiring when their first file arrives, and you do not have to wait for that before drawing them.

## Delivery rules

One object per file, on a transparent background, cut along the paper edge. The engine moves, swaps and lights each piece, so nothing is painted into a shared background.

| Rule | Spec |
| --- | --- |
| Format | PNG-32, sRGB, straight (not premultiplied) alpha. Larger masters are welcome, `tools/prep_art.py` fits them to these sizes |
| Scale by kind | **Set props and lights: 6 px per set unit** (`@6x`). **Crew parts: 8 px per unit** (`@8x`, they also show large on the crew cards). **Wall flats and floor: 5 px per unit** (`@5x`). **HUD pieces: 3 px per CSS pixel** (`@3x`, sizes given in CSS px) |
| Why those scales | Measured on batch 1: sharp on a 3x phone held sideways and on a 2x tablet, with 1.1x to 1.8x headroom, at a fraction of the file weight |
| Texture | Every piece carries its own paper texture: fibers, torn edges, layered cut shapes, the soft shadow between its own layers. There is no texture laid over the whole screen. Keep the fiber grain about the same real size on every piece (roughly one fleck per set unit), so a 6x prop and a 5x wall look like the same paper |
| Transparency | Fully transparent background. No glow or halo baked in. Nothing between alpha 1 and 7 (clip it to 0), no stray specks, about 4 px of empty margin |
| Shadows | Keep shadows inside a piece. Do not paint cast shadows on the floor or wall: the engine adds them so they move with the object |
| Light | Front three-quarter view, slightly elevated, the angle of the concept art. Light from the upper left |
| Facing | Characters, lights and the camera face right, toward the stage. The engine mirrors them when they face left |
| States | Every state of a piece on one identical canvas, with anything that does not change at exactly the same pixels. The game swaps states in place, so any drift shows as a jump |
| No baked text | Anything the game changes stays out of the art: company name, chair labels, client logo, shot names, numbers, prices |
| Naming | `dept.object[.state]@6x.png`, for example `elec.keylight-head.on@6x.png`. Characters: `crew.<name>.<part>@8x.png`. Lower case, no spaces |
| Pivots and points | The pivot is the point a piece turns or slides around, given in the piece's own pixels. Some pieces also name points, such as where the burger sits. Send them in a note or in `<id>.json` next to the files |

## Set coordinates

The set is one wide stage in set units, x to the right and y down. The floor line runs from about y 152 on the left to y 145 on the right.

| Area | x | y |
| --- | --- | --- |
| Always on screen | -150 to 510 | -40 to 296 |
| Stage (the original set, unchanged) | 0 to 360 | -70 to 230 |
| Video village (left) | -110 to 60 | 180 to 296 |
| Craft table, where idle crew wait (right) | 310 to 470 | 230 to 296 |
| Wall flats and floor keep going past the screen edges | -600 to 960 | -300 to 600 |

A phone held sideways (844 x 390 px) shows about 1.16 CSS px per set unit. A 1280 x 800 tablet shows about 1.94. A wider or taller screen just shows more of the set, so the wall flats and floor run well past the edges of the frame.

## Stage and set dressing

Layers run back to front: 0 is the wall, 9 is effects over everything.

### Wall, ceiling and floor

| ID | Piece | Size (units) | Export | Position | States | Wired |
| --- | --- | --- | --- | --- | --- | --- |
| set.wall | Deep blue backing behind the flats, seamless tile | tile 200 x 200 | 1000 x 1000 @5x | Fills -600 to 960 | Static | **Wired** (batch 4) |
| set.flat-1 | Blue flat, left of the stage | 82 x 204 | 410 x 1020 | x -8 to 74, y -52 to 152 | Static | **Wired** (batch 4) |
| set.flat-2 | Brick red flat | 74 x 183 | 370 x 915 | x 60 to 134, y -31 to 152 | Static | **Wired** (batch 4) |
| set.flat-3 | Mustard flat above the sweep | 72 x 84 | 360 x 420 | x 144 to 216, y -44 to 40 | Static | **Wired** (batch 4) |
| set.flat-4 | Sage flat | 72 x 186 | 360 x 930 | x 228 to 300, y -34 to 152 | Static | **Wired** (batch 4) |
| set.flat-5 | Dark corrugated flat | 76 x 208 | 380 x 1040 | x 290 to 366, y -56 to 152 | Static | **Wired** (batch 4) |
| set.flat-6 | Kraft flat, far left | 104 x 196 | 520 x 980 | x -250 to -146, y -42 to 154 | Static | **Wired** (batch 4) |
| set.flat-7 | Mustard flat, left | 88 x 174 | 440 x 870 | x -160 to -72, y -20 to 154 | Static | **Wired** (batch 4) |
| set.flat-8 | Plum flat, left | 80 x 203 | 400 x 1015 | x -86 to -6, y -50 to 153 | Static | **Wired** (batch 4) |
| set.flat-9 | Red flat, right | 78 x 196 | 390 x 980 | x 354 to 432, y -50 to 146 | Static | **Wired** (batch 4) |
| set.flat-10 | Cream flat, right | 84 x 173 | 420 x 865 | x 418 to 502, y -28 to 145 | Static | **Wired** (batch 4) |
| set.flat-11 | Sage flat, far right | 110 x 200 | 550 x 1000 | x 490 to 600, y -56 to 144 | Static | **Wired** (batch 4) |
| set.call-sheet | Call sheet pinned on the right flat | 52 x 36 | 312 x 216 | (436, 0) top left | Static | **Wired** (batch 4) |
| set.poster | Client poster card, blank: the engine writes the client name | 44 x 34 | 264 x 204 | (18, 16) top left, tilted -5° | Static | **Wired** (batch 4) |
| set.grid | Ceiling pipes, seamless strip | tile 200 x 24 | 1000 x 120 @5x | y -58 to -34, full width | Static | **Wired** (batch 4) |
| set.practical-red, set.practical-sage | Hanging practical lamp, two colors (red, sage) | 24 x 40 | 144 x 240 | Hang points (58, -54) and (306, -54) | `off`, `on` | **Wired** (batch 4, one ID per color) |
| set.overhead-flag | Black flag hanging from the grid | 44 x 34 | 264 x 204 | Hang point (192, -54) | Static | **Wired** (batch 4) |
| set.floor | Kraft paper floor, seamless tile | tile 200 x 200 | 1000 x 1000 @5x | Below the floor line, everywhere | Static | **Wired** (batch 4) |
| set.floor-scuffs | Lighter worn patches, a few loose pieces | about 120 x 30 each | @5x | Scattered | Static | **Wired** (batch 4) |
| set.tape-mark | Yellow tape X, crew marks on the floor | 10 x 6 | 60 x 36 | (181, 233), (326, 234), (102, 228) | Static | **Wired** (batch 4) |
| set.cable | Black cable snaking across the floor | 230 x 80 | 1380 x 480 | From the key light (74, 198) to the right | Static | **Wired** (batch 4) |
| set.plant-1 | Potted plant, terracotta pot | 40 x 70 | 240 x 420 | Pot base at (22, 152) | Static, optional 2-frame sway | **Wired** (batch 4) |
| set.plant-2 | Potted plant, mustard pot | 34 x 56 | 204 x 336 | Pot base at (331, 152) | Static | **Wired** (batch 4) |

### Grip

| ID | Piece | Size | Export | Pivot and position | States and motion | Driven by | Wired |
| --- | --- | --- | --- | --- | --- | --- | --- |
| grip.sweep | Paper sweep curving down onto the floor | 108 x 108 | 648 x 648 | Top center under the tube, (180, 30) | Unrolls downward in 6 steps. Deliver neutral light paper: it is tinted per shot (yellow, coral, sage) | Build tabletop 45 to 85% | **Wired** (batch 3, tinted per shot in game) |
| grip.sweep-tube | Roll tube the sweep hangs from | 118 x 8 | 708 x 48 | Center (180, 28) | Static | | **Wired** (batch 3) |
| grip.platform | Hero platform, taller box (spec below) | 112 x 76 | 672 x 456 | Bottom center of the box at (184, 192). Point: `contact` | Carried in from the gear pile in 6 hops, placed | Build tabletop 0 to 45% | **Wired**, taller box from batch 3 |
| grip.flag | Black flag on a C-stand | 26 x 140 | 156 x 840 | Stand base at (262, 202) | Hidden, standing | Build tabletop 92% | **Wired** (batch 5) |
| grip.gear-pile | Two apple boxes and a sandbag | 46 x 30 | 276 x 180 | Bottom left at (246, 202) | Static | | **Wired** (batch 5) |
| grip.rig-pole | C-stand for the cheese pull and sauce pour: pole on a tripod base | 46 x 162 (delivered, clamp 17 below the top) | 276 x 972 | Base at (292, 202) | Appears | Rig the pull, mount bottle, first third | **Wired** (batch 5) |
| grip.rig-arm | Horizontal arm with knuckle | 100 x 10 | 600 x 60 | Knuckle at (292, 58) | Appears | Second third | **Wired** (batch 5) |
| grip.rig-fork | Fork head for the cheese pull, on a drop rod | 12 x 30 | 72 x 180 | Rod top at (197, 58); the rod stretches to reach the burger | Appears | Rig the pull, last third | **Wired** (batch 5) |
| grip.rig-bottle | Sauce bottle in a clamp, tilted 28° | 14 x 32 | 84 x 192 | Clamp at (197, 58) | Appears | Mount bottle, last third | **Wired** (batch 5) |

### Electric

| ID | Piece | Size | Export | Pivot and position | States and motion | Driven by | Wired |
| --- | --- | --- | --- | --- | --- | --- | --- |
| elec.keylight-stand | Rolling stand: three legs with wheels, pole | 30 x 126 | 180 x 756 | Base center (72, 202). Pole top at (72, 76) carries the head | Parked by the wall, rolled 44 units to its mark in 5 steps | Any lighting task 0 to 40% | **Wired** (batch 3) |
| elec.keylight-head | Softbox head | 56 x 34 | 336 x 204 | Yoke ring on the pole top (72, 76) | Turns -12° to 34°. `off`, `on`, `dead` | Aim 40 to 80%, on 80 to 100%. Chaos sets `dead` | **Wired**, batch 1 |
| elec.beam | Soft light wedge from the key to the burger | 150 x 60 | 900 x 360 | Light face end | Fades 0 to 50%. Deliver white to warm paper, the engine sets opacity | Light state | **Wired** (batch 5) |
| elec.fill | Small fill light on a stand | 30 x 110 | 180 x 660 | Base (240, 206) | Hidden, standing on | Light the burger 50% | **Wired** (batch 3, flipped to face left) |
| elec.fill-beam | Fill light wedge | 50 x 30 | 300 x 180 | Light face | Fades | Fill on | **Wired** (batch 5) |
| elec.backlight | Light hanging from the grid, with a soft cone | 20 x 60 | 120 x 360 | Hang point (214, -54) | Lowers 26 units, then on | Add backlight | **Wired** (batch 5) |
| elec.dead-fx | Sparks and a red warning badge | 60 x 40 | 360 x 240 | Around the key head | Shown while the key light is dead | Chaos event | **Wired** (batch 5) |

### Camera

| ID | Piece | Size | Export | Pivot and position | States and motion | Driven by | Wired |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cam.track | Dolly track, seamless rail section | 126 x 12 | 756 x 72 | (232, 212) top left | Static | | **Wired** (batch 3) |
| cam.camera | Camera body on a tripod and dolly base, without the lens | 54 x 90 | 324 x 540 | Dolly base center (304, 210) | Slides to a mark per setup. `rec-off`, `rec-on` | Frame task 0 to 50% | **Wired** (batch 3, needs re-export (bottom margin)) |
| cam.lens | Lens, separate from the body | standard 19 x 14, macro 31 x 14 | 114 x 84 and 186 x 84 | Mount on the body front (289, 138) | `standard` for the hero shot, `macro` for close-ups | Frame task 50 to 80% | **Wired** (batch 3, standard and macro) |
| cam.frame-marks | Four red corner brackets around the burger | 70 x 56 | 420 x 336 | Centered on the burger | Fade in as framing finishes | Frame task 60 to 100% | **Wired** (batch 3) |

### Art department and props

| ID | Piece | Size | Export | Pivot and position | States and motion | Driven by | Wired |
| --- | --- | --- | --- | --- | --- | --- | --- |
| art.table | Styling cart on wheels with paint cans | 72 x 40 | 432 x 240 | Bottom left (10, 212) | Static | | **Wired** (batch 5) |
| art.burger-build | Burger in 5 layers on the cart: bottom bun, patty, cheese, lettuce, top bun | whole stack about 26 x 18 | each layer on its own 156 x 108 canvas | Each layer's bottom center, stacked on the cart at (25, 165) | Layers appear one by one | Style burger, 20% per layer | **Wired** |
| art.cheese-pot | Pot with a separate cheese fill and steam | 18 x 16 | 108 x 96 | Pot base (52, 171) | Fill rises, three-frame steam while fresh, dull tint when spoiled | Melt cheese | **Wired** (batch 3, fill clipped to the opening) |
| art.sauce-bowl | Bowl, sauce separate | 16 x 10 | 96 x 60 | Base (70, 173) | Sauce fades in | Prep sauce | **Wired** (batch 5) |
| prop.burger | Hero burger | 50 x 36 | 300 x 216 | Bottom center, sits on the platform's `contact` point | Hops from the art cart (42% size) to the platform in 5 steps | Place burger | **Wired** (batch 3) |
| prop.cheese | Burger with the top bun separate, plus three stretchy cheese strands | bun 46 x 18, base 50 x 22, strand 4 x 24 | @6x | Bun lifts from the patty line | Bun lifts 0 to 22 units, strands stretch with it | Cheese pull ACTION | **Wired** (batch 3, strands stretch with the lift) |
| prop.sauce | Sauce drip on the top bun, and a pour stream | drip 26 x 10, stream 6 x 14 | @6x | From the bottle nozzle | Stream animates, drip appears | Sauce pour ACTION | **Wired** (batch 3, drip and pour stream) |
| fx.sparkle | Burst lines around the hero burger | 80 x 40 | 480 x 240 | Centered over the burger | Two frames while rolling on the hero shot | Hero ACTION | **Wired** (batch 5) |

### Hero platform spec (revision 2)

The hero burger sits on the platform's **contact point**, and everything aimed at the burger (frame marks, light beams, the cheese-pull fork, the sauce bottle, the sparkle) follows that point. Batch 1's box is flat: its lid center lands at y 158, 30 units below where the stage was composed. The next export draws the same box taller so the lid center lands at y 128.

| Measure | Set units | Pixels at 6x |
| --- | --- | --- |
| Canvas | 112 x 76 | 672 x 456 |
| Box width, left edge to right edge | about 104 | about 624 |
| Front face height, floor to the lid's front edge | 56 | 336 |
| Lid depth on screen, front edge to back edge | about 16 | about 96 |
| Pivot: bottom center of the box | (56, 75) | (336, 450) |
| Contact point: center of the lid, where the burger's base sits | 64 above the box bottom, centered | (336, 66) |

Keep the batch 1 look: red paper sides, torn cream lid edges, corrugated edge.

### Video village and craft table

| ID | Piece | Size | Export | Pivot and position | States | Wired |
| --- | --- | --- | --- | --- | --- | --- |
| village.monitor | Monitor on a stand, with a dark screen inset the engine draws into | 60 x 98 | 360 x 588 | Stand base (-76, 286). Point: `screen`, the inset's top left | Static. The screen shows color bars, the live shot and a REC dot | **Wired** (batch 5) |
| village.chair | Director's chair with a blank back, one file used twice | 36 x 44 | 216 x 264 | Chair base (-14, 292) and (34, 292) | Static. The engine prints CLIENT and AGENCY on the backs | **Wired** (batch 5) |
| crafty.table | Craft services table: coffee urn, donut box, cups. The engine writes CRAFTY | 150 x 60 | 900 x 360 | Top left (314, 214) | Static | **Wired** (batch 5) |
| crafty.coffee | Paper coffee cup idle crew can hold | 5 x 7 | 30 x 42 | Base | Static | **Wired** (batch 5) |

## Characters

Every person is a paper puppet on one shared rig. Seven parts hang from named joints, and the same walk, work and reaction animations move every character. The rig walks the legs from the pelvis and keeps the planted boot on the floor, so walking needs no extra drawings.

### Parts of a character

Feet at the origin, facing right. A character is about 48 to 51 set units tall with a hat. Export at 8 px per unit, all parts of one character from one master at one scale (Ro's master is 27 px per unit).

| Part | File | What it is | Pivot (in the part's own pixels) |
| --- | --- | --- | --- |
| Head | `crew.<name>.head` | Head with hair, hat and face, plus a short neck stub | Bottom center of the neck stub |
| Torso | `crew.<name>.torso` | Shirt and belt, no sleeves. The shirt hem hangs over the pelvis waistband | Bottom center of the hem |
| Pelvis | `crew.<name>.pelvis` | Shorts-shaped piece with a waistband and two leg openings. Covers the tops of both legs | Center between the leg openings |
| Front arm | `crew.<name>.arm-front` | Sleeve, forearm and hand in one piece, hanging straight. The hand holds tools | Center of the round sleeve cap |
| Back arm | `crew.<name>.arm-back` | Same, for the far side | Center of the round sleeve cap |
| Front leg | `crew.<name>.leg-front` | Trouser leg and boot, rounded at the top | Center of the rounded top |
| Back leg | `crew.<name>.leg-back` | Same, for the far side | Center of the rounded top |

`crew.<name>.json` fits the character to the rig: scale, where each joint sits (feet at 0,0), and the head crop for crew cards. I write it from the parts sheet, so the parts sheet and an assembled reference help a lot.

Required: head, torso, front arm, both legs. Pelvis and back arm are optional but make the walk read much better.

Optional pose images replace one part during a pose: `crew.<name>.arm-front.work@8x.png` (reaching, holding a tool), `crew.<name>.head.blink`, `crew.<name>.head.oops`.

### Roster

Each of these can be a fixed character like Ro. Until a character arrives, that person stays code-drawn. Looks below are what the game shows today, as a starting point.

| Name | Job | Tier | Look today | Art |
| --- | --- | --- | --- | --- |
| Ro | Gaffer (electric) | Solid | Cap, full beard, warm tan skin | **Delivered**, with pelvis |
| Bo | Gaffer | Veteran | Cap, beard, deep brown skin | Needed |
| Lee | Gaffer | Newbie | No hat, light brown hair, fair skin | Needed |
| Inés | DP (camera) | Veteran | Beret, glasses, tan skin, dark hair | Needed |
| Mika | DP | Solid | Beanie, fair skin, shoulder-length brown hair | **Delivered** (batch 2), with pelvis |
| Sam | DP | Newbie | No hat, ginger hair, glasses, fair skin | Needed |
| Max | Grip | Veteran | Cap, beard, tan skin | Needed |
| Dani | Grip | Solid | No cap, curly brown hair, mustache, tan skin, green work shirt | **Delivered** (batch 2), with pelvis |
| Chuy | Grip | Newbie | Beanie, brown skin, black hair | Needed |
| Vera | Art | Veteran | Hair bun, earring, tan skin | Needed |
| Lu | Art | Solid | Dark curly hair in a bun, gold hoop earrings, brown skin, coral apron | **Delivered** (batch 2), with pelvis. Booked on the Burger Job, so not hirable there yet |
| Paz | Art | Vouched | Red hair in a bun, earring | Needed |
| Theo | Art | Vouched | Beanie, glasses, blond, fair skin | Needed |
| Kit | Art | Unknown | Teal hair, earring, no hat | Needed |
| Jules | Art | Unknown | Cap, glasses, deep brown skin | Needed |
| Client | Video village | | Slicked gray hair, glasses, navy suit, red tie | Needed |
| Agency | Video village | | Beret, latte in hand, black outfit | Needed |
| Receptionist | HQ lobby | | Glasses, gray cardigan | Needed |

The four to start with are the crew of the default shoot: **Mika, Ro, Dani, Lu**. All four are delivered. The delivered art is now the look of record for Mika, Dani and Lu, so the "Look today" cells for them describe the art, not the old code-drawn puppet.

### Proportions to match Ro (from batch 2)

The rig stretches nothing, so characters of different build look best when they are drawn to Ro's proportions. Batch 2 came in about 25% bigger in the torso, 35% longer in the arms and 5 to 18% shorter in the legs than Ro, and the engine compensates with a scale per character (Mika 25.7, Dani 25.6, Lu 26.5 source px per unit, so each stands 51.8 units). That works, but the long arms reach 16 units in the work animation against Ro's 11. For the next characters, draw all parts from one master at 27 px per unit, with these sizes in set units (pixels at 27 per unit in brackets):

| Part | Size in set units | At 27 px per unit |
| --- | --- | --- |
| Head with hair or hat, plus neck stub | 15 x 18 | 405 x 486 |
| Torso, hem to collar | 13.4 x 14.1 | 362 x 381 |
| Pelvis | 14.9 x 9.4 | 402 x 254 |
| Arm, sleeve cap to fingertips | 8.4 x 15.5 | 227 x 419 |
| Leg, rounded top to sole | 11.5 x 22.8 | 310 x 616 |
| Whole character, sole to top of head | 51.8 tall | 1399 |

Ranges of plus or minus 8% are fine, since the per-character scale absorbs them.

### Shared crew props

| ID | Piece | Size | Pivot | Notes |
| --- | --- | --- | --- | --- |
| crew.held.grip | Sandbag, hammer | 12 x 10 | Grip point | Held in the front hand |
| crew.held.electric | Gel frame, light head | 12 x 10 | Grip point | |
| crew.held.camera | Lens case | 10 x 8 | Grip point | |
| crew.held.art | Plate with burger, tweezers | 14 x 6 | Grip point | |
| crew.shadow | Soft paper floor shadow | 24 x 6 | Center | One file for everyone |

## HUD (landscape shoot)

The set fills the screen and the HUD floats on it in small paper pieces. Sizes are in CSS px for a phone held sideways, with the tablet size after the slash. Export at 3 px per CSS px, at the tablet size. Paper frames are nine-slice: give the corner size, and keep the middle plain enough to stretch. Text and numbers are drawn by the game.

| ID | Piece | Size (phone / tablet) | Notes |
| --- | --- | --- | --- |
| ui.logo | THAT'S A WRAP! sticker | 40 / 60 tall | **In use**, cut from the concept. Needs a clean version |
| ui.tag | Torn cream paper tag for the job name | 210 x 34 / 320 x 50, nine-slice, 10 px corners | Slight tilt is done by the engine **Wired** (batch 4, nine-slice) |
| ui.chip-dark | Dark rounded panel for budget, time and stars | 36 / 56 tall, nine-slice, 10 px corners | Behind light text **Wired** (batch 4, nine-slice) |
| ui.meter | Meter track and fill (green for budget, light green for spend) | 5 / 7 tall, any width | Two files: track, fill |
| ui.time-seg | One hour segment: empty, filled (yellow), overtime (coral) | 8 x 8 / 13 x 11 | Ten in a row |
| ui.star | Star filled and empty | 19 / 30 square | Also used on the wrap report at 46 **Wired** (batch 4) |
| ui.button-paper | Square coral-orange paper button (replaces the cream one) | 38 / 52 square, nine-slice | Pause and the pop-up close button. Icons separate **Wired** (batch 4, nine-slice) |
| ui.icon-pause | Pause bars | 20 / 26 | Ink, single color **Wired** (batch 4) |
| ui.crew-card (states: default, camera, lighting, art, grip, pre-tinted) | Crew portrait card frame, neutral light paper | 58 x 62 / 84 x 92 | The engine tints it by department and draws the portrait from the character's head **Wired** (batch 4, nine-slice) |
| ui.crew-ring | Status dot: working, waiting, blocked | 9 / 12 | Three files |
| ui.panel | Cream paper panel for the shot list tab and pop-up | 172 x 50 tab, up to 300 x 360 pop-up / 240 and 360 wide, nine-slice, 14 px corners | **Wired** (batch 4, nine-slice) |
| ui.polaroid | Polaroid frame for shot thumbnails | 40 x 31 / 60 x 46 inner photo | Thumbnails slot inside **Wired** (batch 4, nine-slice) |
| ui.shot-thumbs | Hero Burger, Cheese Pull, Sauce Pour photos | 120 x 92 photo at 3x | **In use**, cut from the concept. Need clean versions without the border |
| ui.shot-status | Done check, up-next play, pending circle | 17 / 22 | Three files **Wired** (batch 4) |
| ui.check | Set conditions marker: empty, partial ring, done | 14 / 20 | |
| ui.quest | Quest tracker pill, cream paper | 30 / 40 tall, nine-slice, pill ends | One line of text |
| ui.action | ACTION button: paper base plus a clapperboard with a separate stick | 104 x 92 / 140 x 124 | States: not ready (muted), ready (yellow), rolling (dark). Stick pivots at its left hinge |
| ui.dept-icons | Grip, electric, camera, art, fix | 24 / 32 | Station badges and task buttons. Read at 16 px |
| ui.station-badge | Round badge behind a department icon on the set | 18 set units | Progress ring drawn by the engine |
| ui.bubble | Speech bubble on the set: "?" waiting, "!" blocked, "..." idle | 40 x 15 set units | The engine bounces it for the next step. Text is drawn |
| ui.progress-ring | Ring over a working crew member | 14 set units | Fill drawn by the engine |
| ui.card | Torn paper card frame for chaos and the wrap report | nine-slice, 24 px corners | Full-screen cards |
| ui.chaos-icons | Wrench, van, lightning bolt | 34 / 44 | Chaos options |
| fx.spotlight | Soft spotlight mask | 124 x 88 set units | Used when rolling |
| fx.puff | Paper "oops" cloud | 40 x 26 set units | Mistakes |
| fx.steam | Three-frame steam curl | 12 x 12 set units | Cheese pot, prep kitchen |

Portrait mode (the HQ screens and today's portrait shoot) uses the same pieces at the same sizes.

## HQ

The office is a cutaway building 360 x 470 units, portrait. Each room is a 152 x 112 box seen straight on, so room art drops into the same frame whatever state it is in. Export at 6 px per unit.

| ID | Piece | Size | Export | States | Wired |
| --- | --- | --- | --- | --- | --- |
| hq.shell | Brick building with floors and room frames, roof edge | 336 x 340 | 2016 x 2040 | Static | Ready |
| hq.sign | Marquee sign board with bulbs, blank | 220 x 34 | 1320 x 204 | Bulbs on, off. The company name is drawn by the engine | **Wired** (batch 5) |
| hq.room.edit | Edit Bay interior | 152 x 112 | 912 x 672 | `for-rent` (dark), `building`, `built` (desk, two monitors, editor) | **Wired** for `for-rent` only (batch 5). `building` and `built` needed |
| hq.room.craft | Craft Services interior | 152 x 112 | 912 x 672 | `for-rent`, `building`, `built` (counter, urn, donuts, plant) | Ready |
| hq.room.gear | Gear Cage interior | 152 x 112 | 912 x 672 | `for-rent`, `building`, `built` (mesh wall, lights on shelves, cases, sandbags) | Ready |
| hq.room.kitchen | Prep Kitchen interior | 152 x 112 | 912 x 672 | `for-rent`, `building`, `built` (stove with steam, fridge, burger plate) | Ready |
| hq.for-rent | Hanging FOR RENT card, blank price | 84 x 40 | 504 x 240 | Static | Ready |
| hq.lobby | Front door, reception desk, plant | 312 x 84 | 1872 x 504 | Static. The receptionist is a character | Ready |
| hq.jobboard | Cork board | 116 x 58 | 696 x 348 | Static | Ready |
| hq.flyer | Job flyer pinned to the board, blank | 30 x 22 | 180 x 132 | One per job | Ready |
| hq.street | Sidewalk, road, lane marks | 360 x 86 | 2160 x 516 | Static | Ready |
| hq.van | Grip and electric van, blank side | 140 x 56 | 840 x 336 | Parked, later driving | Ready |
| hq.sky | Sky with a sun and paper clouds (clouds separate) | 360 x 70 | 2160 x 420 | Clouds drift later | Ready |

## What to send next, in priority order

1. **The taller hero platform** (spec above). Everything at the stage is aimed at its lid.
2. **Client and Agency as characters**, who sit in frame all game. (Mika, Dani and Lu arrived in batch 2, see Art-Batch-2-Validation.md.)
3. **The stage around the burger:** sweep and tube, key light stand, camera body and both lenses, dolly track, fill light, frame marks.
4. **Burger props:** hero burger, cheese pull pieces, sauce drip and stream, the 5 build layers, cheese pot, sauce bowl.
5. **Backdrop:** wall tile, the eleven flats, floor tile, grid strip, practicals, plants, poster, call sheet, cable, tape marks.
6. **Village and crafty:** monitor, chair, craft table.
7. **HUD:** tag, dark chip, paper panel, crew card frame, ACTION button, stars, icons, bubbles, clean logo and thumbnails.
8. **The rest of the roster,** then HQ.

Send files named as above, or unnamed with a short list of what each is. Masters at any size are fine.
