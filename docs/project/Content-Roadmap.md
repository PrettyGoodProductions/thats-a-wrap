# That's a Wrap! Content roadmap: levels, HQ growth and the art library

Nov 5, 2026 · revision 3 (Client, Agency, Receptionist and Theo are in the game, recoloring by area works on the delivered characters, and the crew kit test batch is specified in Crew-Kit-01-Request.md. Revision 2: component kit, set and studio parts list, landscape HQ, recolor test) · goes with HQ-Redesign.md, Asset-Manifest.md and the two ChatGPT briefs (Mobile 2D World and Prop System, Character Assembly and Roster System)

How the game gets to many different levels, many different crew and a growing HQ without drawing every scene and person from scratch. Nothing here changes the Milestone B sequence. The level list is a menu to pick from, not a commitment to build all of it.

## Decisions (Nov 5)

| Topic | Decision |
| --- | --- |
| Art library | Draw a parts library once, derive variants with scripts, assemble scenes and crew from data. No image generation while the game runs |
| Level identity | Every tabletop level must feel like its own set. Recolor and rearrange alone is not enough (see "What makes a level its own") |
| Recolor | Works. Whole single-color pieces (flats) take any color, and one color area inside a multi-color piece (skin, hair, a jacket) can be moved on its own. Tomás approved the recolored flats. No neutral or grey art is needed |
| Who makes art | ChatGPT. Claude writes each request as a paste-ready block, Tomás pastes it, Claude fits, audits and wires the zip. Calling an image model directly from Claude is parked |
| Characters | Eight hand-designed characters are delivered and in the game: Ro, Mika, Dani, Lu, Client, Agency, Receptionist, Theo. Everyone else is built from a **crew kit**: heads, hair, hats, tops and bottoms that the game mixes and recolors. No more hand-drawn characters are planned |
| Screens | Every screen is landscape. HQ is the cutaway diorama from HQ-Redesign.md, delivered and wired |
| Level and HQ ideas | The lists below are adopted into the plan as the content backlog |

## The library in three tiers

| Tier | What it is | Who makes it |
| --- | --- | --- |
| Drawn once | Props, set pieces, crew components, room cavities | Tomás and ChatGPT, to Claude's spec |
| Derived at build time | Color variants, mirrored versions, crew portraits, shot thumbnails, job flyers | Claude's scripts, from tier 1 |
| Assembled at run time | Props (stand, head, beam), scenes, crew, jobs | Data files the game reads |

The tabletop kit is about 60 pieces and is delivered. Rough cost of new content on top of it: 10 to 15 drawings for a new tabletop job, 15 to 25 for a new location. These are estimates until the second job is built.

## Recolor tests (done)

| Test | Finding | What it means |
| --- | --- | --- |
| Whole piece (`docs/qa/tint-test/recolor-test.png`, `tools/tint_test.py`) | Single-color flats recolor cleanly. Grain, torn edges and corrugation survive. A piece with two or more colors flattens to one: the platform loses its cream lid | The eleven delivered flats take any palette as they are |
| One area at a time (`docs/kit/mix-proof.png`, `tools/recolor_area.py`) | On the delivered characters, skin, hair, a top or trousers can each be moved to a new color while eyes, glasses, buttons, boots and hats stay. A nose follows the skin it sits on | Multi-color pieces can be recolored too. Characters can change skin tone, hair color and clothing colors with no new art |

**Rule for new art:** each area that should be recolorable is one flat paper color, and no two areas inside the same piece are similar colors. A cream tee under a sage jacket is too close, and the tee shifts with the jacket.

Not tested yet: the wall and floor tiles (same kind of piece as the flats), area recoloring on set pieces such as the platform, and how any of it reads on a phone in the game. Recoloring runs in Python today. In the game it will run once when a person or a set is created, not every frame.

## What makes a level its own

| Ingredient | Example | Who |
| --- | --- | --- |
| Palette | Flats, sweep and floor in the client's colors | Claude, from data |
| Layout | Stations, lights and camera in different places, different walking routes | Claude, scene recipe data |
| Room | Brick loft, white cyc, tiled kitchen studio, with a window or a roll-up door | Studio shell kit (below) |
| Hero and signature stations | Frosted glass and a pour rig instead of a burger and a cheese pull | Hero product pack |
| Dressing | 5 to 8 pieces that say "bar" or "bakery" or "tech launch" | Dressing pack |
| Light mood | Warm diner, cold beverage blue, night | Claude, engine lighting |

## Set and studio parts

What it takes to mix and match sets. Counts are drawings. Colors cost nothing.

### In hand

