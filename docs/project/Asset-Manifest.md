# That's a Wrap! Asset Manifest

Nov 5, 2026 (revision 14: batch 8, Client, Agency, Receptionist and Theo delivered and wired, see Art-Batch-8-Validation.md. The rest of the roster is no longer hand-drawn: it comes from the crew kit, see Content-Roadmap.md and Crew-Kit-01-Request.md. Revision 13: HQ Complete delivered and wired, every non-character piece now in the game. Revision 12: batch 7 (Prototype Art 05 and HQ Test 06) delivered: wrench, grip icon, checks, progress ring, camera, held props, sign margins, HQ greybox approved, new hq.shell and Art Dept in all states. Revision 11: HQ redesigned as a landscape cutaway diorama, see HQ-Redesign.md. The batch 6 shell, lobby, street and flat rooms are retired. Revision 10: asset review after batch 6, decisions on the open questions, status column for the HUD, new asks for the wrench, grip icon and set check. Revision 9: batch 6, the HQ set, wired. Revision 8: batch 5 set pieces wired, pole is a tripod C-stand 162 tall, hq.sign and Edit Bay for-rent wired. Revision 7: batch 4 HUD frames sliced and wired. Revision 6: batch 4 set and HUD pieces. Revision 5: batch 3 props and set pieces wired. Revision 4: Mika, Dani and Lu delivered. Revision 3: wide landscape set, pop-up HUD, pelvis on the crew rig) · @Tomás Valladares

Every piece of art the game needs, cut the way the engine moves it, with the exact size to export. Drop finished files in `art/`, rebuild, and the game uses them. Anything not delivered keeps its temporary code-drawn look, so pieces can arrive in any order.

**How to read the tables.** Sizes are in set units. The export column is the PNG size at the scale for that kind of piece. Positions are where the piece sits on the wide landscape set (see coordinates below). "Wired" says whether the game already uses a delivered file today. "Ready" pieces still need about 15 minutes of wiring when their first file arrives, and you do not have to wait for that before drawing them. **Re-export** means the delivered file works or is parked, and a new export is requested. **To wire** means the file is delivered and approved, and only code work remains.

## Decisions (Nov 5)

| Question | Decision | Effect |
| --- | --- | --- |
| Front and back limbs | Every character has two arms and two legs. On the sheets the right-hand crop is the front (near) limb, as on Ro. Mika, Dani and Lu stay as fitted | New characters are named `arm-front`, `arm-back`, `leg-front`, `leg-back` |
| Lu and Theo | Lu is hirable on the Burger Job so her art shows in the prototype. Theo is booked in her place | Level data change |
| Fix it chaos icon | The game shows a wrench. No wrench has been delivered (the batch 5 set has a hammer in that slot) | Wrench added to the asks below. The hammer stays parked |
| Clean logo and shot thumbnails | Use them in place of the concept cut-outs | To wire |
| Darker cut-paper edges on gel frame, ACTION stick, set.flat-3, ui.button-paper | Intended | Ship as delivered. The audit warnings on these four are accepted |
| crafty.table | Keep the delivered art (1.97 to 1), scaled to fit inside the 150 x 60 footprint | Drawn about 118 x 60, centered in the footprint |
| Rig pole and flag | Keep the wider tripod feet | 46 wide is the spec of record |
| Polaroid window | Keep the wider window (1.64 to 1) | Thumbnails crop to 42 x 25.6 |
| Ro's loose hand (batch 1) | A spare grip hand for showing a hand closed on a prop | Kept as `crew.ro.hand`, optional. Used only if a pose needs it |
| HQ look | A cutaway diorama: rooms as open boxes with depth, a solid structure, layered city backdrop, crew inside the rooms | New HQ spec in HQ-Redesign.md |
| HQ orientation | **Landscape**, replacing the portrait HQ locked on Nov 3. The whole game is now landscape | HQ layout and UI respecified |
| HQ rooms | Production Office and Lounge (one double room), Lobby, Art Dept, Edit, Gear, Garage, one expansion slot. Rooms grow in levels. Craft Services becomes the lounge's coffee bar, Prep Kitchen becomes Art Dept level 2 | The batch 6 craft and kitchen rooms retire |
| HQ screen | Spec the whole screen: resource bar, week panel, next-up card, bottom nav, even for systems that come later | New UI pieces listed in HQ-Redesign.md |
| Batch 6 HQ art | Reuse what fits: sky, clouds, sign, van, FOR RENT card, job board, flyer | Shell, lobby, street and the flat rooms retire |

