THAT’S A WRAP!

Prototype 0.2 — Development Handoff

Project: Mobile production company management game
Milestone: First complete visual gameplay loop
Development lead: Claude Code
Creative direction and game design: User + ChatGPT

⸻

1. Project vision

THAT’S A WRAP! is a visually rich, single-player mobile strategy game about running a commercial video production company.

Players bid on jobs, build a network of freelance crew, manage budgets and equipment, and actively oversee shoots.

The primary challenge is assembling the right team, planning efficiently, and adapting when things go wrong.

The game combines:

* The layered progression and living-world feeling of Last Shelter.
* The urgency and task coordination of Overcooked.
* The financial and strategic decisions of a production management simulator.
* A distinctive handmade paper-cut, cardboard-diorama visual style.

This is not a spreadsheet simulator, idle clicker, or traditional studio-building tycoon.

The player should feel like they’re running a real, increasingly complicated production company.

2. Current development objective

Build one connected, visually playable prototype:

Production HQ → Job Brief → Crew & Budget → Shoot → Wrap Report → HQ

The first job is a tabletop burger commercial.

The prototype must demonstrate that choices made before the shoot visibly and mechanically affect the shoot itself.

Do not expand to multiple jobs, a city map, rival companies, or advanced progression yet.

3. Visual direction

Use the approved concept artwork supplied separately as the primary visual reference.

Required aesthetic

* Handmade paper-cut characters and environments.
* Layered cardstock, cardboard, felt, and subtle paper grain.
* Slightly imperfect character proportions and silhouettes.
* Visible paper edges and dimensional shadows.
* Playful, tactile, stop-motion-inspired animation.
* Warm, muted colors with strong accent colors.
* Miniature theatrical environments with physical depth.

Avoid generic mobile-game vector art, conventional dashboards, or polished low-poly 3D.

Technical implementation

The visual environments should be constructed from reusable sprites, layers, and animated elements.

Do not implement the entire game as a static background image with clickable regions.

Characters, equipment, props, stations, and set elements must be individually addressable game objects.

The approved artwork is concept reference, not a finished production sprite sheet.

For the prototype, temporary modular paper-cut assets are acceptable if they preserve the intended aesthetic.

4. Platform and technical approach

Prioritize a playable desktop-browser prototype with a layout that can adapt to mobile.

Recommend whether to use Godot or a browser-based canvas/game framework before implementation.

The architecture should allow eventual deployment to iOS without rewriting the game logic.

Separate the following systems:

* Game state and persistence
* Job and production data
* Crew roster and relationships
* Budget and financial calculations
* Task dependencies and scheduling
* Crew AI and movement
* Chaos events
* Visual rendering and animation
* User interface

Use data-driven definitions for crew, jobs, shots, tasks, and events.

Avoid hardcoding gameplay logic into visual components.

5. Screen A: Production HQ

Create a visual, interactive miniature production headquarters.

It should feel like a living paper-cut diorama rather than a dashboard.

Environment

Include a compact headquarters with:

* Production office
* Job board
* Equipment cage
* Art department
* Edit station
* Production vehicle or loading area

Crew members should have simple ambient animations.

HUD

Display:

* Available cash
* Reputation
* Current production week
* Active job
* Navigation to jobs, crew, and equipment

For the prototype, only the relevant modules need to be functional.

Required interaction

The player can select the Burger Job from the job board or active job card.

The camera or UI transitions into the job briefing.

Do not build room construction or upgrading yet.

6. Screen B: Job Brief

The Burger Job:

* Client budget: $28,000
* Shoot: tabletop food commercial
* Required shots: Hero Burger, Cheese Pull, Sauce Pour
* Payment terms: Net 30
* Required departments: Camera, Grip, Electric, Art
* Optional production assistant

Display a visual job card with an illustrated burger and a short client brief.

The player should understand the creative requirements, budget, and expected challenges.

7. Screen C: Crew Selection and Budget

This is a major gameplay system, not a simple list.

Required mechanics

Each department has multiple potential candidates.

Each candidate has:

* Name and role
* Day rate
* Technical skill
* Organization
* Reliability
* Speed
* Relationship strength
* Availability
* One personality trait

These attributes must affect gameplay.

For example:

Premium DP: Expensive, highly organized, quick setups, reliable.

Budget DP: Affordable, slower setups, may need player intervention, but leaves more contingency.

Crew network problem

The player’s usual Art Department contacts are unavailable.

The player must choose how to find someone:

1. Request a referral from an existing crew member.
2. Search an external freelance network.
3. Spend a relationship favor for a trusted introduction.

For this prototype, implement one functional referral chain.

A successful referral should create a persistent new crew contact.

Budget mechanics

Hiring crew immediately updates the production estimate.

Also account for:

* Equipment rental
* Prep expenses
* Contingency
* Optional PA

Display projected cost, remaining budget, and projected margin.

The player should be able to compare tradeoffs.

For the prototype, allow players to revise their crew choices before confirming the shoot.

8. Screen D: The Burger Job Shoot

This is the most important screen.

Environment

Build a playable miniature tabletop set containing:

* Burger hero platform
* Camera and dolly
* Key light and fill light
* Grip equipment
* Art styling station
* Equipment cart
* Director/producer position

The player should see their selected crew members moving around the environment.

Core interaction: Smart Crew System

