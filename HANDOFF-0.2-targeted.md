THAT’S A WRAP!

Prototype 0.2: Make the World Feel Alive

Targeted Development Handoff for Claude Code

Project: THAT’S A WRAP!
Current baseline: Existing thats-a-wrap-office project
Milestone: Visual gameplay and interaction improvement
Priority: Improve the existing prototype without rebuilding its working systems

⸻

1. Objective

We have an existing working prototype with hiring, crew management, shoot simulation, a visual production office, budget mechanics, and a playable Burger Job.

The next milestone is to make the experience feel significantly more like a living, animated miniature world.

The player should feel like they are directing a chaotic commercial production, not supervising a collection of progress indicators.

The game should combine:

* The visual richness and living-world feeling of Last Shelter.
* The urgency and spatial awareness of Overcooked.
* The strategic decisions of a production management game.
* The handmade charm of paper-cut animation and cardboard dioramas.

The most important requirement: preserve the existing game logic while dramatically improving how the player experiences it.

Do not begin a new project. Work within the current codebase.

2. Existing architecture

The project already includes:

* data/burger-job.js: Job, crew, tasks, durations, dependencies, and chaos data.
* src/sim.js: Deterministic game simulation, running at 10 ticks per second.
* src/art.js: SVG-based paper-cut characters, office, equipment, and shoot environment.
* src/ui.js: Screen rendering, interactions, hiring, shoot controls, and wrap report.
* src/page.html: Layout and styling.
* build.mjs: Builds the standalone HTML.
* tests/sim.test.js: Simulation tests, including soft-lock testing.

Preserve this architecture unless a specific technical limitation requires changing it.

The deterministic simulation is especially valuable. Do not sacrifice it for visual effects.

Existing systems to preserve

1. Hiring crew with different rates, speeds, reliability, and perks.
2. Art Department referral and freelance-network mechanics.
3. Task dependencies and automatic crew assignment.
4. Manual crew overrides and cross-department work.
5. Stage ownership and shot prioritization.
6. Perishable props and preparation timing.
7. ACTION and shot quality.
8. Key-light failure and its different solutions.
9. Budget, overtime, stars, and wrap report.
10. Company upgrades and persistent progress.

Do not remove or simplify these features.

3. Priority One: The Burger Job set

The Burger Job environment should become the central interactive game board.

Use the approved Burger Job artwork as the primary composition and style reference.

Environment

The set should contain individually rendered, interactive objects:

* Hero burger platform
* Camera and tripod/dolly
* Lighting stands and modifiers
* Grip equipment and rigging
* Art styling table
* Equipment cart
* Production area
* Crew characters

The environment should be layered to create a dimensional paper-diorama effect.

Required visual changes

A. Physical equipment states

Equipment should visually change as tasks progress.

Examples:

* Grip carries and positions a tabletop platform.
* Electric moves a light into position and switches it on.
* Camera adjusts its position and lens.
* Art brings the burger onto the platform.
* Cheese-pull rig appears when built.
* Sauce bottle and rig appear for the final shot.

These changes must be driven by simulation state, not simply by elapsed animation time.

B. Clear workstations

Each station should have a visible identity.

When tapped, show:

* Station name
* Current task
* Assigned crew member
* Task progress
* Any dependency preventing work

The player should be able to understand the state of the set without constantly consulting the task list.

C. Camera and environment framing

Keep the whole set visible on a phone wherever possible.

Use a fixed, slightly elevated theatrical/isometric view.

Do not introduce complex camera controls in this milestone.

The game must remain playable in portrait orientation.

4. Priority Two: Crew movement and personality

Crew members are the heart of the game.

The existing SVG puppets are a good starting point, but they need more expressive animation.

Movement

Add:

* Distinct walking animations
* Directional facing
* Simple pathfinding between workstations
* Appropriate layering when walking behind equipment
* Idle poses
* Working poses
* Reaction animations

Crew should not simply teleport or slide between arbitrary positions.

Use simple navigation nodes or waypoint paths rather than a complex navigation system.

Task animations

Different departments should visibly perform different actions.

Camera

* Adjust tripod
* Look through camera
* Change framing
* Prepare to roll

Electric

* Move lighting equipment
* Adjust fixture
* Turn lights on
* React to lighting failures