## Delivery rules

One object per file, on a transparent background, cut along the paper edge. The engine moves, swaps and lights each piece, so nothing is painted into a shared background.

| Rule | Spec |
| --- | --- |
| Format | PNG-32, sRGB, straight (not premultiplied) alpha. Larger masters are welcome, `tools/prep_art.py` fits them to these sizes |
| Scale by kind | **Set props and lights: 6 px per set unit** (`@6x`). **Crew parts: 8 px per unit** (`@8x`, they also show large on the crew cards). **Wall flats and floor: 5 px per unit** (`@5x`). **HUD pieces: 3 px per CSS pixel** (`@3x`, sizes given in CSS px) |
| Why those scales | Measured on batch 1: sharp on a 3x phone held sideways and on a 2x tablet, with 1.1x to 1.8x headroom, at a fraction of the file weight |
| Texture | Every piece carries its own paper texture: fibers, torn edges, layered cut shapes, the soft shadow between its own layers. There is no texture laid over the whole screen. Keep the fiber grain about the same real size on every piece (roughly one fleck per set unit), so a 6x prop and a 5x wall look like the same paper. A slightly darker cut-paper edge is fine and intended |
| Transparency | Fully transparent background. No glow or halo baked in. Nothing between alpha 1 and 7 (clip it to 0), no stray specks, about 4 px of empty margin. Art must never touch the canvas edge |
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
| set.flat-3 | Mustard flat above the sweep | 72 x 84 | 360 x 420 | x 144 to 216, y -44 to 40 | Static | **Wired** (batch 4, darker edge intended) |
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
| set.plant-1 | Potted plant, terracotta pot | 40 x 70 | 240 x 420 | Pot base at (22, 152) | Static, optional 2-frame sway (not delivered) | **Wired** (batch 4) |
| set.plant-2 | Potted plant, mustard pot | 34 x 56 | 204 x 336 | Pot base at (331, 152) | Static | **Wired** (batch 4) |

### Grip

