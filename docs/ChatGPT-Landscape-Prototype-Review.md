# ChatGPT landscape prototype: review and what is left to adopt (updated Nov 3, 2026, late)

Source: Thats-A-Wrap-Mobile-Source.zip (the Burger Job prototype).

## Status: superseded by Milestone B

My first pass (branch `feature/landscape-shoot-layout`, a CSS-only landscape layout on top of the Milestone A portrait set) is **not needed and should not be merged**. The asset loader and Milestone B sessions went further on `milestone-b-lab`: a wide landscape set, a floating paper HUD (status bar, crew portraits on the left edge, shot list pop-up, ACTION lower right), the safe area, and Ro's real art (platform, key light, pelvis rig). That build already has the prototype's main idea, a full-width scene with a slim HUD, and uses our own art and rig. Milestone-B-Plan.md records this.

## Taken from the prototype (already in the Lab branch)

- Landscape-first shoot, full-width scene, HUD kept thin and out of the way.
- Safe-area and dynamic-viewport handling, no page scroll.
- Rotation preserves the shoot.

## Still open, in the Milestone B backlog

1. **Client review loop.** After a take the client approves or sends a note ("Can we see more of the logo?"). The player picks a retake (short art adjust, camera reframe, roll again) or accepts a flat quality penalty. Fits step C2.
2. **Rush crew ($600, 20 s faster) as an always-visible button.** Money for time.
3. **Freshness countdown on the shot** ("FRESH FOR 23s", then "STALE −20") with an Art refresh action.
4. **Touch targets.** The prototype keeps every main control at 44 px or more. Our landscape task icons are 34 px (40 px on wider screens). Worth raising to 44 px.

## Not taking

- Their canvas renderer, assembled character images and fixed roster. Our SVG layers, loader and Ro's rig are the base.
- Their tuning numbers ($8,550, $22/s, 240 s). Ours come from the money model.
- Their "turn your phone" screen. An upright phone turns the shoot sideways for you.

## Art notes for the next batch (from the prototype's scene)

The prototype composes its scene with a perspective floor, overlapping scenic flats and a large foreground camera. The Asset Manifest's wide-set pieces (flats and floor at 5 px per unit) are the place to match that depth.
