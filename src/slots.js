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
    contact  optional point other things rest on, in set units, for the placeholder (delivered art sets its own)
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
    hipFront: { x: 4, y: -13 },
    hipBack: { x: -4, y: -13 },
  };

  const SLOTS = {
    // contact: where props rest on the lid, in set units. Delivered art overrides it with "contact" in its settings
    'grip.platform': { anchor: { x: 184, y: 192 }, pivot: 'bottom-center', size: [112, 60], shadow: true, initial: 'default', contact: { x: 184, y: 136 } },
    'elec.keylight-head': { anchor: { x: 72, y: 76 }, pivot: 'center', size: [56, 34], shadow: false, initial: 'off', states: ['off', 'on', 'dead'] },
    // Burger stack on the art cart. Every layer shares the anchor and the layer's own pivot is its bottom center.
    // The engine stacks them with `stack` (set units above the anchor, per layer) unless settings give an offset.
    'art.burger-build': {
      anchor: { x: 30, y: 36 }, pivot: 'bottom-center', shadow: false,
      layers: ['bottom-bun', 'patty', 'cheese', 'lettuce', 'top-bun'],
      stack: { 'bottom-bun': 0, patty: -2.3, cheese: -3.8, lettuce: -5.3, 'top-bun': -7.1 },
    },

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
  };
  // One entry per part of the shared rig: the joint it hangs from and its default pivot inside the image
  const ROLES = {
    head: { joint: 'neck', pivot: 'bottom-center', size: [17, 21] },
    torso: { joint: 'hips', pivot: 'bottom-center', size: [14, 15] },
    'arm-front': { joint: 'shoulderFront', pivot: 'top-center', size: [8, 17] },
    'arm-back': { joint: 'shoulderBack', pivot: 'top-center', size: [8, 17] },
    'leg-front': { joint: 'hipFront', pivot: 'top-center', size: [11, 24] },
    'leg-back': { joint: 'hipBack', pivot: 'top-center', size: [11, 24] },
  };
  // Back to front. The upper body (everything but the legs) leans as one when the character works.
  const RIG_ORDER = { legs: ['leg-back', 'leg-front'], upper: ['arm-back', 'torso', 'head', 'arm-front'] };
  const CHARACTER_REQUIRED = ['head', 'torso', 'arm-front', 'leg-front', 'leg-back'];

  const api = { SLOTS, RIG, PUPPET, CHARACTERS, ROLES, RIG_ORDER, CHARACTER_REQUIRED };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapSlots = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