| ID | Piece | Size | Export | Pivot and position | States and motion | Driven by | Wired |
| --- | --- | --- | --- | --- | --- | --- | --- |
| grip.sweep | Paper sweep curving down onto the floor | 108 x 108 | 648 x 648 | Top center under the tube, (180, 30) | Unrolls downward in 6 steps. Deliver neutral light paper: it is tinted per shot (yellow, coral, sage) | Build tabletop 45 to 85% | **Wired** (batch 3, tinted per shot in game) |
| grip.sweep-tube | Roll tube the sweep hangs from | 118 x 8 | 708 x 48 | Center (180, 28) | Static | | **Wired** (batch 3) |
| grip.platform | Hero platform, taller box (spec below) | 112 x 76 | 672 x 456 | Bottom center of the box at (184, 192). Point: `contact` | Carried in from the gear pile in 6 hops, placed | Build tabletop 0 to 45% | **Wired**, taller box from batch 3 |
| grip.flag | Black flag on a C-stand | 26 x 140 (tripod feet wider, as delivered) | 156 x 840 | Stand base at (262, 202) | Hidden, standing | Build tabletop 92% | **Wired** (batch 5) |
| grip.gear-pile | Two apple boxes and a sandbag | 46 x 30 | 276 x 180 | Bottom left at (246, 202) | Static | | **Wired** (batch 5) |
| grip.rig-pole | C-stand for the cheese pull and sauce pour: pole on a tripod base | 46 x 162 (confirmed Nov 5, clamp 17 below the top) | 276 x 972 | Base at (292, 202) | Appears | Rig the pull, mount bottle, first third | **Wired** (batch 5) |
| grip.rig-arm | Horizontal arm with knuckle | 100 x 10 | 600 x 60 | Knuckle at (292, 58) | Appears | Second third | **Wired** (batch 5) |
| grip.rig-fork | Fork head for the cheese pull, on a drop rod | 12 x 30 | 72 x 180 | Rod top at (197, 58); the rod stretches to reach the burger | Appears. Optional: short and long rod frames | Rig the pull, last third | **Wired** (batch 5) |
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
| cam.camera | Camera body on a tripod and dolly base, without the lens | 54 x 90 | 324 x 540 | Dolly base center (304, 210) | Slides to a mark per setup. `rec-off`, `rec-on` | Frame task 0 to 50% | **Re-exported** (batch 7) at 372 x 588 with 24 px padding. Draw at 62 x 98 units, offset (-4, -4), anchors +24 px. To wire |
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
| crafty.table | Craft services table: coffee urn, donut box, cups. The engine writes CRAFTY | Footprint 150 x 60. Delivered art is 1.97 to 1, so it is drawn about 118 x 60, centered in the footprint | 900 x 360 | Footprint top left (314, 214) | Static | **Wired** (batch 5). **To wire:** refit to the footprint (decision Nov 5) |
| crafty.coffee | Paper coffee cup idle crew can hold | 5 x 7 | 30 x 42 | Base | Static | **Wired** (batch 5) |

## Characters

Every person is a paper puppet on one shared rig. Seven parts hang from named joints, and the same walk, work and reaction animations move every character. The rig walks the legs from the pelvis and keeps the planted boot on the floor, so walking needs no extra drawings.

### Parts of a character

Feet at the origin, facing right. A character is about 48 to 51 set units tall with a hat. Export at 8 px per unit, all parts of one character from one master at one scale (Ro's master is 27 px per unit).

Each character has **two arms and two legs**. The front arm and front leg are the near side, toward the viewer, with the hand and toe pointing right. On the batch 1 and 2 sheets that is the right-hand crop. Name them front and back, never left and right.

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

Two optional keys in `crew.<name>.json` (batch 8): `order` sets the upper body's parts back to front when the art needs it (a torso with a painted armhole wants both arms on top), and `holds` names a held prop the character always carries (the Agency's latte).

Optional pose images replace one part during a pose: `crew.<name>.arm-front.work@8x.png` (reaching, holding a tool), `crew.<name>.head.blink`, `crew.<name>.head.oops`. None delivered yet.

Optional grip hand: `crew.ro.hand`, the loose hand from batch 1, shows a hand closed on a prop. It is kept for a pose that needs it and is not wired.

### Roster

Eight people are hand-designed and delivered. Everyone else is built by the game from the crew kit (Content-Roadmap.md), and stays code-drawn until the kit arrives. The art is the look of record for the delivered eight.

| Name | Job | Tier | Look | Art |
| --- | --- | --- | --- | --- |
| Ro | Gaffer (electric) | Solid | Cap, full beard, warm tan skin | **Delivered** (batch 1), with pelvis |
| Mika | DP | Solid | Beanie, fair skin, shoulder-length brown hair | **Delivered** (batch 2), with pelvis |
| Dani | Grip | Solid | No cap, curly brown hair, mustache, tan skin, green work shirt | **Delivered** (batch 2), with pelvis |
| Lu | Art | Solid | Dark curly hair in a bun, gold hoop earrings, brown skin, coral apron | **Delivered** (batch 2), with pelvis. Hirable on the Burger Job |
| Client | Video village | | Short gray hair, glasses, navy suit, red tie | **Delivered and wired** (batch 8) |
| Agency | Video village | | Black beret, black turtleneck, latte in hand | **Delivered and wired** (batch 8), with `crew.held.agency-latte` |
| Receptionist | HQ lobby | | Dark curly hair with a gray streak, cream glasses, gray cardigan | **Delivered and wired** (batch 8) |
| Theo | Art | Vouched | Blue beanie, glasses, blond curls, fair skin, sage jacket | **Delivered and wired** (batch 8). Booked on the Burger Job |
| Bo, Lee, Inés, Sam, Max, Chuy, Vera, Paz, Kit, Jules | Crew | | Code-drawn today | From the crew kit. Not hand-drawn |

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