Grip

* Carry equipment
* Build rig
* Adjust platform
* Move stands

Art

* Style burger
* Carry props
* Prepare cheese
* Reset tabletop

These can be simple looping animations. We do not need elaborate character rigs.

Personality and behavior

Add a small number of readable character behaviors.

Examples:

* A veteran DP works calmly and efficiently.
* A less experienced crew member occasionally hesitates before a task.
* An unreliable worker may visibly make a mistake.
* A crew member finishing a difficult task celebrates briefly.
* A blocked crew member looks confused or gestures toward the missing setup.

Personality should be communicated through animation, not excessive text.

Avoid stereotypes or making cheaper crew universally incompetent.

Mechanical constraints

Animation must follow the simulation.

Do not allow animations to create a second, conflicting source of gameplay truth.

For the first pass, keep existing crew attributes and outcomes. Represent their effects visually before introducing additional stats.

5. Priority Three: Improve the gameplay interface

The current interface has a useful structure, but too much information competes with the set.

The shoot environment should occupy most of the available screen.

Suggested mobile layout

Top HUD

* Current shot
* Shoot clock
* Budget remaining
* Pause button

Central game area

* Large interactive Burger Job set
* Moving crew
* Workstations
* Equipment and prop states
* Small contextual status indicators

Bottom controls

* Four crew portraits
* Selected crew information
* Compact shot-list access
* ACTION button when appropriate

Interaction behavior

Tap a crew member to select them.

Tap a station or task to assign or prioritize work.

Tap empty space to deselect.

Show visual feedback for:

* Selected crew
* Available assignment
* Invalid assignment
* Blocked station
* Completed task
* Ready-to-shoot state

Retain the existing manual override mechanics.

Do not require drag-and-drop for the initial implementation. Tap-to-select and tap-to-assign should work reliably on mobile.

Shot list

Make the shot list a compact expandable panel.

The player should be able to open it to inspect:

* Remaining shots
* Required tasks
* Optional tasks
* Blocked dependencies
* Shot priority

But the shot list should not dominate the screen during active play.

ACTION

ACTION should be a major gameplay moment.

When a shot is ready:

* Show a strong visual readiness cue.
* Activate the ACTION button.
* Play a clapperboard animation.
* Show a short animated representation of the shot.
* Display the captured result and quality.
* Transition back to the set for the next setup.

The visual payoff should feel rewarding.

6. Priority Four: Make chaos physical

The existing key-light failure is mechanically useful.

Improve its presentation.

Key-light failure

When the event triggers:

1. The actual light on the set flickers.
2. The light turns off.
3. The tabletop visibly becomes darker.
4. The affected crew reacts.
5. A contextual decision panel appears.

Keep the existing resolution options:

* Fix the light.
* Obtain a backup.
* Continue with a lighting compromise.

The chosen solution must produce a corresponding visual change.

For example, a repair sends the gaffer to the fixture. A replacement changes the light. A compromised setup uses visibly weaker lighting.

Do not add a large collection of new chaos events yet.

Instead, make this one event memorable and understandable.

7. Priority Five: Living Production HQ

The current cutaway office is a strong foundation.

Keep its existing rooms and upgrades:

* Craft Services
* Prep Kitchen
* Gear Cage
* Edit Bay

The office should feel like a real production company, not a generic base-building game.

Visual improvements

Add ambient activity:

* Crew walking through the office
* Equipment being moved
* Someone working at a desk
* Editing monitors flickering
* Small office props and details

Upgrade feedback

When a room is purchased:

1. Show a short construction or installation animation.
2. Physically transform the room.
3. Reveal new equipment or furniture.
4. Show a concise explanation of its gameplay benefit.

Owned rooms should remain visibly upgraded.

HQ interaction

Tapping a room should show:

* Room name
* Current level or status
* Gameplay effect
* Upgrade cost, if applicable

Do not add a new room-construction economy.

Do not add additional rooms yet.

8. Art direction

Use the existing style-guide.png and approved concept images.

The intended aesthetic is handmade paper-cut illustration.

Essential characteristics

* Layered construction paper
* Visible cut edges
* Subtle paper and cardboard textures
* Soft shadows between layers
* Slightly irregular shapes
* Expressive character silhouettes
* Warm, playful colors
* Stop-motion-inspired movement