| Group | Pieces | Mix and match today |
| --- | --- | --- |
| Shell | Wall tile, kraft floor tile, 11 flats, ceiling grid, 2 practicals | Recolor, reorder, mirror, leave some out |
| Stage | Sweep and tube, platform, flag, C-stand rig, gear pile, apple boxes | Sweep already recolors per shot. Platform is fixed red |
| Gear | Key light, fill, backlight, beams, camera, two lenses, dolly track | Reused by every level as is |
| Dressing | Plants, poster, call sheet, tape marks, scuffs, cable, craft table, video village | Move freely. The poster and call sheet take engine text |
| HQ exterior | Sky, clouds, far city, near city, trees, sidewalk, street, van | Ready-made backdrop for rooftop and street locations |

Tied to today's layout, to fix in code and not in art: the cable (one drawn route, Claude will draw cables in code), the light beams and rig arm (the engine already aims and stretches them), the track (tiles).

### Studio shell kit (first new batch, about 16 drawings)

This is what makes two tabletop levels look like different rooms.

| Piece | Count | Notes |
| --- | --- | --- |
| Wall materials, seamless tiles | 4 | Brick, white cyc, wood slat, concrete. Each in one color, which the game recolors |
| Floor materials, seamless tiles | 4 | Concrete, wood plank, checker tile, white cyc floor |
| Flats with openings | 4 | Window flat with its glass and glow layer, door flat, half-height flat. Each in one color |
| Pattern overlays for any flat | 3 | Stripes, tile grid, wallpaper print. Transparent, laid over a recolored flat |
| Ceiling alternate | 1 | Wood beams. A skylight comes later |

### Hero surfaces and backdrops (about 9 drawings, as levels need them)

| Piece | Count | Notes |
| --- | --- | --- |
| Surfaces | 5 | Round café table, bar top, kitchen counter, plinth stack, flat-lay board. Each has a `contact` point like the platform |
| Backdrops behind the hero | 4 | Tile backsplash, wood board, fabric drape, gradient card. The sweep stays the default |

### Gear extras (draw only when a level's rule needs one)

Large overhead softbox, LED tube, bounce board, diffusion frame, fan, haze machine, spray bottle, boom mic and sound cart, wardrobe rack, steamer, makeup mirror, turntable.

### Furniture kit (about 12 drawings, for Four rooms and lifestyle sets)

Sofa, armchair, bed, dining table, chair, floor lamp, rug, shelf, three framed pictures, curtain. Upholstery and wood in clearly different colors, so each recolors on its own.

### Per-level packs

| Pack | Size | Contents |
| --- | --- | --- |
| Hero product pack | 8 to 12 | The product, its build layers or stand-ins, signature rig pieces, spoiled states, three shot thumbnails |
| Dressing pack | 5 to 8 | Theme props: diner, bar, bakery, beauty, tech, fashion |
| Location kit | 15 to 25 | Backdrop layers, ground, one or two signature structures, 8 to 10 props. Rooftop reuses the HQ sky, city and trees |

### What needs no drawings

Palette, layout, light mood, mirroring (after checking each piece for lettering and one-sided lighting), small size changes on dressing, engine text on signs and posters, time of day on skies.

## How levels are built

**Level = job type × layout × one twist × client.**

Overcooked keeps a few verbs constant (assign, carry, prep, deliver) and gives each world one new rule, then combines rules later. Same here: each job type teaches one rule, and later jobs stack them.

## Level backlog

### Tabletop (reuses the current stage and gear)

| Level | The hook | Rule it teaches |
| --- | --- | --- |
| Burger (built) | Build, light, cheese pull, sauce pour | Perishables, dependencies |
| Beverage | Frost fades, ice melts under hot lights, each pour take uses a fresh glass | Limited takes |
| Ice cream | Light with a stand-in scoop, swap in the hero at the last second | Stand-ins |
| Plated meal | Several prep stations feed one plate. The radicchio arrives by courier mid-shoot. Wilt and mold timers | Converging prep, deliveries |
| E-comm flat lay | A ticket rail of items to steam, lint-roll, style and shoot. The shoe didn't arrive | Volume and order tickets |
| Splash shot | Every take makes a mess to wipe, limited hero products | Reset cost per take |
| Cosmetics or tech | Reflections and fingerprints, flags to kill glare, dust keeps coming back | Upkeep between takes |

### Studio

| Level | The hook | Rule it teaches |
| --- | --- | --- |
| Fashion lookbook | A model with an energy meter, wardrobe changes, touch-ups, backdrop color per look | Talent as a resource |
| Four rooms | Recolor flats and swap furniture between four fake rooms on a clock | Set changeovers |
| Animal or kid talent | Wanders off, works in short bursts, treats are a resource | Unreliable talent |
| Interview | Hold for the plane overhead | Sound |

### Location

