# That's a Wrap! HQ redesign: the diorama office

Nov 5, 2026 · @Tomás Valladares · revision 1 · replaces the HQ section of Asset Manifest revision 10

The production office becomes a **cutaway diorama**: a two-story building seen slightly from above, with each room an open box you look into. Crew work inside the rooms, the van is parked at the curb, and the city sits behind. The office screen is **landscape**, like the shoot, so the phone never turns between screens. The reference is the "PGP HQ" concept (`Production_HQ_Concept.png` in the project).

## What makes the concept work

Keep these five things in every piece:

1. **Rooms are open boxes.** Each room shows a back wall, a floor, both side walls and a ceiling, all receding toward the center of that room. A lamp hangs from each ceiling. This is most of the 3D feel.
2. **The structure has thickness.** The roof edge, the floor slab between the stories, the piers between rooms and the end walls are solid blocks with a lit top face and a darker front face.
3. **Depth inside rooms.** Furniture is layered back to front. Crew stand and work on the room floor, in front of the back wall.
4. **Layered backdrop.** Sky, then city buildings, then trees, all behind the building. Sidewalk and street in front, the van at the curb, plants in the foreground corners framing the scene.
5. **Same paper.** Torn edges, fiber grain, layered cut shapes and soft shadows between layers, matching the shoot set.

## Rooms

Two stories of four bays. A bay is one room wide. Rooms grow in **levels** instead of being only built or not, so each room has room to scale.

| Bay | Upstairs | Ground floor |
| --- | --- | --- |
| 1 | **Production Office and Lounge** (double width, bays 1 and 2). Always built | **Lobby**: front door, reception desk, receptionist. Always built |
| 2 | (part of the office) | **Art Dept** |
| 3 | **Edit** | **Gear** |
| 4 | **Expansion slot**, boarded up | **Garage**: roll-up door, the van parks in front |

### Room levels (proposal, carries over today's four bonuses)

The four existing room effects move into the new rooms, so nothing in the economy is lost.