Avoid:

* Generic flat vector UI
* Shiny 3D mobile-game assets
* Plastic-looking characters
* Excessive gradients
* Busy decorative interfaces
* Unrealistically smooth animation

The environment should feel like a tiny physical set built by hand.

Asset approach

Continue using SVG and modular artwork where practical.

Organize visual assets into reusable components.

Separate characters, equipment, props, and environment layers.

If approved artwork is not available as individual sprites, do not embed it as a flat background and pretend it is interactive.

Instead, build modular approximations that can be replaced with final artwork later.

9. Technical implementation requirements

Maintain a clear separation between:

* Simulation state
* Rendering state
* Animation state
* Input handling
* Asset definitions

Movement and animation

Use a lightweight scene-graph or object-based approach.

Animation should interpolate between simulation states without modifying the underlying deterministic game logic.

Avoid unnecessary full-scene DOM rebuilding on every frame.

Prefer updating only the elements that change.

Performance

Target smooth gameplay on recent iPhones.

Avoid expensive continuous SVG filter effects, excessive DOM nodes, and unnecessary layout recalculations.

Provide reduced-motion support.

Pause or reduce animation work when the game is not active.

Testing

Keep existing simulation tests passing.

Add tests where changes affect gameplay state.

Check:

* Crew assignments
* Task completion
* Chaos resolution
* Shot progression
* Budget integrity
* Save/load behavior
* No soft locks

Include a simple manual visual QA checklist for phone-sized screens.

10. Implementation milestones

Milestone A: Visual set improvements

Deliver:

* More detailed, layered Burger Job environment
* Independently rendered equipment
* Visible equipment and prop state changes
* Interactive workstations
* Improved visual hierarchy

Acceptance: The player can identify what the crew is doing by watching the set.

Stop and provide a playable build for review.

Milestone B: Crew animation

Deliver:

* Walking between stations
* Department-specific work animations
* Idle and blocked states
* Character reactions
* Improved crew selection feedback

Acceptance: Crew movement and actions communicate the underlying simulation.

Stop and provide a playable build for review.

Milestone C: Shoot interaction

Deliver:

* Improved mobile HUD
* Expandable shot list
* Contextual station interactions
* Improved ACTION sequence
* Shot capture feedback

Acceptance: A player can complete the Burger Job primarily by interacting with the visual set.

Stop and provide a playable build for review.

Milestone D: Chaos and HQ polish

Deliver:

* Physical key-light failure
* Visual resolution of the event
* Ambient HQ animation
* Upgrade transformation feedback
* Performance and usability polish

Acceptance: The set and HQ feel like parts of a living miniature production world.

Stop and provide a playable build for review.

11. Explicitly out of scope

Do not implement the following in Prototype 0.2:

* Production Week
* Multiple simultaneous shoots
* City map
* Rival production companies
* New job types
* Complex crew relationship systems
* New financial economy
* Multiplayer
* Monetization
* Large research trees
* Additional studio buildings
* New technical framework without justification

These are future milestones.

The goal is to make the existing gameplay compelling before expanding its complexity.

12. Definition of done

Prototype 0.2 is successful when:

1. The existing Burger Job remains fully playable.
2. The set occupies the majority of the gameplay screen.
3. Crew visibly travel to and work at stations.
4. Equipment and props visibly change as tasks progress.
5. The player can assign work through the set.
6. Crew attributes produce understandable visual consequences.
7. The key-light failure happens visibly in the environment.
8. ACTION produces a satisfying shot-capture moment.
9. HQ upgrades physically transform the office.
10. All existing simulation tests pass.
11. The experience remains usable on an iPhone-sized screen.
12. The game feels like an animated miniature production, rather than a task-management interface.

13. Instructions before coding

First, inspect the existing repository and run its tests.

Then provide:

1. A concise assessment of what can be reused.
2. A proposed visual rendering and animation architecture.
3. Any performance concerns with the existing SVG approach.
4. A list of required art components.
5. An implementation plan for Milestone A.

Do not start all four milestones at once.

Implement Milestone A first, produce a playable build, and wait for creative review before proceeding.

The central creative principle:

The player should understand the production by watching the world, not by reading a list.