| Level | The hook | Rule it teaches |
| --- | --- | --- |
| Rooftop | The elevator fits two items per trip, wind knocks unbagged flags, sunset window | Load-in limits, weather |
| Woods | Hike in with carry limits, batteries only, daylight fading | Carry weight, power |
| Fancy house | Floor protection before any gear, hovering homeowner | Protect the location |
| Beach | The tide shrinks the set | Shrinking space |
| Working restaurant | Shoot between lunch and dinner service | Hard time windows |

### Twists (any level)

- The gaffer goes home sick and has to be replaced mid-shoot
- The client changes the backdrop color
- The agency adds a shot
- Lunch must be called on time, or meal penalties
- A breaker trips
- Night shoot
- Company move mid-level
- A product or prop didn't arrive

Food stylist, art department and wardrobe stylist share one role family, so the same crew logic covers food, product and wardrobe jobs. Models and talent come from the same crew kit as crew, so a fashion level needs wardrobe pieces and no new people.

### Suggested first four after the burger

| Order | Level | Why now |
| --- | --- | --- |
| 1 | Beverage | Cheapest to make. Same stage, one new rule |
| 2 | E-comm flat lay | A different pace: volume instead of three hero shots |
| 3 | Fashion lookbook | Adds talent and wardrobe, which reuse the crew kit |
| 4 | Rooftop | First location kit, proves the library outside the studio |

Not locked. Tomás picks.

## Characters: the crew kit

### Where it stands

Eight hand-designed characters are in the game: Ro, Mika, Dani and Lu as crew, the Client and Agency in video village, the Receptionist in the lobby, and Theo. Details in Art-Batch-8-Validation.md.

`docs/kit/mix-proof.png` shows twelve new people built from those parts alone: a head from one character on the outfit of another, with a new skin tone, hair color and clothing colors. Nobody drew them. That is the system working on what is already delivered.

### What the delivered art cannot do

| Limit | What fixes it |
| --- | --- |
| Hair and hats are painted into every head, so a head always has the same hair | Bald base heads, with hair, hats, beards and glasses as separate layers |
| Only four outfits share one scale (Ro, Agency, Receptionist, Theo). Mika, Dani, Lu and the Client were drawn at other proportions, so their bodies do not mix | New tops and bottoms drawn on one mannequin |
| Every outfit is long trousers with a shirt or jacket | More shapes: tee, hoodie, apron, shorts, skirt |

### How the kit is built

Kit pieces use the same seven-part rig as the characters, so the engine needs no new body system.

| Kit piece | Files | Recolored by the game |
| --- | --- | --- |
| Base head | 1 (bald, with face, ear, neck stub) | Skin |
| Hair | 1, or 2 when long hair needs a back piece | Hair color |
| Hat | 1 | Its own color |
| Beard, mustache | 1 | Hair color |
| Glasses, earrings | 1 | Nothing |
| Top | 3: torso and two arms. The sleeve and the hand are on the arm, as now | Top color, skin |
| Bottoms | 3: pelvis and two legs, with the shoe on the leg | Bottoms color, skin on bare legs |

All head layers for one base head share one canvas and are cut from one drawing, so they stack exactly. Pieces are drawn in the normal style in four agreed key colors (skin, hair, top, bottoms), which is how the game finds each area.

The template is in `docs/kit/`: the mannequin with its joints, each slot's canvas and pivot, the head canvas, the key colors, and guides at master scale.

### Test batch first: Crew Kit 01 (15 drawings)

Two bald base heads with the same skull and different faces, three hair styles (short, curly, long with its back piece), a cap, a beard, glasses, a tee (torso and two arms) and shorts (pelvis and two legs). The full ask is Crew-Kit-01-Request.md.

When it arrives Claude checks that head layers stack, recolors every piece in five skin tones, hair colors and clothing colors, and shows a lineup of twelve kit people next to Ro for approval.

### Full kit, after the test batch (about 45 more drawings)

| Group | Pieces |
| --- | --- |
| Base heads | 2 more, with other head shapes |
| Hair | 5 more: buzz, medium, bun, ponytail, long curly |
| Hats | 4 more: beanie, beret, bandana, bucket hat |
| Face | Mustache, stubble, second glasses, earrings |
| Tops, 3 files each | Long sleeve, button-up, hoodie, work shirt, tank, plus an apron and a tool belt as over layers |
| Bottoms, 3 files each | Trousers, work pants, skirt |

**Yield:** what reads at phone size is the hair or hat shape, skin tone, facial hair, glasses and top color. With the full kit that is well over a thousand clearly different people, and the delivered eight add their own heads and outfits to the mix.

### Risks

