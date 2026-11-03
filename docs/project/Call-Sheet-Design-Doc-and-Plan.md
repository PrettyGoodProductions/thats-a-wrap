# Call Sheet: Design Doc and Plan

Nov 2, 2026 · @Tomás Valladares

## Concept

Call Sheet is a single-player, real-time shoot-day game for iPhone. You run a tiny production crew and race the clock to wrap a client's shot list. It borrows the juggling of Overcooked and the studio growth of base-builders like Last Shelter, and wraps both in the humor of real production life.

Three pillars:

- **One thumb, one screen.** Every action is a tap or a drag and reads at phone size.
- **Controlled chaos.** Levels start calm and get loud. The fun is recovering, not avoiding.
- **Production humor.** The jokes come from real sets: "one more take," "can you make it pop," "it's a quick fix in post."

## Core loop

One level is one shoot day, about 2 to 3 minutes of play. Dropping co-op changes the role, not the pressure: you are the first AD. You cannot do the work yourself, only decide who does what and in which order, so the skill is queuing and prioritizing.

1. **Brief.** The client card shows the shot list (3 shots in level 1), the budget, and the wrap time.
2. **Assign.** Tap a crew member, then tap a station. They walk over and work, shown by a progress ring.
3. **Build each shot in order.** Set the scene (grip), light it (gaffer), frame it (DP), then roll.
4. **Survive chaos.** Events interrupt the shot, and the right crew member must fix them before work continues.
5. **Wrap.** Finished shots go into the cut. Clock, budget, and client mood decide your stars.

## Crew and stations

Four crew, four stations. Each crew member is fast at their own station and slow or unable elsewhere, so reassigning has a cost.

| Crew | Station | Job | Why they matter |
| --- | --- | --- | --- |
| Grip | Set | Builds and strikes the tabletop set, positions props | Every shot starts here |
| Gaffer | Lights | Places lights, fixes flicker | Shot cannot be framed until lit |
| DP | Camera | Frames, rolls, re-rolls bad takes | Only role that can roll |
| PA | Craft and props | Fetches batteries, backup props, coffee | Fast and free to roam, the hero of every chaos event |

Controls: tap a crew member, then tap a station or a chaos icon. A second tap queues a follow-up task (two queued at most). Tapping a chaos icon sends the closest crew member who can fix it.

## Chaos events

Six events for the first world. Each shows an icon over the affected station, then a short fuse before it hurts.

| Event | What happens | Fix |
| --- | --- | --- |
| Light flicker | The shot in progress pauses | Gaffer re-rigs, about 4 s |
| Hero prop wilts | Prop quality drops, and a wilted prop forces a reshoot | PA fetches a backup prop, about 5 s |
| Dead battery | Camera goes offline mid-roll | PA swaps the battery, about 3 s |
| Client changes the brief | One shot on the list is swapped for another | Re-queue the crew, built sets carry over when they match |
| Soft focus | A take comes out unusable | DP re-rolls, about 4 s, and it costs budget |
| Noise hold | All rolling pauses for about 6 s | Wait it out, or the PA deals with it in about 3 s |

## Scoring and stars

Three things are tracked live: the shot list, the budget, and a client mood meter. All numbers below are starting values to tune in playtests.

- **1 star:** every shot on the list is wrapped before the hard cutoff.
- **2 stars:** wrapped before overtime begins.
- **3 stars:** wrapped under budget with client mood at 70 percent or higher.

Budget drains from overtime, backup props, and re-rolls. Client mood drops while a shot sits idle and after each reshoot, and recovers when a shot wraps cleanly.

## Prototype scope

The grey-box build exists to answer one question: is a single tabletop shoot fun for two minutes? It runs in a phone browser so you can test it on your own device.

**In:**

- One level, a tabletop food spot with 3 shots
- 4 crew, 4 stations, tap-to-assign with a two-task queue
- 3 chaos events: light flicker, wilting prop, dead battery
- Shoot clock, budget meter, client mood meter, star results screen
- Placeholder shapes and flat colors only

**Out, on purpose:** art, sound, tutorial, saving, more levels, location shoots, the studio upgrade layer.

## Later layers

None of this gets built until the single tabletop level is fun.

- **Location shoots:** bigger maps, loading the van, travel time, and a moving sun that closes your light window.
- **Studio meta game:** spend earnings on gear, an edit bay, a prop room, and a bigger space. Hire crew with traits, such as a fast grip or a DP who needs more coffee.
- **Idle income:** the edit bay renders while you are away and pays out small amounts.
- **Client tiers:** local spots, then music videos, commercials, and a feature.

## Art direction

The look is paper cut: layered flat shapes with soft drop shadows between layers, so every set feels like a small handmade diorama. The mood board will set the details.

- [ ] Palette (5 to 7 colors, plus one chaos accent)
- [ ] Typography for the UI and the client brief cards
- [ ] Crew character style: how much face, how much body
- [ ] Reference images for paper texture, shadow depth, and layering

## Roadmap

Each phase ends at a gate, and we do not start the next one until the gate is passed. Dates are targets and will slip around holidays. This assumes you can give a few hours a week to playtesting and art direction.

1. **Grey-box prototype, Nov 2 to Nov 15.** Gate: one level is winnable and losable, and the chaos events feel fair.
2. **Playtest, Nov 16 to Nov 22.** 5 to 10 people play without instructions. Gate: most of them want a second run.
3. **Vertical slice, Nov 23 to Dec 27.** 5 levels in the paper-cut style with sound and polish, built in a real engine. Gate: it looks and feels like a game worth buying.
4. **Content and meta, Dec 28 to Feb 21.** Grow to 15 levels and add the studio upgrade layer.
5. **TestFlight beta, then App Store submission.** Gate: no crashes in a week of beta use.

**This week.** You: start Apple Developer Program enrollment and the mood board. Me: this doc and the grey-box prototype.

## Business notes and open questions

- **Monetization lane:** base-builder games lean on heavy ads and in-app purchases, and user acquisition is expensive. A premium or light-purchase model with a distinctive look is the more realistic indie lane.
- **Apple:** the Developer Program costs $99 a year, and approval can take days. Enrolling as an organization instead of an individual needs a D-U-N-S number and takes longer, but shows a company name as the seller.
- **Name check:** confirm "Call Sheet" is free on the App Store and clear to use before we invest in branding.
- **Open question, engine:** Unity or Godot for the real build. Both export to iOS. We decide after the prototype.
- **Open question, art:** whether you draw the paper-cut assets yourself or we hire an illustrator for the vertical slice.
- **Risk:** scope creep. The studio layer is tempting, and it stays locked until the tabletop level is proven.

## Update, Nov 2: That's a Wrap! build plan

The concept moved to the THAT'S A WRAP! handoff, and that handoff now replaces the sections above. Changes from the first draft: the crew work on their own and the player can override them, a PA is no longer part of the four-person crew, and the studio meta layer is gone in favor of growing the company's capability.

- **Tech path:** a browser prototype first, then a Capacitor wrapper for iOS (the easiest route for a first app). Godot only if performance later demands it.
- **Burger Job graph:** 3 shots and 13 tasks. Lighting is optional at a quality cost, melted cheese goes bad after 25 seconds, and the stage holds one shot at a time while Art preps ahead.

| Milestone | Scope | Status |
| --- | --- | --- |
| 1 | Simulation, debug UI, tests | Done, 16 tests passing |
| 2 | Touch controls and portrait HUD | Next |
| 3 | Key light chaos event, budget, stars, wrap report |  |
| 4 | Paper-cut visuals, ACTION moments, wrap replay |  |
