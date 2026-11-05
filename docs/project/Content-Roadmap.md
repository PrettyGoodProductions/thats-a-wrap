# That's a Wrap! Content roadmap: levels, HQ growth and the art library

Nov 5, 2026 · revision 2 (crew are built from a component kit, the set and studio parts list is added, HQ is the landscape diorama, recolor test done) · goes with HQ-Redesign.md, Asset-Manifest.md and the two ChatGPT briefs (Mobile 2D World and Prop System, Character Assembly and Roster System)

How the game gets to many different levels, many different crew and a growing HQ without drawing every scene and person from scratch. Nothing here changes the Milestone B sequence. The level list is a menu to pick from, not a commitment to build all of it.

## Decisions (Nov 5)

| Topic | Decision |
| --- | --- |
| Art library | Draw a parts library once, derive variants with scripts, assemble scenes and crew from data. No image generation while the game runs |
| Level identity | Every tabletop level must feel like its own set. Recolor and rearrange alone is not enough (see "What makes a level its own") |
| Recolor | Tested and works on single-color paper pieces. No neutral re-exports of the delivered flats are needed |
| Who makes art | ChatGPT. Claude writes each request as a paste-ready block, Tomás pastes it, Claude fits, audits and wires the zip. Calling an image model directly from Claude is parked |
| Characters | Crew are built from a **component kit**: hair, skin tone, tops, bottoms, hats and accessories, colored by the game. Ro, Mika, Dani and Lu stay as hand-designed named characters. This replaces "6 to 8 authored characters" |
| Screens | Every screen is landscape. HQ is the cutaway diorama from HQ-Redesign.md, delivered and wired |
| Level and HQ ideas | The lists below are adopted into the plan as the content backlog |

## The library in three tiers

| Tier | What it is | Who makes it |
| --- | --- | --- |
| Drawn once | Props, set pieces, crew components, room cavities | Tomás and ChatGPT, to Claude's spec |
| Derived at build time | Color variants, mirrored versions, crew portraits, shot thumbnails, job flyers | Claude's scripts, from tier 1 |
| Assembled at run time | Props (stand, head, beam), scenes, crew, jobs | Data files the game reads |

The tabletop kit is about 60 pieces and is delivered. Rough cost of new content on top of it: 10 to 15 drawings for a new tabletop job, 15 to 25 for a new location. These are estimates until the second job is built.

## Recolor test (done)

Sheet: `docs/qa/tint-test/recolor-test.png`, made by `tools/tint_test.py`.

| Finding | What it means |
| --- | --- |
| Single-color flats recolor cleanly. Paper grain, torn edges and corrugation survive, and tinting a flat back to its own color matches the original | The eleven delivered flats can take any palette as they are |
| A piece with two or more colors flattens to one. The platform loses its cream lid and orange edge | Multi-color pieces either stay in their painted colors, or are delivered as one file per color area |

**Rule for new art:** one material per file when a piece should be recolorable. Anything with a fixed color (a boot, a button, a lid) goes in its own file on the same canvas.

Not tested yet: the wall and floor tiles (same kind of piece, expected to behave the same), and how it reads on a phone in the game.

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
| Wall materials, seamless tiles | 4 | Brick, white cyc, wood slat, concrete. Neutral paper so they recolor |
| Floor materials, seamless tiles | 4 | Concrete, wood plank, checker tile, white cyc floor |
| Flats with openings | 3 | Window flat, door flat, half-height flat. Neutral. The window gets a separate glass and glow layer |
| Pattern overlays for any flat | 3 | Stripes, tile grid, wallpaper print. Transparent, laid over a recolored flat |
| Ceiling alternates | 2 | Wood beams, skylight |

### Hero surfaces and backdrops (about 9 drawings, as levels need them)

| Piece | Count | Notes |
| --- | --- | --- |
| Surfaces | 5 | Round café table, bar top, kitchen counter, plinth stack, flat-lay board. Each has a `contact` point like the platform |
| Backdrops behind the hero | 4 | Tile backsplash, wood board, fabric drape, gradient card. The sweep stays the default |

### Gear extras (draw only when a level's rule needs one)

Large overhead softbox, LED tube, bounce board, diffusion frame, fan, haze machine, spray bottle, boom mic and sound cart, wardrobe rack, steamer, makeup mirror, turntable.

### Furniture kit (about 12 drawings, for Four rooms and lifestyle sets)

Sofa, armchair, bed, dining table, chair, floor lamp, rug, shelf, three framed pictures, curtain. Upholstery and wood as separate files so both recolor.

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

Food stylist, art department and wardrobe stylist share one role family, so the same crew logic covers food, product and wardrobe jobs. Models and talent come from the same component kit as crew, so a fashion level needs wardrobe pieces and no new people.

### Suggested first four after the burger

| Order | Level | Why now |
| --- | --- | --- |
| 1 | Beverage | Cheapest to make. Same stage, one new rule |
| 2 | E-comm flat lay | A different pace: volume instead of three hero shots |
| 3 | Fashion lookbook | Adds talent and wardrobe, which reuse the crew component kit |
| 4 | Rooftop | First location kit, proves the library outside the studio |

Not locked. Tomás picks.

## Characters: the component kit

People are assembled from components and colored by the game. Hair color, skin tone and clothing color are data, so they cost no drawings.

