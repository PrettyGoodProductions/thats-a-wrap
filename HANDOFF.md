THAT’S A WRAP!

Game concept & prototype handoff for Claude

Implementation handoff • Concept and game design by the creative team • Coding/prototyping by Claude
Status: pre-production concept, not a locked technical specification

01 / Project vision

• THAT’S A WRAP! is a single-player, mobile-first, stylized production-management game. Players run a production company by assembling efficient crews and directing increasingly complex commercial shoots. The core fantasy: make the day, get the shots, stay profitable, and survive absurd client notes.
• Not a studio-lot builder. The production company is represented by a crew roster, equipment inventory, capabilities, reputation, and available bookings. The primary fun is active shoot-day decision-making, not passive construction.

02 / Core gameplay loop

• BOOK: Select a job with a brief, shot list, deadline, budget, and constraints.
• CREW: Choose a small team from the roster, balancing skill, cost, and specialization.
• SHOOT: Manage the crew’s priorities in real time, handle bottlenecks and chaos, and call ACTION when a shot is ready.
• WRAP: Score shot completion, time, quality, and profit; earn reputation and resources.
• GROW: Recruit or level crew and unlock equipment/capabilities; accept harder productions.

03 / Interaction model: smart crew with some manual control

• Crew members autonomously perform routine tasks in their specialty and pick up eligible work from a priority queue. They do not need to be micromanaged for every action.
• Player can tap/select a crew member and assign or override a task; reorder shot priorities; respond to chaos choices; and explicitly call ACTION to capture a shot.
• Crew status: WORKING, WAITING (dependency or no eligible work), BLOCKED (problem needing intervention). Show clear visual status and task progress.
• Efficiency comes from overlapping independent tasks and anticipating dependencies, not tapping quickly. Keep the player meaningfully engaged without requiring constant input.

04 / Shot system and dependencies

• Every job has a shot list. Each shot is composed of tasks tagged by department, duration, dependencies, and readiness effects.
• Example: Hero Burger requires Art/style burger, Grip/build tabletop, Gaffer/light scene, Camera/frame. Independent setup tasks may run in parallel; camera framing may require grip completion.
• Next-shot preparation is possible while the current shot is being captured, provided the resources and stations are available.
• Calling ACTION produces a visible, delightful miniature shot moment. Incomplete prep may be allowed at a quality penalty, but define clear minimum readiness rules.
• Score speed, quality, budget, and completion separately. Avoid arbitrary randomness that makes planning irrelevant.

05 / Chaos and client notes

• Use a small event deck triggered at deliberate points, not nonstop random interruptions. Examples: dead key light, depleted battery, client requests more “premium” lighting, talent late, rain, permit issue.
• Each event presents legible trade-offs: spend budget, reassign crew and lose time, accept quality loss, or defer work to post.
• Events should interact with crew/equipment strengths. A backup light or experienced gaffer should change the available response.
• Humor is an important differentiator: “Can we do one more take?”, “It’s a quick fix in post,” “Can it pop more?” Keep jokes concise and grounded in production culture.

06 / First vertical slice: The Burger Job

• Target: a replayable 2–3 minute tabletop shoot; initial time limit is a tuning parameter, not a fixed requirement.
• Four roles: DP/Camera, Gaffer/Lighting, Grip/Rigging, Art/Food styling. One small tabletop stage.
• Three shots: (1) Hero Burger, (2) Cheese Pull, (3) Sauce Pour. Give each 3–5 concrete tasks and explicit dependencies.
• One scripted chaos event: key light fails. Offer at least two solutions with different time/budget/quality costs.
• Basic flow: job brief → crew screen (preset roster initially) → live shoot → wrap report → replay.
• Player actions: select crew, assign override, reorder or prioritize a shot, choose chaos response, tap ACTION.
• Show shot list, remaining time, budget, quality/readiness, and crew status without covering the stage.

07 / Visual and UX direction

