# That's a Wrap! Content roadmap: levels, HQ growth and the art library

Nov 5, 2026 · revision 1 · goes with HQ-Redesign.md, Asset-Manifest.md and the two ChatGPT briefs (Mobile 2D World and Prop System, Character Assembly and Roster System)

How the game gets to many different levels and a growing HQ without drawing every scene from scratch. Nothing here changes the Milestone B sequence. The level list is a menu to pick from, not a commitment to build all of it.

## Decisions (Nov 5)

| Topic | Decision |
| --- | --- |
| Art library | Draw a parts library once, derive variants with scripts, assemble scenes and crew from data. No image generation while the game runs |
| Level identity | Every tabletop level must feel like its own set. Recolor and rearrange alone is not enough (see "What makes a level its own") |
| Who makes art | ChatGPT. Claude writes each request as a paste-ready block, Tomás pastes it, Claude fits, audits and wires the zip. Calling an image model directly from Claude is parked |
| Characters | Tomás supplies 6 to 8 authored characters. Everyone else is generated from those |
| Level and HQ ideas | The lists below are adopted into the plan as the content backlog |

## The library in three tiers

| Tier | What it is | Who makes it |
| --- | --- | --- |
| Drawn once | Props, set pieces, crew parts, room cavities | Tomás and ChatGPT, to Claude's spec |
| Derived at build time | Color variants, mirrored versions, crew portraits, shot thumbnails, job flyers | Claude's scripts, from tier 1 |
| Assembled at run time | Props (stand, head, beam), scenes, crew, jobs | Data files the game reads |

The tabletop kit is about 60 pieces and is delivered. Rough cost of new content on top of it: 10 to 15 drawings for a new tabletop job, 15 to 25 for a new location. These are estimates until the first second job is built.

## What makes a level its own

| Ingredient | Example | Who |
| --- | --- | --- |
| Palette | Flats, sweep and floor in the client's colors | Claude (tinting), after the tint test below |
| Layout | Stations, lights and camera in different places, different walking routes | Claude (scene recipe data) |
| Hero and signature stations | Frosted glass and a pour rig instead of a burger and a cheese pull | New art, 5 to 8 pieces |
| Dressing pack | 5 to 8 pieces that say "bar" or "bakery" or "tech launch" | New art |
| Light mood | Warm diner, cold beverage blue, night | Claude (engine lighting) |

**Tint test, first.** The eleven delivered flats are painted in fixed colors. Claude tests desaturate-and-tint on them and shows a side by side. If paper grain and edges survive, no new art is needed. If not, the ask is neutral-paper versions of the single-color pieces.

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

Food stylist, art department and wardrobe stylist share one role family, so the same crew logic covers food, product and wardrobe jobs.

### Suggested first four after the burger

| Order | Level | Why now |
| --- | --- | --- |
| 1 | Beverage | Cheapest to make. Same stage, one new rule |
| 2 | E-comm flat lay | A different pace: volume instead of three hero shots |
| 3 | Fashion lookbook | Adds talent and wardrobe, which reuse the crew parts system |
| 4 | Rooftop | First location kit, proves the library outside the studio |

Not locked. Tomás picks.

## HQ growth

Mapped to the rooms in HQ-Redesign.md, so the building is what opens up the game.

| Idea | How it works | Where it lives |
| --- | --- | --- |
| Rooms unlock job types | Prep kitchen opens bigger food jobs. Set shop opens Four rooms. Wardrobe, hair and makeup opens fashion and e-comm. Casting opens talent jobs. Sound booth opens interviews | Art Dept levels 2 and 3, expansion slot |
| Vehicles unlock locations | The van opens city locations (rooftop, restaurant, house). The grip truck opens remote ones (woods, beach) | Garage, Gear level 3, Locations tab |
| Room levels change shoot day | Owned gear means lower rental costs and fewer breakdowns. Better coffee means crew last longer | Already in HQ-Redesign room levels |
| Bidding | Pick a margin against the chance of winning. Repeat clients with personalities | Jobs tab |
| Crew relationships | Favorites get booked by rivals unless you put them on hold. Call in a favor to replace a sick gaffer | Crew tab, favors |
| Cash flow | Payroll is due before the Net 30 check lands | Money pill, production week |
| Reel and awards wall | Your best shots on display, unlocking better clients | Production Office |
| The building grows | Expansion slot, then the roof, then a side annex | HQ-Redesign "What could be built later" |

## Characters

**Plan:** 6 to 8 authored characters, drawn by hand through ChatGPT. Everyone else is generated by the game from their parts: a head from one, an outfit from another, in an approved color variant. If "generated" should instead mean ChatGPT draws more characters using the authored ones as style references, the same template covers that too.

**Where it stands:** Ro, Mika, Dani and Lu are delivered, so 2 to 4 more are needed.

**What mixing needs:**

1. **One body template.** Mika, Dani and Lu have longer arms and bigger torsos than Ro. They work as complete characters. Mixing parts between characters needs the new ones drawn to Ro's proportions (table in Asset-Manifest.md).
2. **Outfits stay whole.** Torso, pelvis, arms and legs swap as one bundle. Heads swap separately.
3. **Skin has to match.** Arms include the hands, so a head can only go on an outfit whose hands match its skin tone. Claude will test recoloring hands in code. If that fails, heads swap within the same skin tone only.
4. **Looks never drive stats.** Appearance is separate from department, skill and rate.

**Rough yield:** 8 heads on 8 outfits in 3 color variants is up to about 190 looks if hand recoloring works, and about 50 if heads stay within their skin tone. Enough for a roster of 20 to 30 without repeats.

**Proposed picks (for Tomás to confirm):** keep the four, add Theo (he is the booked art crew on the Burger Job), and choose up to three more for the widest spread of silhouettes, hats, hair and skin tones. Suggested: Bo, Inés and Vera. Client, Agency and Receptionist are fixed characters who are always on screen, so they are drawn separately and do not count toward the eight.

This replaces the character list in Art-Handoff-Nov5.md, which asks for all fourteen remaining characters as hand-drawn.

## What happens when

| Work | Needs | When |
| --- | --- | --- |
| Tint test on the delivered flats | Nothing | Any time |
| Code audit (Phase A of the world brief): renderer, loader, coordinates, save format, asset inventory | Nothing | Any time |
| Manifest becomes a catalog the game reads, burger set becomes the first scene recipe, no visible change | Audit | Any time |
| Crew template request for ChatGPT (blank body at Ro's proportions, then the new authored characters) | Tomás's character picks | Next art ask |
| Appearance recipes, persistent crew identity, character viewer | Template characters delivered | After the next character batch |
| Scene recipes with routes, footprints and reach checks, three burger layouts | Walking (Milestone B step 3) | After walking |
| Second hero product pack (beverage) | Task split and failure (Milestone B steps 5 and 6) | After Milestone B |
| Per-kit art packs loaded on demand | The page is 6 MB with one kit | Before the second kit ships |
| First location kit | Second tabletop job proven | Later |

## Open calls for Tomás

1. Confirm or change the first four levels.
2. Confirm the character picks, and whether Client, Agency and Receptionist sit outside the 6 to 8.
3. Judge the tint test when it is ready.
