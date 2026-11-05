/*
  THE BURGER JOB level data.
  Edit freely: durations are in seconds, money in dollars, every number is a tuning value.

  Task fields
    id        unique id, "shot.task"
    dept      grip | lighting | camera | art  (who does it at full speed)
    label     shown to the player
    dur       seconds of work for one full-speed crew member
    needs     task ids in the same shot that must be done first
    stage     true = happens on the tabletop stage, so only the shot holding the stage can do it
    optional  true = ACTION is allowed without it, at a quality cost of `weight` points
    perishable/freshFor/redoDur
              goes bad freshFor seconds after it's done (until the shot is captured),
              then needs redoDur seconds of work again

  Crew fields (hiring candidates)
    rate         day rate, paid from the budget when hired
    speed        work speed, 1 = normal
    reliability  chance a finished task is right the first time (a miss means half of it is redone, once per task)
    perks        quickRoll (DP: ACTION rolls in 3s), spareBulb (Gaffer: fixes a dead light fast),
                 foodWhisperer (Art: perishables stay fresh 60% longer)
    network      yours | fof (friend of a friend) | board (crew job board)
    booked       on another job, can't be hired
*/
(function (root) {
  const burgerJob = {
    id: 'burger-job',
    title: 'The Burger Job',
    client: 'Big Bun Burgers',
    brief: 'Three tabletop shots for a 15-second spot. Client note: "Make it pop."',
    budget: 7000,          // everything comes out of this: crew, rentals, overtime. What's left is your profit
    timeLimit: 120,        // seconds before overtime starts
    overtimeRate: 150,     // dollars per second past the time limit
    hardStop: 200,         // the client pulls the plug here
    qualityTarget: 90,     // average quality needed for the third star
    actionDuration: 5,     // seconds of rolling after ACTION
    departmentsOnly: true, // each crew member only works their own department's tasks (art does art, camera does camera)
    crossDeptRate: 0.5,    // speed outside their department, for levels that allow it (departmentsOnly: false)

    // Default crew for tests and quick starts (the "solid" hire in every role)
    crew: [
      { id: 'dp',     name: 'Mika', role: 'DP',     dept: 'camera' },
      { id: 'gaffer', name: 'Ro',   role: 'Gaffer', dept: 'lighting' },
      { id: 'grip',   name: 'Dani', role: 'Grip',   dept: 'grip' },
      { id: 'art',    name: 'Lu',   role: 'Art',    dept: 'art' },
    ],

    hiring: [
      {
        dept: 'camera', role: 'DP',
        candidates: [
          { id: 'ines',  name: 'Inés', tier: 'Veteran', rate: 2600, speed: 1.3, reliability: 0.98, perks: ['quickRoll'], network: 'yours',
            blurb: 'Shot two Super Bowl spots. Gets it in one.', look: { skin: '#B9805A', hair: '#1E1A17', top: 'beret', glasses: true } },
          { id: 'mika',  name: 'Mika', tier: 'Solid',   rate: 1700, speed: 1.0, reliability: 0.9, network: 'yours',
            blurb: 'Shot your last three spots. No surprises.', look: { skin: '#E1B48E', hair: '#3A2A1E', top: 'beanie' } },
          { id: 'sam',   name: 'Sam',  tier: 'Newbie',  rate: 950,  speed: 0.8, reliability: 0.75, network: 'yours',
            blurb: 'Hungry. Owns a lot of lenses, knows some of them.', look: { skin: '#F0C9A6', hair: '#C9852E', top: 'none', glasses: true } },
        ],
      },
      {
        dept: 'lighting', role: 'Gaffer',
        candidates: [
          { id: 'bo',    name: 'Bo',   tier: 'Veteran', rate: 2200, speed: 1.3, reliability: 0.97, perks: ['spareBulb'], network: 'yours', booked: true,
            blurb: 'Carries a spare everything.', look: { skin: '#8A5A3C', hair: '#111', top: 'cap', beard: true } },
          { id: 'ro',    name: 'Ro',   tier: 'Solid',   rate: 1500, speed: 1.0, reliability: 0.9, perks: ['spareBulb'], network: 'yours',
            blurb: 'Keeps a spare bulb in the truck. Usually.', look: { skin: '#D9A07A', hair: '#2B2016', top: 'cap', beard: true } },
          { id: 'lee',   name: 'Lee',  tier: 'Newbie',  rate: 800,  speed: 0.75, reliability: 0.72, network: 'yours',
            blurb: 'Just bought a light meter. Very excited about it.', look: { skin: '#F2D0B0', hair: '#6B4A2E', top: 'none' } },
        ],
      },
      {
        dept: 'grip', role: 'Grip',
        candidates: [
          { id: 'max',   name: 'Max',  tier: 'Veteran', rate: 1900, speed: 1.3, reliability: 0.97, network: 'yours',
            blurb: 'Can rig a burger to a ceiling fan.', look: { skin: '#C48B63', hair: '#4A3020', top: 'cap', beard: true } },
          { id: 'dani',  name: 'Dani', tier: 'Solid',   rate: 1300, speed: 1.0, reliability: 0.9, network: 'yours',
            blurb: 'Fast, tidy, brings snacks.', look: { skin: '#E4B892', hair: '#5A3A22', top: 'cap', mustache: true } },
          { id: 'chuy',  name: 'Chuy', tier: 'Newbie',  rate: 700,  speed: 0.8, reliability: 0.75, network: 'yours',
            blurb: 'Strong. Enthusiastic. Sandbags are a mystery.', look: { skin: '#B07A52', hair: '#1A1410', top: 'beanie' } },
        ],
      },
      {
        dept: 'art', role: 'Art',
        dryNote: 'Vera is on another job this week.',
        candidates: [
          { id: 'vera',  name: 'Vera', tier: 'Veteran', rate: 2000, speed: 1.3, reliability: 0.98, perks: ['foodWhisperer'], network: 'yours', booked: true,
            blurb: 'Food stylist for every burger chain you know.', look: { skin: '#D7A27C', hair: '#2A1C14', top: 'bun', earring: true } },
          { id: 'lu',    name: 'Lu',   tier: 'Solid',   rate: 1300, speed: 1.0, reliability: 0.9, network: 'yours',
            blurb: 'Reliable. Brings her own tweezers.', look: { skin: '#EAC3A0', hair: '#1E1612', top: 'bun', earring: true } },
          { id: 'paz',   name: 'Paz',  tier: 'Vouched', rate: 1600, speed: 1.1, reliability: 0.94, perks: ['foodWhisperer'], network: 'fof', via: 'Mika',
            blurb: '"She saved my yogurt shoot." (Mika)', look: { skin: '#C99070', hair: '#7A2E1E', top: 'bun', earring: true } },
          { id: 'theo',  name: 'Theo', tier: 'Vouched', rate: 1100, speed: 0.9, reliability: 0.85, network: 'fof', via: 'Ro', booked: true,
            blurb: '"My roommate. He\'s fine. Probably." (Ro)', look: { skin: '#F1CDA9', hair: '#B98A4A', top: 'beanie', glasses: true } },
          { id: 'kit',   name: 'Kit',  tier: 'Unknown', rate: 650,  speed: 0.7, reliability: 0.7, network: 'board',
            blurb: '"Food stylist / DJ / available now."', look: { skin: '#E8B993', hair: '#2E7D6B', top: 'none', earring: true } },
          { id: 'jules', name: 'Jules', tier: 'Unknown', rate: 800, speed: 1.2, reliability: 0.9, network: 'board',
            blurb: '"Just moved here from Chicago. Did a lot of pizza."', look: { skin: '#9C6644', hair: '#1A1310', top: 'cap', glasses: true } },
        ],
      },
    ],

    // Chaos: one scripted event
    events: [
      {
        id: 'keylight',
        trigger: { type: 'stageClaim', shot: 'cheese' },
        title: 'The key light just died!',
        blockText: 'Key light is dead',
        blocks: ['cheese.light', 'cheese.frame'],
        options: [
          { id: 'fix',    kind: 'task',    label: 'Fix it', dept: 'lighting', taskLabel: 'Fix key light', dur: 12, perk: 'spareBulb', perkDur: 5 },
          { id: 'rent',   kind: 'wait',    label: 'Rent a backup', cost: 400, secs: 6, waitText: 'Backup light on the way' },
          { id: 'bounce', kind: 'penalty', label: 'Bounce card and keep shooting', penalty: 30 },
        ],
      },
    ],

    shots: [
      {
        id: 'hero',
        name: 'Hero Burger',
        tasks: [
          { id: 'hero.set',   dept: 'grip',     label: 'Build tabletop',   dur: 14, stage: true },
          { id: 'hero.style', dept: 'art',      label: 'Style burger',     dur: 18 },
          { id: 'hero.place', dept: 'art',      label: 'Place burger',     dur: 4,  stage: true, needs: ['hero.set', 'hero.style'] },
          { id: 'hero.light', dept: 'lighting', label: 'Light the burger', dur: 14, stage: true, needs: ['hero.set'], optional: true, weight: 30 },
          { id: 'hero.frame', dept: 'camera',   label: 'Frame hero',       dur: 8,  stage: true, needs: ['hero.place'] },
        ],
      },
      {
        id: 'cheese',
        name: 'Cheese Pull',
        tasks: [
          { id: 'cheese.rig',   dept: 'grip',     label: 'Rig the pull',   dur: 10, stage: true },
          { id: 'cheese.melt',  dept: 'art',      label: 'Melt cheese',    dur: 14, perishable: true, freshFor: 25, redoDur: 6 },
          { id: 'cheese.light', dept: 'lighting', label: 'Re-aim lights',  dur: 8,  stage: true, needs: ['cheese.rig'], optional: true, weight: 25 },
          { id: 'cheese.frame', dept: 'camera',   label: 'Frame macro',    dur: 7,  stage: true, needs: ['cheese.rig', 'cheese.melt'] },
        ],
      },
      {
        id: 'sauce',
        name: 'Sauce Pour',
        tasks: [
          { id: 'sauce.mount', dept: 'grip',     label: 'Mount bottle',   dur: 10, stage: true },
          { id: 'sauce.prep',  dept: 'art',      label: 'Prep sauce',     dur: 10 },
          { id: 'sauce.light', dept: 'lighting', label: 'Add backlight',  dur: 10, stage: true, needs: ['sauce.mount'], optional: true, weight: 25 },
          { id: 'sauce.frame', dept: 'camera',   label: 'Frame pour',     dur: 8,  stage: true, needs: ['sauce.mount', 'sauce.prep'] },
        ],
      },
    ],
  };

  // Your production company: office rooms bought with profit. Each one changes shoot day.
  //   speed      all crew work faster (multiplier)
  //   artSpeed   art department works faster (multiplier)
  //   fresh      perishables last longer (multiplier)
  //   backupLight  a dead light becomes a free 2-second swap
  //   post       quality points added to every shot ("we'll fix it in post")
  const company = {
    name: 'Pretty Good Productions',
    // The office (HQ-Redesign, Nov 5): a two-story cutaway with four bays per floor. Rooms grow in levels. Each level
    // is an upgrade you buy with profit; its effect adds to the levels before it. Levels marked "soon" are shown but
    // cannot be bought yet, because the system they need is not in the game.
    rooms: [
      { id: 'office', name: 'Production Office', bay: { floor: 2, at: 1, span: 2 }, start: 1 },
      { id: 'edit',   name: 'Edit',              bay: { floor: 2, at: 3 } },
      { id: 'lobby',  name: 'Lobby',             bay: { floor: 1, at: 1 }, fixed: true },
      { id: 'art',    name: 'Art Dept',          bay: { floor: 1, at: 2 } },
      { id: 'gear',   name: 'Gear',              bay: { floor: 1, at: 3 } },
      { id: 'garage', name: 'Garage',            bay: { floor: 1, at: 4 }, fixed: true },
      { id: 'slot',   name: 'Coming soon',       bay: { floor: 2, at: 4 }, fixed: true, boarded: true },
    ],
    upgrades: [
      { id: 'office.2', room: 'office', level: 2, name: 'Coffee bar', cost: 800, effect: { speed: 1.08 },
        blurb: 'Coffee, donuts, a sad fruit plate. Everyone works 8% faster.' },
      { id: 'office.3', room: 'office', level: 3, name: 'Conference table', cost: 2500, soon: true,
        blurb: 'Bigger clients take meetings here. Better jobs on the board.' },
      { id: 'art.1', room: 'art', level: 1, name: 'Work table', cost: 600, effect: { artSpeed: 1.05 },
        blurb: 'A real table and shelves of supplies. Art works 5% faster.' },
      { id: 'art.2', room: 'art', level: 2, name: 'Prep kitchen', cost: 1200, effect: { fresh: 1.4, artSpeed: 1.1 },
        blurb: 'A stove and a fridge. Food stays fresh 40% longer and art works another 10% faster.' },
      { id: 'art.3', room: 'art', level: 3, name: 'Set shop', cost: 3000, soon: true,
        blurb: 'Miniatures and set builds. Unlocks bigger art jobs.' },
      { id: 'edit.1', room: 'edit', level: 1, name: 'Edit bay', cost: 2000, effect: { post: 10 },
        blurb: '"We\'ll fix it in post." Every shot gets +10 quality.' },
      { id: 'edit.2', room: 'edit', level: 2, name: 'Color suite', cost: 2500, effect: { post: 5 },
        blurb: 'A proper grade. Another +5 quality on every shot.' },
      { id: 'edit.3', room: 'edit', level: 3, name: 'Sound mix', cost: 3000, effect: { post: 5 },
        blurb: 'It sounds expensive now. Another +5 quality on every shot.' },
      { id: 'gear.1', room: 'gear', level: 1, name: 'Gear cage', cost: 1500, effect: { backupLight: true },
        blurb: 'Your own backup lights. A dead light becomes a free 2-second swap.' },
      { id: 'gear.2', room: 'gear', level: 2, name: 'More stands and lights', cost: 2000, soon: true,
        blurb: 'Fewer rentals, so rentals cost less.' },
      { id: 'gear.3', room: 'gear', level: 3, name: 'Grip truck', cost: 4000, soon: true,
        blurb: 'The truck replaces the van. Room for bigger jobs.' },
    ],
    // Saves from before the redesign named whole rooms: what each one became
    legacyRooms: { craft: ['office.2'], kitchen: ['art.1', 'art.2'], gear: ['gear.1'], edit: ['edit.1'] },
    jobs: [
      { id: 'burger-job', title: 'The Burger Job', client: 'Big Bun Burgers', kind: 'Tabletop', playable: true },
      { id: 'taco-truck', title: 'Taco Truck Takeover', client: 'El Gordo Tacos', kind: 'Location', playable: false, note: 'Location shoots coming soon' },
    ],
  };

  const LEVELS = { burgerJob, company };
  if (typeof module === 'object' && module.exports) module.exports = LEVELS;
  else root.LEVELS = LEVELS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