• Handmade cut-paper collage and miniature theatrical dioramas, inspired by the user-provided reference imagery. Distinct visible paper edges, layered cardstock, corrugated cardboard, imperfect ink marks, soft physical shadows, and tactile materials.
• Crew are quirky articulated paper puppets with exaggerated silhouettes, oversized accessories, and slightly awkward stop-motion-like movement. Avoid glossy generic 3D or overly smooth vector art.
• Environments are charming but not visually noisy; interactive stations, crew, and actionable alerts must remain legible at phone size.
• Palette direction: warm paper #F2E9D8, coral #D86B56, sage #7D9E91, mustard #E7B84F, slate blue #344F70. Exploratory, not locked.
• Use clean readable UI typography, with hand-lettered accents on call sheets and labels. Portrait orientation is preferred for testing, but verify ergonomics early.
• Art concept images are mood/reference material, not production-ready assets or exact UI specifications. Build reusable modular art and placeholder graphics first.

08 / Progression after validation

• Growth is about company capability, not building a physical lot: roster, equipment packages, production operations, reputation, client tiers.
• Tabletop jobs are smaller and puzzle-like. Location shoots introduce larger maps, moving equipment, sun windows, travel, weather, and permits.
• Advanced systems to explore later: overlapping bookings that compete for crew/equipment, and multi-unit shoots on a single larger production.
• Do not build these systems in the first vertical slice.

09 / Scope and non-goals

• In scope for first playable: one stage, four roles, three shots, deterministic task scheduler, basic autonomy, manual overrides, one chaos event, timer, scoring, and restart.
• Out of scope: co-op/multiplayer, idle income, studio lot construction, multiple concurrent live shoots, procedural level generation, live backend, monetization, full character progression, complex bidding, 15 levels.
• Do not add advertisements, energy systems, loot boxes, or in-app purchases to the prototype.

10 / Technical approach and deliverables

• Suggested engine: Godot 4.x, with data-driven job/shot/task/event definitions. Claude should first assess suitability for iOS and whether a rapid desktop/web test build is practical. Avoid committing to a complex rendering stack before testing interaction.
• Implement a deterministic, pauseable simulation clock; a task dependency graph; resource/crew assignment; event resolution; and clear UI state. Separate simulation logic from visuals.
• Deliver a runnable prototype project, a short README with exact run steps, editable level data, placeholder asset list, and a short explanation of architecture.
• Work incrementally: (1) simulation + debug UI, (2) touch interaction + level, (3) chaos + scoring, (4) visual polish. Show a playable build after each stage.
• Add basic tests or reproducible debug scenarios for dependency resolution, simultaneous tasks, crew reassignment, and scoring.

11 / Acceptance criteria

• Player can finish all three shots in a single session and understands why a shot is or is not ready.
• Crew automatically start eligible work and become visibly waiting/blocked when appropriate.
• Manual reassignment and priority changes have immediate, understandable effects.
• At least one decision meaningfully trades time, money, or quality.
• A full run can be restarted and completed without soft-locks; results reflect actual performance.
• Touch targets and text remain legible on a phone-sized viewport; gameplay remains readable under time pressure.

12 / Questions for Claude to resolve before implementation

• Recommend the fastest technical path to a touch-friendly vertical slice (Godot vs a lightweight browser prototype), with trade-offs and a clear recommendation.
• Propose the exact dependency graph and task durations for the three burger shots.
• Define crew auto-selection and player override rules precisely, including how to avoid idle loops and deadlocks.
• Sketch a portrait HUD layout and input model.
• Identify the smallest set of placeholder assets needed, then build the simulation before art polish.

Suggested first prompt to Claude

“Read this handoff and act as the lead gameplay engineer. First propose a minimal technical architecture, a concrete task dependency graph for The Burger Job, and a 3–4 milestone build plan. Flag any ambiguity or scope risks. Do not start with art polish or a studio-builder. After we approve the plan, implement milestone 1 as a runnable prototype.”