Crew members automatically perform routine tasks appropriate to their role.

The player controls priorities rather than every individual movement.

Players must be able to:

* Select a crew member
* View their current task
* Reassign or prioritize work
* Inspect blocked tasks
* Respond to chaos events
* Call ACTION when a shot is ready

Crew AI states

At minimum:

* Idle
* Moving
* Working
* Waiting
* Blocked
* Recovering

Crew should automatically select appropriate available tasks, respecting prerequisites and assigned priorities.

Crew must visibly move to the relevant station before beginning work.

Shot list

Implement three shots:

Shot 1: Hero Burger

* Art prepares the burger.
* Grip prepares the platform.
* Electric sets the lighting.
* Camera frames.
* Player calls ACTION.

Shot 2: Cheese Pull

* Art prepares the cheese effect.
* Grip adjusts the rig.
* Electric modifies lighting.
* Camera reframes.
* Player calls ACTION.

Shot 3: Sauce Pour

* Art prepares the sauce.
* Grip adjusts the setup.
* Camera prepares the shot.
* Player calls ACTION at the appropriate moment.

Tasks should support dependencies and parallel execution.

For example, art and lighting can work simultaneously when their work areas do not conflict.

Visual feedback

Show work happening physically:

* Lights move and illuminate the burger.
* Props appear or change.
* Camera moves to a new position.
* Crew walk between stations.
* Completed setups visibly transform the scene.

Use progress indicators as secondary feedback, not the primary gameplay presentation.

Chaos events

Implement at least two:

Equipment failure: Key light fails. Player chooses repair, replacement, or compromised shooting.

Client change: Client requests a different look. Player chooses to accommodate, negotiate, or defer to post.

Chaos decisions must have consequences for time, money, quality, or client satisfaction.

Crew attribute consequences

Technical skill affects shot quality.

Organization affects preparation and handoffs.

Reliability affects mistakes and recovery.

Speed affects task duration.

Relationships can affect coordination.

Avoid making outcomes entirely random. Players should understand why a problem occurred.

9. Shot completion

When required departments are ready, activate the ACTION control.

Calling ACTION should trigger a short animated shot moment.

Examples:

* Burger hero reveal
* Cheese stretching
* Sauce pouring

Shot quality should depend on preparation, crew skill, and any compromises.

After capture, advance to the next shot.

Allow players to choose whether to accept a usable shot or spend time attempting a retake.

10. Screen E: Wrap Report

Show:

* Shots completed
* Shot quality
* Time used
* Final production cost
* Projected profit
* Client satisfaction
* Reputation gained
* Crew relationship changes
* Outstanding client payment

Clearly distinguish cash already paid out from future receivables.

The client should not instantly pay the entire invoice when the job wraps.

After reviewing results, return to HQ.

11. Persistent game state

Save:

* Available cash
* Crew roster
* Newly discovered referrals
* Relationships
* Equipment
* Job status
* Production costs
* Reputation
* Accounts receivable

For the prototype, local save data is sufficient.

Include a Reset Prototype option.

12. Required visual and interaction standards

The game must not feel like a sequence of forms.

Use full-screen illustrated environments for HQ and the shoot.

Use overlays, cards, and panels for supporting decisions.

The shoot must remain visible while the player manages tasks.

Provide clear animation for movement, work, completed tasks, and failures.

Prioritize readable controls and large touch targets.

Use temporary assets if necessary, but maintain the handmade visual direction.

13. Implementation milestones

Milestone A: Visual foundation

* HQ scene
* Burger set scene
* Camera framing and navigation
* Paper-cut visual components
* Basic crew puppet animation

Milestone B: Crew and budget

* Crew selection
* Candidate attributes
* Budget calculations
* Referral event
* Persistent crew roster

Milestone C: Live shoot

* Crew navigation
* Task scheduling
* Dependencies
* Smart Crew AI
* Shot transitions
* ACTION control

Milestone D: Chaos and consequences

* Equipment failure
* Client request
* Attribute-based outcomes
* Shot scoring

Milestone E: Complete loop

* Wrap report
* Financial settlement
* Reputation and relationship updates
* Return to HQ
* Local persistence

14. Acceptance criteria

The prototype is successful when:

1. A player can begin at HQ and finish a complete Burger Job.
2. The game contains a clearly visible, animated production environment.
3. Crew physically move and work at different stations.
4. Different hiring choices produce noticeably different shoot outcomes.
5. The player can make meaningful decisions during the shoot.
6. Completing a shot produces a satisfying visual payoff.
7. Financial results persist after returning to HQ.
8. The game can be replayed with different crew selections.
9. The interface remains usable on a mobile-sized screen.
10. The prototype feels like a game, not an interactive spreadsheet.

15. Instructions for Claude Code

Before writing the full implementation:

1. Review this specification.
2. Inspect the existing prototype and identify reusable code.
3. Recommend the technical stack.
4. Propose a scene and state architecture.
5. Identify required temporary art assets.
6. Present a milestone-by-milestone implementation plan.
7. Highlight any essential unresolved design decisions.

Once the architecture is approved, build incrementally.

Do not substitute menus or static diagrams for the requested visual gameplay.

The priority is a small, polished, genuinely playable experience that demonstrates the relationship between crew selection, production efficiency, and shoot outcomes.

The next prototype should make us want to play another job.