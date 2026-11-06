"""Fit Crew Kit 01 (ChatGPT's 15-piece test batch) for the game's rig and write the kit catalog.

  python3 tools/fit_kit01.py <delivery folder> art/_kit

The delivery folder is the unzipped "Thats-A-Wrap-Crew-Kit-01". The delivered files are never modified.
art/_kit is parked: the game's art packer skips folders that start with "_", so nothing here ships until a
person is baked from it (tools/kit_person.py --bake).

What the fit does, and why (measured in Crew-Kit-01-Validation.md):
  - The nine head layers are used as delivered. They share the 28 x 32 head canvas and stack correctly.
  - Long hair: the front piece leaves a crescent of scalp showing at the back of the skull, because the back piece
    sits behind the head. The crescent is filled from the back piece and merged under the front piece.
  - The body was drawn to template A, which is Theo's slim build. On the rig it read narrow next to Ro: a 9 unit
    chest under a 13 unit head, hands in front of the thighs, legs overlapping. Fit A2 keeps the drawings and
    changes their size and placement only: torso x1.2, arms x1.08 and turned 5 degrees out, legs x0.9 and set
    apart, shoulders and hips wider. Each piece is resampled once from its 27 px master.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
PX, M = 8, 27
KEY = {'skin': '#F0A56C', 'hair': '#7A4A2E', 'top': '#8E9B6B', 'bottoms': '#5F6470'}

# Template A slots as delivered (set units): canvas and pivot
A = {'head': ([28, 32], [14, 26]), 'torso': ([18, 18], [9, 16.5]), 'pelvis': ([18, 14], [9, 6.5]),
     'arm-front': ([10, 20], [5, 3.5]), 'arm-back': ([10, 20], [5, 3.5]), 'leg-front': ([14, 26], [6, 5]), 'leg-back': ([14, 26], [6, 5])}
# Fit A2: per slot, the new canvas and pivot, the size change, a turn about the pivot (degrees, clockwise as in the
# game) and a sideways shift in units that puts the limb's axis on its pivot
A2 = {
    'head':      {'canvas': [28, 32], 'pivot': [14, 26], 'scale': 1.0, 'turn': 0, 'shift': 0},
    'torso':     {'canvas': [20, 21], 'pivot': [10, 19.5], 'scale': 1.2, 'turn': 0, 'shift': 0},
    'pelvis':    {'canvas': [18, 14], 'pivot': [9, 6.5], 'scale': 1.0, 'turn': 0, 'shift': 0},
    'arm-front': {'canvas': [12, 22], 'pivot': [6, 4], 'scale': 1.08, 'turn': -5, 'shift': -0.4},
    'arm-back':  {'canvas': [12, 22], 'pivot': [6, 4], 'scale': 1.08, 'turn': 5, 'shift': 0},
    'leg-front': {'canvas': [14, 24], 'pivot': [6, 4.6], 'scale': 0.9, 'turn': 0, 'shift': 0.63},
    'leg-back':  {'canvas': [14, 24], 'pivot': [6, 4.6], 'scale': 0.9, 'turn': 0, 'shift': 0.45},
}
JOINTS = {   # puppet units, feet at 0,0. Each leg's hip height is its own pivot-to-sole length, so both soles touch
    'hips': [0, -20.52], 'neck': [0, -34.78], 'shoulderFront': [5.8, -31.9], 'shoulderBack': [-5.8, -31.9],   # a unit under the tee's shoulder line, so the sleeve cap sits inside it
    'pelvis': [0, -17.46], 'hipFront': [3.5, -17.46], 'hipBack': [-3.5, -17.28],
}

def clean(im):
    a = np.array(im)
    a[..., 3][a[..., 3] < 8] = 0
    a[a[..., 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')

def refit(piece, slot):
    """Resample one body piece from its 27 px master onto its A2 canvas."""
    f = A2[slot]
    im = Image.open(os.path.join(src, 'masters', 'parts', f'{piece}@27x.png')).convert('RGBA')
    pvx, pvy = A[slot][1][0] * M, A[slot][1][1] * M
    if f['turn']:
        im = im.rotate(-f['turn'], resample=Image.BICUBIC, center=(pvx, pvy))   # Pillow turns counterclockwise
    k = PX / M * f['scale']
    w, h = round(im.width * k), round(im.height * k)
    im = im.resize((w, h), Image.LANCZOS)
    cw, ch = round(f['canvas'][0] * PX), round(f['canvas'][1] * PX)
    cv = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    cv.alpha_composite(im, (round(f['pivot'][0] * PX + f['shift'] * PX - pvx * k), round(f['pivot'][1] * PX - pvy * k)))
    return clean(cv)

def as_delivered(piece):
    return clean(Image.open(os.path.join(src, 'art', f'{piece}@8x.png')).convert('RGBA'))

def long_hair_with_cover():
    """Fill the crescent of scalp that shows behind the long hair's front piece, using the back piece's own paper."""
    front = np.array(as_delivered('kit.hair.long')); back = np.array(as_delivered('kit.hair.long.back'))
    head = np.zeros(front.shape[:2], bool)
    for h in ('kit.head.a', 'kit.head.b'):
        head |= np.array(as_delivered(h))[..., 3] >= 128
    xs = np.arange(front.shape[1])[None, :].repeat(front.shape[0], 0)
    crescent = head & (front[..., 3] < 128) & (back[..., 3] >= 128) & (xs < 11.5 * PX)   # behind the ear only
    crescent = ndi.binary_dilation(crescent, iterations=2) & (back[..., 3] >= 128) & (xs < 12 * PX)
    cover = np.zeros_like(front)
    cover[crescent] = back[crescent]
    merged = Image.fromarray(cover, 'RGBA')
    merged.alpha_composite(Image.fromarray(front, 'RGBA'))
    return clean(merged), int(crescent.sum())

pieces = {}
def add(piece, slot, layer, areas, im, **more):
    im.save(os.path.join(out, f'{piece}@8x.png'), optimize=True)
    pieces[piece] = {'slot': slot, 'layer': layer, 'areas': areas, **more}

# Head layers, as delivered
add('kit.head.a', 'head', 'head', ['skin'], as_delivered('kit.head.a'), label='Head A')
add('kit.head.b', 'head', 'head', ['skin'], as_delivered('kit.head.b'), label='Head B')
add('kit.hair.short', 'head', 'hair', ['hair*'], as_delivered('kit.hair.short'), label='Short hair')
add('kit.hair.curly', 'head', 'hair', ['hair*'], as_delivered('kit.hair.curly'), label='Curly hair')
long_im, filled = long_hair_with_cover()
add('kit.hair.long', 'head', 'hair', ['hair*'], long_im, label='Long hair', with_back='kit.hair.long.back')
add('kit.hair.long.back', 'head', 'hair-back', ['hair*'], as_delivered('kit.hair.long.back'), label='Long hair, back piece')
add('kit.hat.cap', 'head', 'hat', ['hat*'], as_delivered('kit.hat.cap'), label='Cap')
add('kit.face.beard', 'head', 'beard', ['hair*'], as_delivered('kit.face.beard'), label='Beard')
add('kit.face.glasses', 'head', 'glasses', [], as_delivered('kit.face.glasses'), label='Glasses')
# Body, refitted to A2
add('kit.top.tee.torso', 'torso', 'torso', ['top'], refit('kit.top.tee.torso', 'torso'), bundle='kit.top.tee')
add('kit.top.tee.arm-front', 'arm-front', 'arm-front', ['skin', 'top'], refit('kit.top.tee.arm-front', 'arm-front'), bundle='kit.top.tee')
add('kit.top.tee.arm-back', 'arm-back', 'arm-back', ['skin', 'top'], refit('kit.top.tee.arm-back', 'arm-back'), bundle='kit.top.tee')
add('kit.bottoms.shorts.pelvis', 'pelvis', 'pelvis', ['bottoms'], refit('kit.bottoms.shorts.pelvis', 'pelvis'), bundle='kit.bottoms.shorts')
add('kit.bottoms.shorts.leg-front', 'leg-front', 'leg-front', ['skin', 'bottoms'], refit('kit.bottoms.shorts.leg-front', 'leg-front'), bundle='kit.bottoms.shorts')
add('kit.bottoms.shorts.leg-back', 'leg-back', 'leg-back', ['skin', 'bottoms'], refit('kit.bottoms.shorts.leg-back', 'leg-back'), bundle='kit.bottoms.shorts')

catalog = {
    'name': 'Crew Kit 01', 'fit': 'A2', 'px_per_unit': PX,
    # Kit people are drawn at this share of the template's size. At 1.0 a kit person in a cap stands 53.6 units, against
    # Ro's 51.8 in his. A recipe can set its own "stature" for a taller or shorter person
    'stature': 0.98,
    'note': 'Built by tools/fit_kit01.py. Head layers as delivered, body refitted from the 27 px masters. An area marked * is the whole piece.',
    'joints': JOINTS,
    'slots': {s: {'canvas': f['canvas'], 'pivot': f['pivot'], 'joint': {'head': 'neck', 'torso': 'hips', 'pelvis': 'pelvis', 'arm-front': 'shoulderFront',
                                                                    'arm-back': 'shoulderBack', 'leg-front': 'hipFront', 'leg-back': 'hipBack'}[s]} for s, f in A2.items()},
    # back to front
    'layers': ['hair-back', 'leg-back', 'leg-front', 'pelvis', 'torso', 'arm-back', 'head', 'beard', 'hair', 'glasses', 'hat', 'arm-front'],
    'key_colors': KEY,
    'bundles': {'kit.top.tee': {'kind': 'top', 'label': 'Tee'}, 'kit.bottoms.shorts': {'kind': 'bottoms', 'label': 'Shorts'}},
    'exclude': [['kit.hat.cap', 'kit.hair.curly'], ['kit.hat.cap', 'kit.hair.long']],
    'pieces': pieces,
}
json.dump(catalog, open(os.path.join(out, 'kit.json'), 'w'), indent=2)
open(os.path.join(out, 'kit.json'), 'a').write('\n')
print(f'{len(pieces)} pieces in {out}. Long hair: filled {filled} px of scalp behind the front piece')
