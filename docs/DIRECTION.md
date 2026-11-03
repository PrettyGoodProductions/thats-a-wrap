# Gameplay direction (Nov 3, 2026)

**HQ is where you build the company. Shoot Day is where you run the chaos.**

## Production HQ: Last Shelter-inspired management and progression
A persistent, visually evolving production company: upgradable rooms, equipment, crew networks, job bookings and financial management. It should feel like a living bunker-builder environment, not a static menu.

## Shoot Day: Overcooked-inspired real-time task management
Much more hands-on and chaotic than the earlier Smart Crew spec. The player actively assigns and redirects crew by tapping characters and workstations. Crew carry out tasks once assigned, but do not finish the whole shoot without direction.

- Fast, intuitive tap-to-select and tap-to-assign controls
- Multiple crew working at once
- Frequent decisions about priorities and task order
- Crew go idle or get blocked unless redirected
- Physical crew movement around the set
- Time-sensitive props, dependencies and unexpected problems
- Cross-department help and multitasking
- A strong ACTION moment for each shot
- More complexity as the company grows

Target: a 3 to 5 minute shoot with a meaningful decision every few seconds. Busy, but not overwhelmed by the interface.

## Engineering notes
- Keep the existing autonomous crew logic. It may become an assist for experienced crew or an unlockable company upgrade.
- The rendering architecture must support frequent direct assignments, crew selection, movement, task queues and rapid interaction (Milestones B and C).
- Before implementing Milestone B, propose how the simulation moves to this more active gameplay.
