# That's a Wrap! Prototype 0.2 Build Plan

Nov 3, 2026 · @Tomás Valladares

## Summary

Original recommendation (superseded by the Nov 3 decision below): rebuild the view layer in **Phaser 3**, a browser game framework, in landscape to match the concept art. Keep the current simulation engine and its tests as the game's brain, and wrap it for iOS with Capacitor later. About 60% of the gameplay logic in 0.2 already exists and is tested. What's missing is mostly presentation: sprite scenes, crew who physically walk, a camera that pans and zooms, and a richer money and crew model.

The open questions are in "Still open" near the end of this doc.

## Tech stack

Phaser 3 for the scenes, plain HTML panels on top for cards and menus, and Capacitor to package it as an iPhone app. The current SVG approach got us here fast, but it won't hold up for full-screen scenes with dozens of animated sprites, paper textures and camera moves on a phone.

| Option | Strengths | Weaknesses | Verdict |
| --- | --- | --- | --- |
| **Phaser 3 (browser)** | Built for 2D games: sprites, layers, tweens, camera pan and zoom, touch input. Playable from a link on any phone. Keeps our JavaScript engine as is. | Text-heavy UI is clumsy inside the canvas, so we use HTML panels for that. | **Recommended** |
| Godot 4 | Strong editor, native iOS export, good 2D animation tools. | A full rewrite in a new language. I can't run or test it from here, so every build would go through you. Steeper for a first-time app maker. | Revisit only if Phaser hits performance limits |
| Current SVG pages | Already working, easy to tweak. | Slows down on phones with many filtered, animated objects. No real camera. Not a sprite pipeline. | Retire after Milestone A |

Path to the App Store: wrap the Phaser build with Capacitor, open it in Xcode on your Mac, and submit through your Apple Developer account. The game code doesn't change.

## What we keep from the current prototype

| Piece | Status | Change for 0.2 |
| --- | --- | --- |
| Simulation engine (`sim.js`) | Keep | Task dependencies, parallel work, auto crew, overrides, stage lock, perishables, chaos choices, botches, scoring, deterministic clock. Add moving and recovering states, new attributes, retakes, a second chaos event. |
| 31 automated tests | Keep and extend | Add tests for walking time, organization handoffs, relationships, retakes and the client-change event. |
| Level data format | Keep | Add stations with map positions, PA, traits, relationships, prep and rental costs. |
| Hiring logic and dry art network | Keep | Turn it into a real referral chain that saves the new contact to your roster. |
| Office room upgrades | Park | The 0.2 spec says no room building yet. The code stays, hidden, for later. |
| SVG puppets and props | Reuse as temporary sprites | Convert to images at load time until real art arrives. |
| Screens and layout (`ui.js`, `page.html`) | Replace | Rebuilt as Phaser scenes plus HTML panels in landscape. |

## Architecture

Three layers, with the game rules kept apart from the drawing. That's what lets the same engine run in tests, in a browser and on an iPhone, and lets us swap temporary art for real art without touching gameplay.

&#91;embedded content: architecture · 3 layers\]

The view never decides anything. It sends player commands (assign, prioritize, choose, ACTION, retake) and animates the events the simulation reports back. Crew walking moves into the simulation: walk time between stations is real game time, so organization and layout actually matter.

| Screen | Built as | Key interactions |
| --- | --- | --- |
| Production HQ | Phaser scene | Living diorama, HUD for cash, rep, favors and week, job board, active job card |
| Job Brief | HTML card over HQ | Burger art, client note, $28,000 budget, Net 30, departments |
| Crew and Budget | HTML panel, HQ dimmed behind | Candidates per department, referral chain, live estimate and margin |
| Shoot | Phaser scene, HUD panels around it | Select crew, reassign, priorities, inspect blocks, chaos cards, ACTION, retake |
| Wrap Report | HTML card over the set | Quality, time, cost, margin, satisfaction, rep, relationships, receivable |

## Decision, Nov 3: evolve the current prototype

Tomás prefers the current playable build, so 0.2 grows it in place rather than rebuilding in Phaser. Phaser stays the fallback if phones struggle. Changes coming in from the 0.2 handoff:

| Area | What changes | Shows up as |
| --- | --- | --- |
| Money | $28,000 client budget is revenue. Costs: crew, gear package, studio and food prep, optional PA, rentals, overtime. Live estimate with projected margin. | Estimate panel while hiring, budget vs spend on set |
| Net 30 | Costs leave your cash at wrap. The client invoice becomes a receivable due 4 weeks later. End the week to advance time, or get paid now for a 3% fee. | Cash and receivables at HQ, End week button |
| Crew attributes | Skill, organization, reliability, speed, relationship, availability and one trait. Each one changes the shoot (next section). | Bars and trait chip on every candidate |
| Referral chain | Ask Mika for a referral, post on the crew board, or spend a favor to free up Lu. Anyone you hire is saved to your network. | New contacts appear as "yours" next job |
| Optional PA | A cheap helper who assists any department and runs to the truck. Hire up front or call one in mid-shoot. | Fifth puppet on set, Add help button |
| Walking | Crew walk between stations in game time. | Moving state, visible walking |
| Second chaos | Client changes the look: accommodate, charge a change order, or defer to post. | Client card from video village |
| Client satisfaction | Moves with quality, chaos choices and overtime. Feeds reputation. | Satisfaction meter, wrap report |
| Retakes | After each take: accept it, or spend time on one more take for better quality. | Take review card |
| Wrap and HQ | Costs paid, receivable, margin, satisfaction, rep, relationship changes. | Wrap report, HQ top bar with cash, owed, rep, favors, week |

### How the crew attributes work

| Attribute | Effect on the shoot | Why the player understands it |
| --- | --- | --- |
| Speed | Task time divided by speed | Faster progress rings |
| Skill | Scales the quality of every shot they work on | Quality number on the clapper |
| Organization | Pause after each task before the next one, and slower walking. A low-organization crew member stands around until you direct them. | "Checking the call sheet" bubble |
| Reliability | Chance a finished task is botched, then a short recovery and half a redo, once per task | "Botched" message, recovering state |
| Relationship | Pairs who know each other work faster on the same shot. Your relationship with them decides who will refer people. | Chemistry tag on hire cards |
| Trait | One rule each: Perfectionist, Calm under pressure, Hustler, Spare bulb, Food whisperer, One-take | Trait chip |

## Still open

- [ ] Orientation. The concept art is landscape. This build stays portrait for now. Switching is a layout change, not a rewrite.
- [ ] Office rooms. The handoff says no room building yet, but the current build has it and Tomás likes it. It stays, with prices raised to the new money scale.
- [ ] Two shoot days. The concept HUD shows day 1 of 2. This build is one day.
- [ ] Final art. The asset list is the next request for ChatGPT: one object per image on a transparent background.

## Art assets to request from ChatGPT

One object per image, transparent background, front three-quarter view, same paper-cut style and lighting as the concept art. The code places, moves and animates them, so each piece must stand alone.

| Group | Pieces |
| --- | --- |
| Crew puppets | DP, Gaffer, Grip, Art, PA, each in 3 poses: standing, walking, working. Head and body separate if possible. |
| Set | Hero platform, yellow sweep backdrop, key light (on and off), fill light, flag on C-stand, camera on dolly, dolly track, art cart, equipment cart, director's chair, video monitor |
| Props | Burger, burger with cheese stretch, sauce bottle, sauce drip, cheese pot, sauce bowl |
| HQ | Building shell, production office, edit room, art department, gear cage, job board, van, dog |
| UI | Torn paper card, tape strip, ticket button, star, clapperboard |

## Build order

1. Engine: money model, attributes, walking, PA, second chaos, satisfaction, retakes. Tests first.
2. Hiring screen: new stats, traits, chemistry, referral chain, favors, live estimate.
3. Shoot screen: budget vs spend, satisfaction meter, client card, take review, Add help.
4. Wrap report and HQ finances: receivables, End week, get paid now, saved roster.
5. Phone-size playthrough, publish to the same link.

The 0.2 handoff and both concept images are saved in the project folder as reference.