| ID | Piece | Size | Pivot | Status |
| --- | --- | --- | --- | --- |
| crew.held.grip | Sandbag, hammer | 12 x 10 | Grip point | **Re-exported** (batch 7) as `crew.held.sandbag`, `crew.held.hammer`, grip points in `held-grip-points.json`. **Wired**: the game hangs each from the hand by its grip point |
| crew.held.electric | Gel frame, light head | 12 x 10 | Grip point | Same (`gel-frame`, `light-head`). Gel frame edge intended |
| crew.held.camera | Lens case | 10 x 8 | Grip point | Same (`lens-case`) |
| crew.held.art | Plate with burger, tweezers | 14 x 6 | Grip point | Same (`burger-plate`, `tweezers`) |
| crew.held.agency-latte | The Agency's paper cup | 4.7 x 7 | Where the hand holds it | **Delivered and wired** (batch 8). Rides under her near hand |
| crew.shadow | Soft paper floor shadow | 24 x 6 | Center | **Wired**. Drawn under every puppet |

## HUD (landscape shoot)

The set fills the screen and the HUD floats on it in small paper pieces. Sizes are in CSS px for a phone held sideways, with the tablet size after the slash. Export at 3 px per CSS px, at the tablet size. Paper frames are nine-slice: give the corner size, and keep the middle plain enough to stretch. Text and numbers are drawn by the game.

