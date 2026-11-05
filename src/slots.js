/*
  Slot table: where each piece of delivered art attaches to the game.

  A slot is one manifest ID (docs/project/Asset-Manifest.md). Art files and their settings are looked up by ID,
  so swapping art never touches code. This table is the only code-side wiring, and it is written once per piece,
  when that piece's placeholder gets wrapped in WrapLoader.slot() in art.js.

    anchor   where the piece's pivot lands, in the parent's coordinates (set units on the set, puppet units on a puppet)
    pivot    default pivot when the settings file gives none: a name like 'bottom-center', or [x, y] in image pixels
    size     manifest size in set units, [width, height]. Used only to warn when a delivered file looks mis-scaled
    shadow   true adds the soft paper drop shadow. Leave false when the parent group already has the "cut" filter
    initial  state shown before the simulation says otherwise
    states   states the game asks for. Other states in the folder still load, nothing asks for them yet

  File names: <id>.<state>@3x.png, for example elec.keylight-head.on@3x.png. A piece with one look has no state:
  grip.platform@3x.png. Settings for a piece live in <id>.json next to the images (see art/README.md).
*/
(function (root) {
  'use strict';

  // Puppet joints, in puppet units: feet at 0,0, facing right, about 48 tall. Parts attach here at their own pivot.
  const RIG = {
    hips: { x: 0, y: -13 },
    neck: { x: 0, y: -26.5 },
    headCenter: { x: 0, y: -35 },
    hairLine: { x: 0, y: -37.5 },
    shoulderFront: { x: 7.5, y: -24.5 },
    shoulderBack: { x: -7.5, y: -24.5 },
    pelvis: { x: 0, y: -11 },
    hipFront: { x: 4, y: -13 },
    hipBack: { x: -4, y: -13 },
  };

  const SLOTS = {
    'grip.platform': { anchor: { x: 184, y: 192 }, pivot: 'bottom-center', size: [112, 60], shadow: true, initial: 'default' },
    'elec.keylight-head': { anchor: { x: 72, y: 76 }, pivot: 'center', size: [56, 34], shadow: false, initial: 'off', states: ['off', 'on', 'dead'] },
    // Burger stack on the art cart. Every layer shares the anchor and the layer's own pivot is its bottom center.
    // The engine stacks them with `stack` (set units above the anchor, per layer) unless settings give an offset.
    'art.burger-build': {
      anchor: { x: 30, y: 36 }, pivot: 'bottom-center', shadow: false,
      layers: ['bottom-bun', 'patty', 'cheese', 'lettuce', 'top-bun'],
      // Offsets come from the delivered hero burger (patty 7.5, cheese 10.5, lettuce 18.3, top bun 21.6 units up at its
      // 50 wide size), times 0.6 because the cart stack is drawn at 0.6 of the hero (batch 3, tools/make_batch3_map.py)
      stack: { 'bottom-bun': 0, patty: -4.5, cheese: -6.3, lettuce: -11, 'top-bun': -13 },
    },

    // Grip: the sweep hangs from its tube and unrolls (the game scales it down the page), tinted per shot
    'grip.sweep': { anchor: { x: 180, y: 30 }, pivot: 'top-center', size: [108, 108], shadow: false, initial: 'default' },
    'grip.sweep-tube': { anchor: { x: 180, y: 28 }, pivot: 'center', size: [118, 8], shadow: true, initial: 'default' },
    // Electric: stand and fill light (the key head is its own piece above). Parents carry the soft shadow.
    'elec.keylight-stand': { anchor: { x: 72, y: 202 }, pivot: 'bottom-center', size: [30, 126], shadow: false, initial: 'default' },
    'elec.fill': { anchor: { x: 240, y: 206 }, pivot: 'bottom-center', size: [30, 110], shadow: false, initial: 'default' },
    // Camera: track, body without lens, the lens in two lengths, and the red framing corners
    // Set dressing (batch 4). Flats stand on their bottom center. Pivots come from the settings files, read off the art.
    'set.flat-1': { anchor: { x: 33, y: 152 }, pivot: 'bottom-center', size: [82, 204], shadow: false, initial: 'default' },
    'set.flat-2': { anchor: { x: 97, y: 152 }, pivot: 'bottom-center', size: [74, 183], shadow: false, initial: 'default' },
    'set.flat-3': { anchor: { x: 180, y: 40 }, pivot: 'bottom-center', size: [72, 84], shadow: false, initial: 'default' },
    'set.flat-4': { anchor: { x: 264, y: 152 }, pivot: 'bottom-center', size: [72, 186], shadow: false, initial: 'default' },
    'set.flat-5': { anchor: { x: 328, y: 152 }, pivot: 'bottom-center', size: [76, 208], shadow: false, initial: 'default' },
    'set.flat-6': { anchor: { x: -198, y: 154 }, pivot: 'bottom-center', size: [104, 196], shadow: false, initial: 'default' },
    'set.flat-7': { anchor: { x: -116, y: 154 }, pivot: 'bottom-center', size: [88, 174], shadow: false, initial: 'default' },
    'set.flat-8': { anchor: { x: -46, y: 153 }, pivot: 'bottom-center', size: [80, 203], shadow: false, initial: 'default' },
    'set.flat-9': { anchor: { x: 393, y: 146 }, pivot: 'bottom-center', size: [78, 196], shadow: false, initial: 'default' },
    'set.flat-10': { anchor: { x: 460, y: 145 }, pivot: 'bottom-center', size: [84, 173], shadow: false, initial: 'default' },
    'set.flat-11': { anchor: { x: 545, y: 144 }, pivot: 'bottom-center', size: [110, 200], shadow: false, initial: 'default' },
    'set.call-sheet': { anchor: { x: 436, y: 0 }, pivot: 'top-left', size: [52, 36], shadow: false, initial: 'default' },
    'set.poster': { anchor: { x: 18, y: 16 }, pivot: 'top-left', size: [44, 34], shadow: false, initial: 'default' },
    // Two colors of practical lamp, each with off and on. They hang from the top of the cord. The set shows them lit.
    'set.practical-red': { anchor: { x: 58, y: -54 }, pivot: 'top-center', size: [24, 40], shadow: false, initial: 'on', states: ['off', 'on'] },
    'set.practical-sage': { anchor: { x: 306, y: -54 }, pivot: 'top-center', size: [24, 40], shadow: false, initial: 'on', states: ['off', 'on'] },
    'set.overhead-flag': { anchor: { x: 192, y: -54 }, pivot: 'top-center', size: [44, 34], shadow: false, initial: 'default' },
    'set.plant-1': { anchor: { x: 22, y: 152 }, pivot: 'bottom-center', size: [40, 70], shadow: false, initial: 'default' },
    'set.plant-2': { anchor: { x: 331, y: 152 }, pivot: 'bottom-center', size: [34, 56], shadow: false, initial: 'default' },
    'set.cable': { anchor: { x: 74, y: 198 }, pivot: 'left-center', size: [230, 80], shadow: false, initial: 'default' },
    // Tiles and scattered pieces are drawn straight from art.js (patterns, several copies), the anchor is their default
    'set.wall': { anchor: { x: 0, y: 0 }, pivot: 'top-left', size: [200, 200], shadow: false, initial: 'default' },
    'set.floor': { anchor: { x: 0, y: 0 }, pivot: 'top-left', size: [200, 200], shadow: false, initial: 'default' },
    'set.grid': { anchor: { x: 0, y: -46 }, pivot: 'left-center', size: [200, 24], shadow: false, initial: 'default' },
    'set.floor-scuffs': { anchor: { x: 60, y: 262 }, pivot: 'center', size: [120, 30], shadow: false, initial: 'default' },
    'set.tape-mark': { anchor: { x: 181, y: 233 }, pivot: 'center', size: [10, 6], shadow: false, initial: 'default' },
    // HUD pieces drawn inside SVG (stars, pause bars, shot status), in CSS pixels
    // HUD nine-slices (batch 4), drawn by CSS border-image. The slice insets and CSS widths live in each piece's settings file
    'ui.panel': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default' },
    'ui.chip-dark': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default' },
    'ui.tag': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default' },
    'ui.crew-card': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default', states: ['default', 'camera', 'lighting', 'art', 'grip'] },
    'ui.button-paper': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default' },
    'ui.polaroid': { anchor: { x: 0, y: 0 }, pivot: 'top-left', shadow: false, initial: 'default' },
    'ui.star': { anchor: { x: 0, y: 0 }, pivot: 'center', size: [32, 32], shadow: false, initial: 'on', states: ['on', 'off'] },
    'ui.icon-pause': { anchor: { x: 0, y: 0 }, pivot: 'center', size: [24, 26], shadow: false, initial: 'default' },
    'ui.shot-status': { anchor: { x: 0, y: 0 }, pivot: 'center', size: [22, 22], shadow: false, initial: 'done', states: ['done', 'pending'] },

    // Batch 5 (Nov 5): the pieces the manifest marked Ready. Positions are the manifest's. Pivots come from the settings files.
    // Grip: flag on its C-stand (the tripod is wider than the manifest's 26: fitted by height), gear pile, and the rig.
    'grip.flag': { anchor: { x: 262, y: 202 }, pivot: 'bottom-center', size: [38, 140], shadow: false, initial: 'default' },
    'grip.gear-pile': { anchor: { x: 246, y: 202 }, pivot: 'bottom-left', size: [46, 30], shadow: false, initial: 'default' },
    // The pole is fitted so its clamp lands on (292, 58), where the arm, fork and bottle hang. That makes it 162 tall, not 150
    'grip.rig-pole': { anchor: { x: 292, y: 202 }, pivot: 'bottom-center', size: [46, 162], shadow: false, initial: 'default' },
    'grip.rig-arm': { anchor: { x: 292, y: 58 }, pivot: 'center', size: [100, 10], shadow: false, initial: 'default' },
    'grip.rig-fork': { anchor: { x: 197, y: 58 }, pivot: 'top-center', size: [8, 30], shadow: false, initial: 'default' },
    'grip.rig-bottle': { anchor: { x: 197, y: 58 }, pivot: 'center', size: [14, 32], shadow: false, initial: 'default' },
    // Electric: the beams are wedges the engine turns and stretches from the light face to the burger (the anchor is moved by a transform)
    'elec.beam': { anchor: { x: 0, y: 0 }, pivot: 'center-left', size: [150, 60], shadow: false, initial: 'default' },
    'elec.fill-beam': { anchor: { x: 0, y: 0 }, pivot: 'center-left', size: [50, 30], shadow: false, initial: 'default' },
    'elec.backlight': { anchor: { x: 214, y: -54 }, pivot: 'top-center', size: [20, 60], shadow: false, initial: 'default' },
    'elec.dead-fx': { anchor: { x: 72, y: 52 }, pivot: 'center', size: [60, 40], shadow: false, initial: 'default' },
    // Art department: styling cart, sauce bowl (the sauce is its own layer that fades in), sparkle (two frames, flipped by CSS)
    'art.table': { anchor: { x: 10, y: 212 }, pivot: 'bottom-left', size: [72, 40], shadow: false, initial: 'default' },
    'art.sauce-bowl': { anchor: { x: 70, y: 173 }, pivot: 'bottom-center', size: [16, 10], shadow: false, initial: 'empty', states: ['empty', 'fill'] },
    'fx.sparkle': { anchor: { x: 180, y: 110 }, pivot: 'center', size: [80, 40], shadow: false, initial: '01', states: ['01', '02'] },
    // Video village and the craft table. The coffee cup is the Agency's latte for now
    'village.monitor': { anchor: { x: 224, y: 334 }, pivot: 'bottom-center', size: [60, 98], shadow: false, initial: 'default' },
    'village.chair': { anchor: { x: 286, y: 340 }, pivot: 'bottom-center', size: [36, 44], shadow: false, initial: 'default' },
    'crafty.table': { anchor: { x: 14, y: 258 }, pivot: 'top-left', size: [150, 60], shadow: false, initial: 'default' },
    'crafty.coffee': { anchor: { x: 0, y: 0 }, pivot: 'bottom-center', size: [5, 7], shadow: false, initial: 'default' },
    // HQ (drawn in the office's 360 x 470 frame). The Edit Bay's anchor is the room's own corner. hq.shell is parked: its openings do not match the rooms
    'hq.sign': { anchor: { x: 180, y: 23 }, pivot: 'center', size: [220, 34], shadow: false, initial: 'on', states: ['off', 'on'] },
    'hq.room.edit': { anchor: { x: 0, y: 0 }, pivot: 'top-left', size: [152, 112], shadow: false, initial: 'for-rent', states: ['for-rent', 'building', 'built'] },

    'cam.track': { anchor: { x: 232, y: 212 }, pivot: 'top-left', size: [126, 12], shadow: true, initial: 'default' },
    'cam.camera': { anchor: { x: 304, y: 210 }, pivot: 'bottom-center', size: [54, 90], shadow: false, initial: 'default' },
    'cam.lens': { anchor: { x: 289, y: 138 }, pivot: 'center', size: [19, 14], shadow: false, initial: 'standard', states: ['standard', 'macro'] },
    'cam.frame-marks': { anchor: { x: 180, y: 112 }, pivot: 'center', size: [70, 56], shadow: false, initial: 'default' },
    // Props. Anchors are in the group the prop is drawn in (the hero prop box, burger base center at 30,36; the pot group)
    // and are the defaults for use(): art.js places the parts of a prop itself.
    'prop.burger': { anchor: { x: 30, y: 36 }, pivot: 'bottom-center', size: [50, 36], shadow: false, initial: 'default' },
    'prop.cheese': { anchor: { x: 30, y: 36 }, pivot: 'bottom-center', shadow: false, initial: 'base', states: ['base', 'top-bun', 'strand-01', 'strand-02', 'strand-03'] },
    'prop.sauce': { anchor: { x: 30, y: 0 }, pivot: 'top-center', shadow: false, initial: 'drip', states: ['drip', 'stream'] },
    'art.cheese-pot': { anchor: { x: 8, y: 15 }, pivot: 'bottom-center', size: [18, 16], shadow: false, initial: 'empty', states: ['empty', 'fill', 'steam-1'] },

    // Modular crew puppet. Required parts first, then optional ones.
    'crew.head': { anchor: RIG.neck, pivot: 'bottom-center', size: [17, 17], tint: 'skin', shadow: false, initial: 'default' },
    'crew.torso': { anchor: RIG.hips, pivot: 'bottom-center', size: [20, 13], tint: 'dept', shadow: false, initial: 'default' },
    'crew.arm-front': { anchor: RIG.shoulderFront, pivot: 'top-center', size: [4.5, 13], shadow: false, initial: 'default' },
    'crew.arm-back': { anchor: RIG.shoulderBack, pivot: 'top-center', size: [4.5, 13], shadow: false, initial: 'default' },
    'crew.leg-front': { anchor: RIG.hipFront, pivot: 'top-center', size: [5, 13], shadow: false, initial: 'default' },
    'crew.leg-back': { anchor: RIG.hipBack, pivot: 'top-center', size: [5, 13], shadow: false, initial: 'default' },
    // Hair and hats: the state is the look name (cap, beanie, bun, beret, slick, default)
    'crew.hair': { anchor: RIG.hairLine, pivot: 'bottom-center', shadow: false, initial: 'default', variants: true },
    // Face extras: eyes, nose, beard, mustache, glasses, earring. Each is its own image, laid over the head
    'crew.face': { anchor: RIG.headCenter, pivot: 'center', shadow: false, initial: 'default', variants: true },
  };

  // The real puppet is used only when all of these have art. A part missing from this list is simply left out.
  const PUPPET = {
    required: ['crew.head', 'crew.torso', 'crew.arm-front', 'crew.leg-front', 'crew.leg-back'],
    // Parts that change with the crew member's pose (idle, work, later walk and the reactions)
    posed: ['crew.leg-back', 'crew.leg-front', 'crew.arm-back', 'crew.torso', 'crew.head', 'crew.arm-front'],
    faceOrder: ['beard', 'eyes', 'nose', 'mustache', 'glasses', 'earring'],
  };

  /*
    Fixed characters: individually designed puppets (own head, outfit and skin) delivered as crew.<character>.<part>,
    for example crew.ro.head@8x.png. They are never tinted and get no face overlays, because the art is the
    whole character. They share one animation rig (walk, work and later reactions move the same named
    joints), so a new character needs art and one line here, not new animation code.
    The character's proportions live in art/crew.<character>.json: scale, joints (where each part attaches, in
    puppet units, feet at 0,0) and portrait (the head crop for the hire cards).
  */
  const CHARACTERS = {
    ro: { name: 'Ro' },
    mika: { name: 'Mika' },
    dani: { name: 'Dani' },
    lu: { name: 'Lu' },
  };
  // One entry per part of the shared rig: the joint it hangs from and its default pivot inside the image
  const ROLES = {
    head: { joint: 'neck', pivot: 'bottom-center', size: [17, 21] },
    torso: { joint: 'hips', pivot: 'bottom-center', size: [14, 15] },
    'arm-front': { joint: 'shoulderFront', pivot: 'top-center', size: [8, 17] },
    'arm-back': { joint: 'shoulderBack', pivot: 'top-center', size: [8, 17] },
    'leg-front': { joint: 'hipFront', pivot: 'top-center', size: [11, 24] },
    'leg-back': { joint: 'hipBack', pivot: 'top-center', size: [11, 24] },
    // Optional: shorts that cover the tops of the legs, so the legs hinge inside the pelvis instead of under the shirt
    pelvis: { joint: 'pelvis', pivot: 'center', size: [15, 9] },
  };
  // Back to front. The upper body (everything but the legs) leans as one when the character works.
  const RIG_ORDER = { legs: ['leg-back', 'leg-front', 'pelvis'], upper: ['arm-back', 'torso', 'head', 'arm-front'] };
  const CHARACTER_REQUIRED = ['head', 'torso', 'arm-front', 'leg-front', 'leg-back'];

  const api = { SLOTS, RIG, PUPPET, CHARACTERS, ROLES, RIG_ORDER, CHARACTER_REQUIRED };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapSlots = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