| Risk | Plan |
| --- | --- |
| Layers drawn by an image model do not line up | Head layers are cut from one drawing on one canvas. Every piece comes with a picture of the mannequin wearing it, and Claude fits against that picture |
| Everyone looks like the same person in a different wig | Base heads with different faces and head shapes, facial hair, glasses, small height differences |
| Kit people look plainer than Ro | The eight hand-designed characters stay as named people. More can be commissioned any time on the same rig |
| Bad combinations (a cap over big hair) | Exclusion rules in data. Only approved combinations are generated |
| Recoloring slows phones | Each person is recolored and flattened once when created, not every frame |
| A recolor bleeds into the wrong area | The key colors, and the rule that areas in one piece are not similar colors |

Looks never drive stats. Appearance is separate from department, skill and rate.

### Engine work

Head layers on the puppet (hair back piece, beard, hair, glasses, hat), area recoloring in the game, appearance recipes as data, a seeded generator, identity that is saved and never rerolled, and a character viewer with a lineup at game size. This follows the character brief.

## HQ growth

The HQ is the landscape cutaway diorama: two floors of four bays, with the Production Office and Lounge, Lobby, Art Dept, Edit, Gear, Garage and one boarded expansion slot. All of its non-character art is delivered and wired, including room levels 1 to 3. The bottom nav has seven tabs. HQ, Jobs and Gear are live. Crew, Locations, Research and Reputation show as "Soon". The Receptionist is at the lobby desk.

| Idea | How it works | Where it lives |
| --- | --- | --- |
| Rooms unlock job types | Prep kitchen opens bigger food jobs. Set shop opens Four rooms. Wardrobe, hair and makeup opens fashion and e-comm. Casting opens talent jobs. Sound booth opens interviews | Art Dept levels 2 and 3, expansion slot |
| Vehicles unlock locations | The van opens city locations (rooftop, restaurant, house). The grip truck opens remote ones (woods, beach) | Garage, Gear level 3, Locations tab |
| Room levels change shoot day | Owned gear means lower rental costs and fewer breakdowns. Better coffee means crew last longer | Room levels, already in the game |
| Bidding | Pick a margin against the chance of winning. Repeat clients with personalities | Jobs tab |
| Crew relationships | Favorites get booked by rivals unless you put them on hold. Call in a favor to replace a sick gaffer | Crew tab, favors pill |
| Cash flow | Payroll is due before the Net 30 check lands | Money pill, production week panel |
| Research | Spend to unlock tools that change shoot day: walkies (longer task queues), a second monitor, faster resets | Research tab |
| Reel and awards wall | Your best shots on display, unlocking better clients | Production Office, Reputation tab |
| The building grows | Expansion slot, then the roof, then a side annex | HQ-Redesign "What could be built later" |

### HQ parts for new rooms

| Piece | Count per room | Notes |
| --- | --- | --- |
| Room cavity in every state | 5 | `for-rent`, `building`, `l1`, `l2`, `l3` on the 600 x 576 canvas. The bare cavity from HQ Test 06 is the base |
| Front layer | 1 or 2 | Furniture that stands in front of crew |
| Roof or annex pieces | As needed | Rooftop deck dressing, an annex section of shell |

To try on the first expansion room: deliver the bare cavity plus furniture as separate cutouts, so Claude builds the levels by adding pieces and the furniture can be reused. Whether HQ furniture can also dress shoot sets depends on the viewing angle matching, which is untested.

## What happens when

| Work | Needs | When |
| --- | --- | --- |
| Recolor tests | Nothing | Done |
| Client, Agency, Receptionist, Theo in the game | Batch 8 | Done |
| Crew kit template and the Crew Kit 01 request | Nothing | Done, ready to send |
| Code audit (Phase A of the world brief): renderer, loader, coordinates, save format, asset inventory | Nothing | Any time |
| Manifest becomes a catalog the game reads, burger set becomes the first scene recipe, no visible change | Audit | Any time |
| Lineup of twelve kit people next to Ro | Crew Kit 01 delivered | After the test batch |
| Full crew kit, head layers and recoloring in the game, saved identity, character viewer | Test batch approved | After the lineup |
| Studio shell kit | Sizes are in Art-Handoff-Nov5.md | Send with or after the crew test batch |
| Scene recipes with routes, footprints and reach checks, three burger layouts | Walking (Milestone B step 3) | After walking |
| Second hero product pack (beverage) | Task split and failure (Milestone B steps 5 and 6) | After Milestone B |
| Per-kit art packs loaded on demand | Packed art is 5.5 MB with one kit and eight characters. The build warns at 6 | Before the second kit ships |
| First location kit | Second tabletop job proven | Later |

## Open calls for Tomás

1. Confirm or change the first four levels.
2. Look at `docs/kit/mix-proof.png` and say if recolored people read as the same paper world.
3. Play the published build and look at the Client, Agency and Receptionist in place.