| ID | Piece | Size (phone / tablet) | Notes | Status |
| --- | --- | --- | --- | --- |
| ui.logo | THAT'S A WRAP! sticker | 40 / 60 tall | Clean version replaces the concept cut-out | Delivered (batch 5). **To wire** (decision Nov 5) |
| ui.tag | Torn cream paper tag for the job name | 210 x 34 / 320 x 50, nine-slice, 10 px corners | Slight tilt is done by the engine | **Wired** (batch 4) |
| ui.chip-dark | Dark rounded panel for budget, time and stars | 36 / 56 tall, nine-slice, 10 px corners | Behind light text | **Wired** (batch 4) |
| ui.meter | Meter track and fill (green for budget, light green for spend) | 5 / 7 tall, any width | Two files: track, fill | Delivered (batch 5), to wire |
| ui.time-seg | One hour segment: empty, filled (yellow), overtime (coral) | 8 x 8 / 13 x 11 | Ten in a row | Delivered (batch 5), to wire |
| ui.star | Star filled and empty | 19 / 30 square | Also used on the wrap report at 46 | **Wired** (batch 4) |
| ui.button-paper | Square coral-orange paper button | 38 / 52 square, nine-slice | Pause and the pop-up close button. Icons separate. Darker rim intended | **Wired** (batch 4) |
| ui.icon-pause | Pause bars | 20 / 26 | Ink, single color | **Wired** (batch 4) |
| ui.crew-card (default, camera, lighting, art, grip) | Crew portrait card frame | 58 x 62 / 84 x 92 | The engine draws the portrait from the character's head | **Wired** (batch 4) |
| ui.crew-ring | Status dot: working, waiting, blocked | 9 / 12 | Three files | Delivered (batch 5), to wire |
| ui.panel | Cream paper panel for the shot list tab and pop-up | 172 x 50 tab, up to 300 x 360 pop-up / 240 and 360 wide, nine-slice, 14 px corners | | **Wired** (batch 4) |
| ui.polaroid | Polaroid frame for shot thumbnails | Window 1.64 to 1 (kept, decision Nov 5) | Thumbnails crop to 42 x 25.6 | **Wired** (batch 4) |
| ui.shot-thumbs | Hero Burger, Cheese Pull, Sauce Pour photos | 120 x 92 photo at 3x | Clean versions replace the concept cut-outs | Delivered (batch 5). **To wire** (decision Nov 5) |
| ui.shot-status | Done check, up-next play, pending circle | 17 / 22 | Three files | **Wired** (batch 4). Up-next state delivered (batch 5), to wire |
| ui.check | Set conditions marker: empty, partial ring, done | 14 / 20 | Three states on one canvas | **Delivered** (batch 7), three 60 x 60 files, center (30, 30). To wire |
| ui.quest | Quest tracker pill, cream paper | 30 / 40 tall, nine-slice, pill ends | One line of text | Delivered (batch 5), to wire |
| ui.action | ACTION button: paper base plus a clapperboard with a separate stick | 104 x 92 / 140 x 124 | States: not ready (muted), ready (yellow), rolling (dark). Stick pivots at its left hinge. Stick edge intended | Delivered (batch 5), to wire |
| ui.dept-icons | Grip, electric, camera, art, fix | 24 / 32 | Station badges and task buttons. Read at 16 px | Delivered (batch 5). Grip icon (C-clamp) **delivered** (batch 7). To wire |
| ui.station-badge | Round badge behind a department icon on the set | 18 set units | Progress ring drawn by the engine | Delivered (batch 5), to wire |
| ui.bubble | Speech bubble on the set: "?" waiting, "!" blocked, "..." idle | 40 x 15 set units | The engine bounces it for the next step. Text is drawn | Delivered (batch 5), to wire |
| ui.progress-ring | Ring over a working crew member | 14 set units | Fill drawn by the engine | **Re-exported** (batch 7) as `track` and `fill`, 84 x 84, center (42, 42). Reveal the fill with a clockwise mask from 12 o'clock. To wire |
| ui.card | Torn paper card frame for chaos and the wrap report | nine-slice, 24 px corners | Full-screen cards | Delivered (batch 5), to wire |
| ui.chaos-icons | Wrench (Fix it), van, lightning bolt | 34 / 44 | Chaos options | Van and bolt delivered (batch 5). Wrench **delivered** (batch 7, the batch 3 drawing 080). The hammer stays parked. To wire |
| fx.spotlight | Soft spotlight mask | 124 x 88 set units | Used when rolling | Delivered (batch 5), to wire |
| fx.puff | Paper "oops" cloud | 40 x 26 set units | Mistakes | Delivered (batch 5), to wire |
| fx.steam | Three-frame steam curl | 12 x 12 set units | Cheese pot, prep kitchen | Delivered (batch 5), to wire |

The HQ screen is landscape too and reuses these pieces at the same sizes (see HQ-Redesign.md).

## HQ

**Redesigned Nov 5 as a landscape cutaway diorama. The full spec is in `HQ-Redesign.md`**: geometry, room cavities, states and levels, the screen layout and the new UI pieces. This section is the summary.