The engine already has the start of this: a generic puppet whose head takes a skin tone, whose torso takes a color, and whose hair, hats and face extras are swappable. It was built before Ro arrived and never got art. The kit below feeds it and extends it.

### Layers, back to front

| Layer | Options to draw | Colored by |
| --- | --- | --- |
| Hair, back piece | For long hair and ponytails | Hair color |
| Bottoms: pelvis and two legs | Pants, shorts, work pants | Clothing color |
| Shoes | Boots, sneakers | Fixed |
| Arms | One pair | Skin tone |
| Sleeves | Short, long, rolled | Clothing color |
| Top | Tee, long sleeve, button-up, hoodie, work shirt, tank | Clothing color, with a fixed detail layer for buttons and collars |
| Over layer | Apron, vest, tool belt, suit jacket, cardigan | Its own color |
| Head | Two shapes | Skin tone |
| Face | Eyes, nose, mouth, brows | Fixed ink. Brows take hair color |
| Facial hair | Beard, mustache, stubble | Hair color |
| Hair | Buzz, short, short curly, medium, long straight, long curly, bun, ponytail | Hair color |
| Hat | Cap, beanie, beret, bandana, bucket hat | Its own color |
| Accessories | Two glasses, earrings, headset, lanyard, watch | Fixed |

About 65 drawings for the full kit. Palettes from data: about 8 skin tones, 7 hair colors, 10 clothing colors.

**Yield:** what reads at phone size is the hair or hat shape, skin tone, facial hair, glasses and top color. That alone is over a thousand clearly different people, before bottoms and accessories.

### Rules for the art

1. **One template.** Claude makes a template sheet from Ro's rig: the canvas, outline and joint for every part. Every component is drawn on its part's canvas, so hair sits on the head canvas and sleeves on the arm canvas, and nothing needs hand placement.
2. **One material per file,** in light neutral paper with grain and inner shadows. Fixed-color details in their own file.
3. **Overlaps kept:** neck stub, round sleeve cap, rounded leg top, hem over waistband, as on Ro.
4. **Looks never drive stats.** Appearance is separate from department, skill and rate.

### Test batch first (about 16 drawings)

One head, the arm pair, one set of eyes, nose and mouth, three hair styles (short, medium, long with its back piece), a tee with short sleeves, a long sleeve top with long sleeves, pants, boots. Claude assembles a lineup of 12 people from it in several skin tones and colors, next to Ro. If the layers line up and they look like they belong in Ro's world, the rest of the kit follows.

### Risks

| Risk | Plan |
| --- | --- |
| Layers drawn by an image model do not line up | The template sheet and the small test batch. Claude audits registration before anything is wired |
| Everyone looks like the same person in a different wig | Two head shapes, face variants, facial hair, small height differences, a second body build later |
| Kit people look plainer than Ro | Expected. The four hand-designed characters stay as named crew. More can be commissioned any time on the same rig |
| Bad combinations (a hat over big hair) | Exclusion rules in data. Only approved combinations are generated |
| Tinting many layers slows phones | Each person is flattened once when they are created, not recolored every frame |

### Who is built how

| Who | How |
| --- | --- |
| Ro, Mika, Dani, Lu | Hand-designed, as delivered |
| Every other crew member, models and talent | Component kit |
| Client, Agency, Receptionist | Proposed: component kit plus a few signature pieces (suit jacket and tie, beret and latte, cardigan). For Tomás to confirm |

If confirmed, no more hand-drawn characters are needed, and the 14-character list in Art-Handoff-Nov5.md and the manifest roster is retired.

### Engine work (from the character brief)

More slots on the generic puppet (sleeves, bottoms, over layer, hats apart from hair, hair back piece), appearance recipes as data, a seeded generator, identity that is saved and never rerolled, a character viewer with a lineup at game size.

## HQ growth

The HQ is the landscape cutaway diorama: two floors of four bays, with the Production Office and Lounge, Lobby, Art Dept, Edit, Gear, Garage and one boarded expansion slot. All of its non-character art is delivered and wired, including room levels 1 to 3. The bottom nav has seven tabs. HQ, Jobs, Crew and Gear are live. Locations, Research and Reputation show as "Soon".

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
| Recolor test | Nothing | Done |
| Code audit (Phase A of the world brief): renderer, loader, coordinates, save format, asset inventory | Nothing | Any time |
| Manifest becomes a catalog the game reads, burger set becomes the first scene recipe, no visible change | Audit | Any time |
| Crew template sheet and the component test batch request for ChatGPT | Tomás's go | Next art ask |
| Lineup of 12 kit people next to Ro | Test batch delivered | After the test batch |
| Full component kit, appearance recipes, saved identity, character viewer | Test batch approved | After the lineup |
| Studio shell kit request | Tomás's go | With or after the character test batch |
| Scene recipes with routes, footprints and reach checks, three burger layouts | Walking (Milestone B step 3) | After walking |
| Second hero product pack (beverage) | Task split and failure (Milestone B steps 5 and 6) | After Milestone B |
| Per-kit art packs loaded on demand | The page carries about 5 MB of art with one kit | Before the second kit ships |
| First location kit | Second tabletop job proven | Later |

## Open calls for Tomás

1. Go on the component test batch, and Client, Agency and Receptionist from the kit or hand-drawn.
2. Confirm or change the first four levels.
3. Look at the recolor sheet and say if the colors read as the same paper world.
