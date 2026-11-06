# Art batch 8 validation: Client, Agency, Receptionist and Theo

Nov 5, 2026. Zip "Thats-A-Wrap-Agency-Receptionist-Theo-Components": 28 character parts at 8 px per unit, the Agency's latte at 6, masters at 27, approved pictures of the Agency, Receptionist and Theo, and the Client's parts from her earlier zip with her own placement file.

**Result: all four are in the game.** The published Milestone B build (version 14) has them. Eight of the hand-designed characters are now delivered: Ro, Mika, Dani, Lu, Client, Agency, Receptionist and Theo.

## Where they show up

| Character | Where |
| --- | --- |
| Client | Video village, behind her chair, in every shoot |
| Agency | Video village, with her latte in her near hand |
| Receptionist | HQ lobby, behind the desk |
| Theo | The hire screen (Art, "Ask a friend of a friend"), booked on the Burger Job as decided. On set once a job can hire him |

## File checks

| Check | Result |
| --- | --- |
| Format | All 29 PNGs are RGBA with straight alpha |
| Haze | None. No pixel between alpha 1 and 7 |
| Margins | 4 px clear on every side |
| Sizes | Agency, Receptionist and Theo match the guide heights: head 18, torso 14.1, pelvis 9.4, arms 15.5, legs 22.8 units |
| Client | Her seven files and placement file are unchanged from her own zip. She is 48.0 units tall at 8 px per unit |
| Audit | `tools/audit_art.py`: no specks, no stray pixels, no edge halos |

## How they were fitted

Built by `tools/make_batch8_map.py` and `tools/prep_art.py`. The delivered files are untouched.

| Step | What and why |
| --- | --- |
| Pivots | Arms and legs turn about the center of their rounded cap, read from the art. Head and torso use the delivery's pivots |
| Height | Agency 52.8, Receptionist 51.6 and Theo 52.3 units at the delivered scale, next to Ro at 51.8. No rescale. The Client is drawn at 7.41 px per unit so she stands 51.8 |
| Pelvis width | Each delivered pelvis was 10 to 12 units wide, narrower than the two legs under it (each part was sized by height on its own). They are refitted from the 27 px masters to the width of the legs: Agency 11.0 (x1.10), Receptionist 14.7 (x1.25), Theo 12.5 (x1.22). The waist stays put |
| Leg openings | The pelvis art has dark leg openings at the bottom of each tube. Legs hang under the pelvis in the rig, so the openings showed as dark crescents on the thighs. They are trimmed off in fitting |
| Arm order | The torso art has an armhole painted where the near arm attaches. With the usual order (near arm behind the torso) the hole showed. For these three, both arms draw over the torso |
| Far shoulder | Moved out to 0.76 of the torso's half width, as on Ro |
| Client | Joints come straight from her placement file. Her near arm is named front, which is the other way round from Ro, and the rig takes it as delivered |
| Latte | A new held prop, `crew.held.agency-latte`. It sits under the Agency's near hand and turns with that arm |

Two small additions to the engine made this data-driven: a character's settings file can now set the order of its upper body (`order`) and a prop it always carries (`holds`). Both are described in `src/slots.js` and `art/README.md`.

## Tests

| Test | Result |
| --- | --- |
| Unit tests | 99 pass (2 new, for the draw order and the held prop) |
| Full shoot in a browser, phone landscape, crew hired | Pass. New check: Client and Agency are on the delivered rig and the Agency holds her latte |
| Art bench, Agency | 28 of 28 |
| Art bench, Receptionist | 28 of 28 |
| Art bench, Theo | 27 of 28. Walk start scored 0.96 against a bar of 0.98 for "no pop". By eye the walk is clean (`docs/qa/batch8/theo-walk-strip.webp`). Later the same day the bench was fixed to allow for the turn-around at the start of a trip (Crew-Kit-01-Validation.md). Theo's start then passes and his stop scores 0.976, still a near miss |
| Art bench, Client | 27 of 28. Her working reach is 4.5 units against a bar of 6, because her near arm is the one that reaches. She never works on set |
| Art bench, Ro (regression) | 28 of 28 |

**Bench fix.** The delivered floor shadow, wired in batch 7, is solid enough that the bench counted it as part of the puppet. Every character, Ro included, measured 1.6 units under the floor mark. The bench now hides the shadow while it measures.

Pictures are in `docs/qa/batch8/`: each approved picture next to the game fit, video village, the lobby, the phone HQ and shoot, and the walk strips.

## How they differ from the approved pictures

| Difference | Why | Fix, if wanted |
| --- | --- | --- |
| Arms hang straight down. In the approved pictures they angle out | The rig swings arms from the shoulder, so the parts were drawn straight, as asked | None needed |
| Agency, Receptionist and Theo are slimmer than their pictures | The delivered parts are narrower than the pictures. Measured on Theo: torso 13 units against about 15 in his picture, pelvis 10 against about 13.5. The other two look the same by eye | A redraw of torso and pelvis at the picture's width |
| The Agency's latte hangs at her side | The delivery has relaxed hands only | A pose image: `crew.agency.arm-back.hold`, the near arm bent with the hand closed on the cup |
| The Client's arms angle out a little | Her parts were cut from one assembled drawing | None needed, she stands still |

## Optional asks

None block anything. They are listed in Crew-Kit-01-Request.md so they travel with the next request.

1. Pelvis for Agency, Receptionist and Theo, redrawn 12.5 to 14.5 units wide with no dark leg openings.
2. `crew.agency.arm-back.hold`.

## Weight

Packed art is 5.5 MB and the page is 8.0 MB. The build warns at 6 MB of art. One more character batch at this size reaches it, which is one more reason for the crew kit and for per-kit packs.

## New tools

| Tool | What it does |
| --- | --- |
| `tools/make_batch8_map.py` | Builds the fitting map for this batch from the delivery |
| `tools/char_sheet.py` | Draws a lineup of any delivered characters from `art/`, the way the rig assembles them |
| `tools/recolor_area.py` | Recolors one color area of a piece (skin, hair, a garment) and leaves the rest |
| `tools/kit_mix.py` | The crew kit proof: new people from delivered parts, recolored |
| `tools/make_kit_template.py` | Writes the crew kit template sheet, data and guides in `docs/kit/` |
