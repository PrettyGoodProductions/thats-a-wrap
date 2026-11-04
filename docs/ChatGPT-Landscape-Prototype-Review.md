# ChatGPT landscape prototype: what we adopted and what is next (Nov 3, 2026)

Source: Thats-A-Wrap-Mobile-Source.zip (the Burger Job prototype). Code branch: `feature/landscape-shoot-layout` in the repo. Not merged to master.

## Adopted now (done, 67 sim tests pass)

- **Landscape shoot layout.** Slim HUD on top (title, cash, time bar with the WRAP marker, pause). Crew in a 2x2 block on the left, the set in the middle at the largest size the screen height allows, shot list with task icons on the right, and the "what's needed" ribbon under the crew. Nothing scrolls. Portrait is unchanged.
- **Sizing.** Task icons grow to 44px on screens 740px wide and up (36px on a 667px-wide phone). Crew cards are 72px wide and up. Safe-area insets and dynamic viewport height are respected.
- **Rotation keeps the shoot.** Rotating during a shoot changes only the layout. The sim, the selected crew and task progress carry over.
- Already in our build, no change: auto-pause when the tab is hidden, depth-sorted crew, a progress ring on each station.

## Worth adopting next (needs a decision from Tomás)

1. **Client review loop.** After a take the client reviews it, then either approves or sends a note ("Can we see more of the logo?"). The player chooses a retake (short art adjust, camera reframe, roll again) or accepts a flat quality penalty. This gives ACTION a consequence and a decision. It touches the sim and tests.
2. **Rush crew ($600, 20s of faster work) as an always-visible button.** A money-for-time trade that fits the HQ economy and the Active Play proposal.
3. **Freshness shown as a countdown on the shot ("FRESH FOR 23s", then "STALE −20")** with an Art action to refresh prep. We have perishables in the sim, but the player never sees the clock.
4. **A wide set.** Their scene is composed for landscape: a perspective floor, overlapping flats and a big foreground camera. Ours is a portrait diorama shown at about 300px wide in landscape. Recomposing the set into a wide stage is the next art task, and it should be built to the Asset Manifest.
5. **Portrait hold screen.** A "turn your phone" prompt that pauses the shoot, with an opt-out. Only needed if we commit to landscape-only.

## Not taking

- Their canvas renderer, assembled character images, and fixed 4-person roster. Our SVG layers, modular rig and loader are the better base.
- Their tuning numbers ($8,550 budget, $22/s burn, 240s deadline). Ours come from the money model.

## Open decision

Orientation: with this layout, landscape is playable today. Do we make landscape the primary shoot orientation, or keep portrait primary and landscape a bonus?
