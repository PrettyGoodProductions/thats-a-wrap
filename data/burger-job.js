/*
  THE BURGER JOB level data.
  Edit freely: durations are in game seconds, money in dollars, every number is a tuning value.

  Two clocks: the shoot plays in about two minutes of real time, which stands for a 10-hour
  production day (8:00 AM call, 6:00 PM wrap). Day rates and overtime use that fictional day.

  Task fields
    id        unique id, "shot.task"
    dept      grip | lighting | camera | art  (who does it at full speed)
    label     shown to the player
    dur       seconds of work for one full-speed crew member
    needs     task ids in the same shot that must be done first
    stage     true = happens on the tabletop stage, so only the shot holding the stage can do it
    optional  true = ACTION is allowed without it, at a quality cost of `weight` points
    rig       true = rigging work (the rigging specialty speeds it up)
    perishable/freshFor/redoDur
              goes bad freshFor seconds after it's done (until the shot is captured),
              then needs redoDur seconds of work again

  Crew fields (hiring candidates), stats run 0 to 1 except speed (1 = normal)
    rate         day rate for the 10-hour day. Overtime is 1.5x after 10 hours, 2x after 12
    speed        work speed
    skill        shot quality. A weak crew costs up to 25 quality points; a retake wins back half
    org          organization: pause between tasks and walking pace
    reliability  chance a finished task is right the first time (a miss means a short recovery and half a redo)
    leadership   DPs only: cuts handoff delays and mistakes for the whole crew
    specialty    quickRoll (rolls in 3s), spareBulb (fixes dead lights fast), foodWhisperer (food stays fresh longer),
                 macro (+8 quality on macro shots), rigging (rig work 40% faster), cheese (melts cheese 40% faster)
    network      yours | fof (friend of a friend) | board (crew job board)
    booked       on another job, can't be hired
*/
(function (root) {
  const burgerJob = {
    id: 'burger-job',
    title: 'The Burger Job',
    client: 'Big Bun Burgers',
    brief: 'Three tabletop shots for a 15-second spot. Client note: "Make it pop."',
    budget: 28000,         // what the client pays. Crew, gear, prep, rentals and overtime come out of it. The rest is profit
    timeLimit: 120,        // game seconds in a 10-hour day (call to wrap)
    hardStop: 168,         // 14 hours: the client pulls the plug
    dayStart: 8 * 60,      // call time, minutes after midnight
    dayHours: 10,          // hours in the day before overtime
    qualityTarget: 90,     // average quality needed for the third star
    actionDuration: 5,     // seconds of rolling after ACTION
    retakeReset: 3,        // seconds to reset the set before a retake
    crossDeptRate: 0.5,    // speed when someone works outside their department
    costs: { gear: 4500, prep: 2000 },

    // Physical layout: where work happens, where idle crew wait, how fast people walk (units per second)
    walkSpeed: 120,
    handoff: 3,            // seconds lost when one department hands work to another, before leadership and chemistry
    stations: {
      table:  { x: 184, y: 216, label: 'the table' },
      light:  { x: 104, y: 210, label: 'the key light' },
      camera: { x: 330, y: 214, label: 'the camera' },
      cart:   { x: 50,  y: 228, label: 'the art cart' },
    },
    idle: {
      grip:     { x: 136, y: 328 },
      lighting: { x: 28,  y: 330 },
      camera:   { x: 178, y: 332 },
      art:      { x: 80,  y: 334 },
    },

    // Default crew for tests and quick starts
    crew: [
      { id: 'dp',     name: 'Mika', role: 'DP',     dept: 'camera' },
      { id: 'gaffer', name: 'Ro',   role: 'Gaffer', dept: 'lighting' },
      { id: 'grip',   name: 'Dani', role: 'Grip',   dept: 'grip' },
      { id: 'art',    name: 'Lu',   role: 'Art',    dept: 'art' },
    ],

    // Pairs who work well together (handoffs between them are instant, +8% speed) or clash (handoffs take 50% longer)
    chemistry: [
      { a: 'mika', b: 'ro',  kind: 'good', note: 'shot three spots together' },
      { a: 'ines', b: 'max', kind: 'good', note: 'old friends from features' },
      { a: 'paz',  b: 'mika', kind: 'good', note: 'Mika brought her up' },
      { a: 'dani', b: 'ro',  kind: 'good', note: 'carpool buddies' },
      { a: 'lee',  b: 'max', kind: 'clash', note: 'Max has opinions about Lee' },
      { a: 'sam',  b: 'chuy', kind: 'clash', note: 'still arguing about a sandbag' },
    ],

    hiring: [
      {
        dept: 'camera', role: 'DP',
        candidates: [
          { id: 'ines', name: 'Inés', tier: 'Veteran', rate: 5800, speed: 1.2, skill: 0.96, org: 0.95, reliability: 0.97, leadership: 0.95, specialty: 'macro', network: 'yours',
            blurb: 'Runs a calm set. Shot two Super Bowl spots.', look: { skin: '#B9805A', hair: '#1E1A17', top: 'beret', glasses: true } },
          { id: 'mika', name: 'Mika', tier: 'Solid', rate: 3800, speed: 1.0, skill: 0.82, org: 0.75, reliability: 0.9, leadership: 0.55, specialty: 'quickRoll', network: 'yours',
            blurb: 'Shot your last three spots. Gets it in one.', look: { skin: '#E1B48E', hair: '#3A2A1E', top: 'beanie' } },
          { id: 'sam', name: 'Sam', tier: 'Newbie', rate: 2000, speed: 0.85, skill: 0.6, org: 0.4, reliability: 0.75, leadership: 0.15, network: 'yours',
            blurb: 'Hungry. Owns a lot of lenses, knows some of them.', look: { skin: '#F0C9A6', hair: '#C9852E', top: 'none', glasses: true } },
        ],
      },
      {
        dept: 'lighting', role: 'Gaffer',
        candidates: [
          { id: 'bo', name: 'Bo', tier: 'Veteran', rate: 5000, speed: 1.25, skill: 0.95, org: 0.9, reliability: 0.97, specialty: 'spareBulb', network: 'yours', booked: true,
            blurb: 'Carries a spare everything.', look: { skin: '#8A5A3C', hair: '#111', top: 'cap', beard: true } },
          { id: 'ro', name: 'Ro', tier: 'Solid', rate: 3400, speed: 1.0, skill: 0.82, org: 0.75, reliability: 0.9, specialty: 'spareBulb', network: 'yours',
            blurb: 'Keeps a spare bulb in the truck.', look: { skin: '#D9A07A', hair: '#2B2016', top: 'cap', beard: true } },
          { id: 'lee', name: 'Lee', tier: 'Newbie', rate: 1700, speed: 0.8, skill: 0.6, org: 0.45, reliability: 0.72, network: 'yours',
            blurb: 'Just bought a light meter. Very excited about it.', look: { skin: '#F2D0B0', hair: '#6B4A2E', top: 'none' } },
        ],
      },
      {
        dept: 'grip', role: 'Grip',
        candidates: [
          { id: 'max', name: 'Max', tier: 'Veteran', rate: 4200, speed: 1.25, skill: 0.94, org: 0.9, reliability: 0.97, specialty: 'rigging', network: 'yours',
            blurb: 'Can rig a burger to a ceiling fan.', look: { skin: '#C48B63', hair: '#4A3020', top: 'cap', beard: true } },
          { id: 'dani', name: 'Dani', tier: 'Solid', rate: 2900, speed: 1.0, skill: 0.8, org: 0.8, reliability: 0.9, network: 'yours',
            blurb: 'Fast, tidy, brings snacks.', look: { skin: '#E4B892', hair: '#5A3A22', top: 'cap', mustache: true } },
          { id: 'chuy', name: 'Chuy', tier: 'Newbie', rate: 1500, speed: 0.85, skill: 0.6, org: 0.4, reliability: 0.75, network: 'yours',
            blurb: 'Strong. Enthusiastic. Sandbags are a mystery.', look: { skin: '#B07A52', hair: '#1A1410', top: 'beanie' } },
        ],
      },
      {
        dept: 'art', role: 'Art',
        dryNote: 'Vera and Lu are both on other jobs this week. Your art network is dry.',
        candidates: [
          { id: 'vera', name: 'Vera', tier: 'Veteran', rate: 4600, speed: 1.25, skill: 0.97, org: 0.9, reliability: 0.98, specialty: 'foodWhisperer', network: 'yours', booked: true,
            blurb: 'Food stylist for every burger chain you know.', look: { skin: '#D7A27C', hair: '#2A1C14', top: 'bun', earring: true } },
          { id: 'lu', name: 'Lu', tier: 'Solid', rate: 3000, speed: 1.0, skill: 0.84, org: 0.8, reliability: 0.9, network: 'yours', booked: true,
            blurb: 'Reliable. Brings her own tweezers.', look: { skin: '#EAC3A0', hair: '#1E1612', top: 'bun', earring: true } },
          { id: 'paz', name: 'Paz', tier: 'Vouched', rate: 3600, speed: 1.1, skill: 0.9, org: 0.8, reliability: 0.94, specialty: 'foodWhisperer', network: 'fof', via: 'Mika',
            blurb: '"She saved my yogurt shoot." (Mika)', look: { skin: '#C99070', hair: '#7A2E1E', top: 'bun', earring: true } },
          { id: 'theo', name: 'Theo', tier: 'Vouched', rate: 2400, speed: 0.9, skill: 0.72, org: 0.6, reliability: 0.85, network: 'fof', via: 'Ro',
            blurb: '"My roommate. He\'s fine. Probably." (Ro)', look: { skin: '#F1CDA9', hair: '#B98A4A', top: 'beanie', glasses: true } },
          { id: 'kit', name: 'Kit', tier: 'Unknown', rate: 1400, speed: 0.75, skill: 0.5, org: 0.3, reliability: 0.7, network: 'board',
            blurb: '"Food stylist / DJ / available now."', look: { skin: '#E8B993', hair: '#2E7D6B', top: 'none', earring: true } },
          { id: 'jules', name: 'Jules', tier: 'Unknown', rate: 1800, speed: 1.15, skill: 0.85, org: 0.7, reliability: 0.88, specialty: 'cheese', network: 'board',
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
          { id: 'rent',   kind: 'wait',    label: 'Rent a backup', cost: 1000, secs: 6, waitText: 'Backup light on the way' },
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
        macro: true,
        tasks: [
          { id: 'cheese.rig',   dept: 'grip',     label: 'Rig the pull',   dur: 10, stage: true, rig: true },
          { id: 'cheese.melt',  dept: 'art',      label: 'Melt cheese',    dur: 14, perishable: true, freshFor: 25, redoDur: 6 },
          { id: 'cheese.light', dept: 'lighting', label: 'Re-aim lights',  dur: 8,  stage: true, needs: ['cheese.rig'], optional: true, weight: 25 },
          { id: 'cheese.frame', dept: 'camera',   label: 'Frame macro',    dur: 7,  stage: true, needs: ['cheese.rig', 'cheese.melt'] },
        ],
      },
      {
        id: 'sauce',
        name: 'Sauce Pour',
        macro: true,
        tasks: [
          { id: 'sauce.mount', dept: 'grip',     label: 'Mount bottle',   dur: 10, stage: true, rig: true },
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
  //   gearPackage  your own gear: the rental package costs this instead
  //   post       quality points added to every shot ("we'll fix it in post")
  const company = {
    name: 'Pretty Good Productions',
    rooms: [
      { id: 'craft',   name: 'Craft Services', cost: 3000, effect: { speed: 1.08 },
        blurb: 'Coffee, donuts, a sad fruit plate. Everyone works 8% faster.' },
      { id: 'kitchen', name: 'Prep Kitchen',   cost: 4500, effect: { fresh: 1.4, artSpeed: 1.15 },
        blurb: 'A real stove. Food stays fresh 40% longer and art works 15% faster.' },
      { id: 'gear',    name: 'Gear Cage',      cost: 6000, effect: { backupLight: true, gearPackage: 1500 },
        blurb: 'Your own lights and stands. The gear package drops from $4,500 to $1,500, and a dead light is a free 2-second swap.' },
      { id: 'edit',    name: 'Edit Bay',       cost: 8000, effect: { post: 10 },
        blurb: '"We\'ll fix it in post." Every shot gets +10 quality.' },
    ],
    jobs: [
      { id: 'burger-job', title: 'The Burger Job', client: 'Big Bun Burgers', kind: 'Tabletop', playable: true },
      { id: 'taco-truck', title: 'Taco Truck Takeover', client: 'El Gordo Tacos', kind: 'Location', playable: false, note: 'Production Week arrives in 0.3' },
    ],
  };

  const LEVELS = { burgerJob, company };
  if (typeof module === 'object' && module.exports) module.exports = LEVELS;
  else root.LEVELS = LEVELS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