| ID | Piece | Size (HQ units) | Export | States | Status |
| --- | --- | --- | --- | --- | --- |
| hq.shell | Building front with room openings cut out, solid roof, slab, piers, end walls | 452 x 228 | 2712 x 1368 | Static | **Wired** (batch 7) |
| hq.roof | Rooftop dressing: tank, dish, vent | 452 x 40 | 2712 x 240 | Static | **Wired** (HQ Complete) |
| hq.room-sign | Blank paper tag for each room's name | 40 x 12 | 240 x 72 | Static | **Wired** (HQ Complete) |
| hq.room.office | Production Office and Lounge, double cavity | 208 x 96 | 1248 x 576 | `l1`, `l2`, `l3`, `front` | **Wired** (HQ Complete) |
| hq.room.art | Art Dept cavity | 100 x 96 | 600 x 576 | `for-rent`, `building`, `l1`, `l2`, `l3`, `front`, plus a spare `empty` | **Wired** (batch 7) |
| hq.room.edit | Edit cavity | 100 x 96 | 600 x 576 | same | **Wired** (HQ Complete) |
| hq.room.gear | Gear cavity | 100 x 96 | 600 x 576 | same | **Wired** (HQ Complete) |
| hq.room.lobby | Lobby cavity | 100 x 96 | 600 x 576 | Static, `front` | **Wired** (HQ Complete) |
| hq.room.garage | Garage cavity | 100 x 96 | 600 x 576 | Static | **Wired** (HQ Complete) |
| hq.slot.boarded | Boarded expansion slot | 100 x 96 | 600 x 576 | Static | **Wired** (HQ Complete) |
| hq.city-far, hq.city-near, hq.trees | Backdrop layers, seamless sideways | tiles 320 wide | @6x | Static | **Wired** (HQ Complete) |
| hq.sidewalk, hq.street | Seamless tiles | 160 x 20, 160 x 60 | @6x | Static | **Wired** (HQ Complete) |
| hq.plants-fg, hq.cone, hq.hydrant | Foreground plants and street props | see redesign | @6x | Static | **Wired** (HQ Complete) |
| hq.sky, clouds | Sky with sun, separate clouds | 360 x 70 | 2160 x 420 | Static | **Reused** (batch 6). Check the sun is clear of the rooftop sign |
| hq.sign | Marquee sign, now on the roof | 220 x 34 | 1320 x 204 | Bulbs on, off | **Re-exported** (batch 7) with margin. Off and on are not one master, so show `on` statically. **Needed:** `hq.sign.bulbs@6x.png`, a bulbs-only overlay on the off master |
| hq.van | Van parked at the curb | 84 wide | as delivered | Parked | **Reused** (batch 6) |
| hq.for-rent | FOR RENT card in a rented room's opening | 84 x 40 | 504 x 240 | Static | **Reused** (batch 6) |
| hq.jobboard, hq.flyer | Job board hotspot on the office back wall | | as delivered | Static | **Reused** (batch 6), size refit to the office wall |
| Retired | Batch 6 shell, lobby, street, and the flat edit, craft, gear and kitchen rooms | | | | Kept as reference only |

All office UI pieces are delivered and wired (HQ Complete): nav tabs and icons, badge, resource pill, money and favors icons, plus button, settings icon, primary button, arrow, day row and chip, clapper and info icons, next-up photo frame) are listed with sizes in `HQ-Redesign.md`.

## Wiring

Every delivered piece is wired as of Nov 5 (Art-Batch-7-Validation.md, Art-HQ-Complete-Validation.md). Parked on purpose: `fx.steam` (no prep-kitchen steam spot yet), the batch 5 hammer icon, the sign's off state. Where a status cell above still says "To wire", it is wired.

## What to send next, in priority order

All non-character art and the eight hand-designed characters are delivered. What remains:

1. **Crew Kit 01, the test batch:** 15 pieces (two bald base heads, hair, a cap, a beard, glasses, a tee and shorts). The full ask is Crew-Kit-01-Request.md, with the template in `docs/kit/`.
2. **Studio shell kit:** wall and floor materials, flats with openings, pattern overlays, ceilings. Sizes are in Art-Handoff-Nov5.md.
3. **Optional:** the two re-exports in Art-Batch-8-Validation.md, the `hq.sign.bulbs` overlay on the off master (so the sign can blink), pose images, plant sway, street cone and hydrant, short and long fork rod.

Send files named as above, or unnamed with a short list of what each is. Masters at any size are fine.