| Room | Level 1 | Level 2 | Level 3 |
| --- | --- | --- | --- |
| Production Office and Lounge | Desks, job board, couch. Built from the start | **Coffee bar**: everyone works 8% faster (today's Craft Services) | Conference table: better jobs and clients on the board |
| Art Dept | Work table, supplies, shelves | **Prep kitchen**: food stays fresh 40% longer, art works 15% faster (today's Prep Kitchen) | **Set shop**: miniatures and set builds, unlocks bigger art jobs |
| Edit | Desk and monitors: +10 quality on every shot (today's Edit Bay) | Color suite | Sound mix |
| Gear | Cage with lights and cases: a dead light is a free 2-second swap (today's Gear Cage) | More stands and lights, cheaper rentals | Grip truck replaces the van |

Craft Services and Prep Kitchen are no longer separate rooms. Craft Services becomes the lounge's coffee bar, and Prep Kitchen becomes Art Dept level 2.

### Room states

Every room is drawn in these states, each on one identical canvas:

| State | What it shows |
| --- | --- |
| `for-rent` | Dark, empty, dust sheets, the FOR RENT card hangs in the opening |
| `building` | Scaffold, tarp, a ladder, tape. Shown for about 1.6 s after building or upgrading |
| `l1`, `l2`, `l3` | Furnished at each level. Each level adds to the one before, so the back wall and floor stay put |

The expansion slot has only `boarded` (planks over the opening, a "coming soon" tag) until a future room is chosen.

## Geometry

All sizes are in HQ units. The scene is 640 x 360 (16:9). The building is left of center, and the right side is covered by the side panel. Backdrop layers run from x -160 to 800 so wider phones show more city, never empty bands.

### Building front

| Part | x | y |
| --- | --- | --- |
| Roof top face and cap | 40 to 492 | 56 to 72 |
| Upstairs openings | see bays | 72 to 168 |
| Floor slab (top face 6, front face 10) | 40 to 492 | 168 to 184 |
| Ground floor openings | see bays | 184 to 280 |
| Sidewalk | -160 to 800 | 280 to 300 |
| Street | -160 to 800 | 300 to 360 |

| Bay | Opening x | Pier after it |
| --- | --- | --- |
| Left end wall | 40 to 54 | |
| 1 | 54 to 154 | 154 to 162 |
| 2 | 162 to 262 | 262 to 270 |
| 3 | 270 to 370 | 370 to 378 |
| 4 | 378 to 478 | |
| Right end wall | 478 to 492 | |

The office upstairs spans bays 1 and 2 with no pier: opening x 54 to 262.

### Room cavity (the piece the room art fills)

Every single room is the same box, so any room's art drops into any bay.

| Measure | Single room | Double room (office) |
| --- | --- | --- |
| Opening, front edge | 100 x 96 | 208 x 96 |
| Back wall, centered in the opening | 72 x 68 | 180 x 68 |
| Side walls, each | 14 wide at the front, narrowing to the back wall | same |
| Ceiling band | 12 deep, lamp hangs from its center | two lamps |
| Floor band | 16 deep. Crew stand here | same |
| Export at 6 px per unit | 600 x 576 | 1248 x 576 |

The room art is one opaque picture of the whole cavity: back wall, side walls, ceiling, floor and furniture. The shell is drawn over it and hides the cut edge. Do not draw piers, slabs or the room's name sign into the room art.

Crew stand inside rooms at **0.6 of shoot scale** (about 31 units tall), on the floor band, in front of the furniture that sits against the back wall. Furniture that should stand in front of the crew (a desk front, a couch arm) goes in a separate `front` file on the same canvas.

## Art pieces

Export at 6 px per HQ unit unless noted. Same delivery rules as the rest of the manifest: PNG-32, straight alpha, nothing between alpha 1 and 7, no cast shadows on the ground, light from the upper left.

### Building and street

| ID | Piece | Size (units) | Export | States | Notes |
| --- | --- | --- | --- | --- | --- |
| hq.shell | Building front: roof cap, slab, piers, end walls, with the room openings cut out | 452 x 228 | 2712 x 1368 | Static | Openings exactly as in Geometry. Brick or plaster on the end walls, wood beams under the roof. The slab and roof show a lit top face |
| hq.roof | Rooftop dressing: water tank, satellite dish, vent, roof lip | 452 x 40 | 2712 x 240 | Static | Sits on the roof top face. Leave space centered at x 180 to 400 for the sign |
| hq.room-sign | Blank paper tag on the back wall of each room | 40 x 12 | 240 x 72 | Static | The engine writes the room name |
| hq.room.office | Production Office and Lounge cavity | 208 x 96 | 1248 x 576 | `l1`, `l2`, `l3`, plus `front` | Double room. Desks and job board left, couch and coffee right |
| hq.room.art | Art Dept cavity | 100 x 96 | 600 x 576 | `for-rent`, `building`, `l1`, `l2`, `l3`, plus `front` | |
| hq.room.edit | Edit cavity | 100 x 96 | 600 x 576 | same | |
| hq.room.gear | Gear cavity | 100 x 96 | 600 x 576 | same | |
| hq.room.lobby | Lobby cavity: door at the left, reception desk | 100 x 96 | 600 x 576 | Static, plus `front` (desk) | The receptionist is a character |
| hq.room.garage | Garage: roll-up door half open, tool wall | 100 x 96 | 600 x 576 | Static | The van parks on the street in front |
| hq.slot.boarded | Planks over an opening, blank "coming soon" tag | 100 x 96 | 600 x 576 | Static | Transparent where the cavity shows between planks |
| hq.city-far | Far city skyline, pale | tile 320 x 120 | 1920 x 720 | Static | Seamless sideways |
| hq.city-near | Nearer buildings, warmer color | tile 320 x 150 | 1920 x 900 | Static | Seamless sideways |
| hq.trees | Tree line behind the building | tile 320 x 80 | 1920 x 480 | Static | Seamless sideways |
| hq.sidewalk | Sidewalk with curb, seamless | tile 160 x 20 | 960 x 120 | Static | |
| hq.street | Street with lane marks, seamless | tile 160 x 60 | 960 x 360 | Static | Replaces the batch 6 street |
| hq.plants-fg | Foreground plants, left and right corners | about 90 x 110 each | @6x | Optional 2-frame sway | Cropped by the screen edge on purpose |
| hq.cone, hq.hydrant | Street props | about 12 x 20 | @6x | Static | Optional |

### Reused from batch 6

| ID | Use |
| --- | --- |
| hq.sky, clouds | As delivered. Check the sun sits clear of the rooftop sign |
| hq.sign | The marquee sign on the roof. Still wants about 4 px of margin |
| hq.van | Parked at the curb in front of the garage, as delivered |
| hq.for-rent | Hangs in the opening of a room that is for rent |
| hq.jobboard, hq.flyer | Hang on the back wall of the office as tappable hotspots (the job board opens Jobs) |
| hq.room.edit, hq.room.gear (batch 6) | Reference for the new cavities. Not used in the game |

**Retired:** the batch 6 shell, lobby, street and the four flat room pictures (edit, craft, gear, kitchen).

### Characters in the office

The same puppets as the shoot, at 0.6 scale, idle or working. Hired crew hang out in their department's room (gaffer and grip in Gear, art crew in Art Dept, DP in Edit), the receptionist stays in the lobby. The roster in the manifest covers them. Nothing new is needed beyond the receptionist.

## Screen layout

Landscape on every device. Sizes in CSS px for a phone held sideways (844 x 390), tablet after the slash (1280 x 800).

| Area | Where | Size | Contents |
| --- | --- | --- | --- |
| Top left | Over the sky | 34 / 60 tall | Logo sticker and the company name tag (tap to rename) |
| Top right | Over the sky | 30 / 44 tall | Money, reputation and favors pills, each with a "+" button, then settings |
| Right panel | Right edge, full height between the bars | 200 / 320 wide | Production week, Next up card, Weekly goal |
| Bottom nav | Full width | 52 / 88 tall | HQ, Jobs, Crew, Gear, Locations, Research, Reputation. Selected tab is yellow, red badges for counts |
| Building | Everything else | fills | Scaled to fit, centered in the space left of the panel |

**On a phone** the panel is too short for everything. It shows the Next up card, with the week as a row of five day chips across its top. The full week list and the weekly goal open from the chips. On a tablet everything shows, as in the concept.

**Tapping the building.** Each room is a hotspot. Tapping a room opens a paper pop-up: its name, level, what the next level does, and the cost. Tapping the job board opens Jobs, and tapping the van opens Gear.

**Planned systems.** Reputation, favors, the production week, Locations and Research do not exist in the game yet. The layout and art include them so the screen is designed once. Until a system exists, its pill reads a placeholder and its tab shows a locked state.

### New UI pieces

Export at 3 px per CSS px at the tablet size, as with the shoot HUD.

| ID | Piece | Size (phone / tablet) | States and notes |
| --- | --- | --- | --- |
| ui.nav-tab | Torn cream paper tab | 104 x 52 / 156 x 88, nine-slice | `default`, `selected` (yellow), `locked` (muted) |
| ui.nav-icons | HQ, Jobs, Crew, Gear, Locations, Research, Reputation | 26 / 40 | Ink, one color. Read at 20 px |
| ui.badge | Red circle for a count or "!" | 16 / 24 | The engine writes the number |
| ui.resource-pill | Dark paper pill | 30 / 44 tall, nine-slice | May reuse ui.chip-dark if it reads well at this size |
| ui.icon-money, ui.icon-favors | Cash bill, handshake | 22 / 34 | Reputation uses ui.star |
| ui.button-plus | Small yellow round "+" button | 20 / 30 | |
| ui.icon-settings | Gear cog | 24 / 36 | Sits on ui.button-paper, cream version |
| ui.button-primary | Big yellow paper button | 44 / 64 tall, nine-slice | "CONTINUE JOB" and other main calls. Text drawn |
| ui.arrow | Round yellow arrow button | 22 / 34 | One file, mirrored for left |
| ui.day-row | Week row pill | 180 x 22 / 290 x 34, nine-slice | `empty` (gray), `prep` (gray), `shoot` (yellow), `shoot-alt` (green). Text drawn |
| ui.day-chip | Compact day for the phone week strip | 30 x 22 | Same four states |
| ui.icon-clapper | Small clapperboard for shoot days | 16 / 24 | |
| ui.icon-info | Calendar, budget and payment icons for the job card | 14 / 22 | Three files |
| ui.next-photo | Taped photo frame for the job card | 64 x 64 / 110 x 110 inner photo | The job's photo slots inside. The Burger Job reuses its hero shot |

Reused from the shoot HUD: ui.panel (side panel and room pop-up), ui.tag (company name), ui.logo, ui.star, ui.meter (weekly goal bar), ui.check (goal checkbox).

## What could be built later

Ideas for the expansion slot, the roof and a future annex. None of these are decided.

| Idea | What it adds to the game |
| --- | --- |
| **Casting room** | See talent before hiring. Unlocks jobs with on-camera talent |
| **Wardrobe, hair and makeup** | Fashion jobs (the concept already lists a "Fashion Edit") |
| **Insert stage** | A small in-house tabletop stage: shoot small jobs with no location cost, practice setups |
| **Sound booth** | Voice-over and audio jobs, a quality boost on edits |
| **Locations office** | Scouting: unlocks location jobs and cheaper permits (ties to the Locations tab) |
| **Rooftop deck** | Party and client hangouts: reputation and favors |
| **Bigger sign** | Marketing: more and better jobs on the board |
| **Second garage bay** | A second vehicle, two crews on two jobs in one day |
| **Third floor or side annex** | Room for any of the above when the building is full |

The building is laid out so it can grow: the expansion slot fills first, then the roof, then a side annex at x 492 onward (the street and backdrop already run there).

## Order of work

1. **Greybox.** I build the layout in code with flat colored boxes at these sizes and check it on a phone and a tablet before any art is drawn.
2. **hq.shell and one room cavity** (Art Dept in all states) as the test drop.
3. **The other cavities, backdrop tiles and street.**
4. **UI pieces.**
5. **Level 2 and 3 room art** as the levels are wired.
