"""Proof for the crew kit: new people assembled from parts of the delivered characters, recolored in code.

  python3 tools/kit_mix.py art out.png [--px 10]

A head from one character goes on the outfit of another (torso, arms, pelvis, legs stay together as a bundle).
Skin on the head and the hands is recolored to one tone, and hair, top and trousers can each take a color.
Recoloring moves one color area at a time (tools/recolor_area.py), so eyes, glasses, buttons and boots keep
their own colors, and a nose follows the skin it sits on. Nothing here is in the game yet: it shows what the art already allows.

Bodies come from the four characters drawn to the guide sizes (ro, agency, receptionist, theo), so their parts
share one scale. Heads can come from any character, each at its own scale.
"""
import json, os, sys
import numpy as np
from PIL import Image
from skimage import color as skc
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recolor_area import palette_of, recolor_areas, nearest

art, out = sys.argv[1], sys.argv[2]
R = float(sys.argv[sys.argv.index('--px') + 1]) if '--px' in sys.argv else 10
JOINT = {'head': 'neck', 'torso': 'hips', 'pelvis': 'pelvis', 'arm-front': 'shoulderFront', 'arm-back': 'shoulderBack', 'leg-front': 'hipFront', 'leg-back': 'hipBack'}
ORDER = ['leg-back', 'leg-front', 'pelvis', 'arm-back', 'torso', 'head', 'arm-front']

def find(stem):
    for f in sorted(os.listdir(art)):
        if f.startswith(stem + '@') and f.rsplit('.', 1)[-1] in ('png', 'webp'): return os.path.join(art, f)

def part(ch, role): return Image.open(find(f'crew.{ch}.{role}')).convert('RGBA')
def cfg(ch, role=None): return json.load(open(os.path.join(art, f'crew.{ch}.{role}.json' if role else f'crew.{ch}.json')))

def median_lab(im, box=None):
    """Median color of the opaque pixels (in a box given as fractions of the image), as Lab."""
    a = np.asarray(im).astype(float) / 255
    h, w = a.shape[:2]
    if box: a = a[int(box[1] * h):int(box[3] * h), int(box[0] * w):int(box[2] * w)]
    px = a[a[..., 3] > 0.9][:, :3]
    return skc.rgb2lab(np.median(px, 0)[None, None, :])[0, 0]

# Each head's color areas, as indexes into its own palette (python3 tools/recolor_area.py art/crew.<name>.head@8x.png
# prints it). The first index leads, the rest follow it: shades of the same paper, and the nose for skin.
# Everything not listed (hats, glasses, earrings, eyes, lips) keeps its color.
HEAD = {
    'ro': {'skin': [2, 3, 4, 6], 'hair': [0]},
    'mika': {'skin': [0, 5], 'hair': [2, 3]},
    'theo': {'skin': [0, 6], 'hair': [1, 4]},
    'receptionist': {'skin': [2, 1], 'hair': [0, 3]},
    'dani': {'skin': [0, 4], 'hair': [1, 2, 3]},
    'lu': {'skin': [1, 2, 3], 'hair': [0]},
    'agency': {'skin': [1, 2, 3, 4], 'hair': []},
    'client': {'skin': [0, 4, 5], 'hair': [1, 2]},
}

def moves_for(palette, areas):
    """areas: list of (lead index, follower indexes, '#hex'). Returns the moves and follow maps for recolor_areas."""
    moves, follow = {}, {}
    for lead, rest, target in areas:
        moves[lead] = target
        for i in rest: follow[i] = lead
    return moves, follow

def family(palette, lab, join=11.0):
    """The palette color nearest to `lab` and the shades of it: (lead, followers)."""
    lead = nearest(palette, lab)
    d = [np.sqrt((0.25 * (p[0] - palette[lead][0])) ** 2 + (p[1] - palette[lead][1]) ** 2 + (p[2] - palette[lead][2]) ** 2) for p in palette]
    return lead, [i for i in range(len(palette)) if i != lead and d[i] < join]

def person(head, body, skin=None, hair=None, top=None, bottoms=None):
    bc = cfg(body)
    W, H = int(34 * R), int(60 * R)
    ox, oy = W // 2, int(56 * R)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # the body's skin is read off the hand (the bottom of the front arm), its top and trousers are the biggest areas
    hand = median_lab(part(body, 'arm-front'), (0, 0.85, 1, 1))
    tp = palette_of(part(body, 'torso'), 6); top_lab = tp[0] if nearest(tp, hand) != 0 else tp[1]
    leg_lab = palette_of(part(body, 'leg-front'), 5)[0]
    order = ORDER[:3] + bc.get('order', {}).get('upper', ORDER[3:])
    for role in order:
        src = head if role == 'head' else body
        im = part(src, role); pc = cfg(src, role)
        scale = pc.get('scale', cfg(src).get('scale', 8))
        areas = []
        if role == 'head':
            pal = palette_of(im, 7); hs = HEAD[head]
            if skin: areas.append((hs['skin'][0], hs['skin'][1:], skin))
            if hair and hs['hair']: areas.append((hs['hair'][0], hs['hair'][1:], hair))
        else:
            pal = palette_of(im, 5)
            if skin and role.startswith('arm'): areas.append((*family(pal, hand), skin))
            if top and (role == 'torso' or role.startswith('arm')):
                lead, rest = family(pal, top_lab)
                if all(lead != a[0] for a in areas): areas.append((lead, rest, top))
            if bottoms and (role == 'pelvis' or role.startswith('leg')): areas.append((*family(pal, leg_lab, 7.0), bottoms))
        if areas:
            moves, follow = moves_for(pal, areas)
            im = recolor_areas(im, pal, moves, follow)
        k = R / scale
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        at = bc['joints'][JOINT[role]]
        cv.alpha_composite(im, (round(ox + at[0] * R - pc['pivot'][0] * k), round(oy + at[1] * R - pc['pivot'][1] * k)))
    return cv

# sRGB palettes, as hex
SKIN = {'fair': '#F6CFAE', 'tan': '#E8A873', 'olive': '#C98B5E', 'brown': '#A5663F', 'deep': '#7A4526'}
PEOPLE = [
    dict(head='theo', body='ro', skin=SKIN['olive'], hair='#2A1D14', top='#3F6FA8'),
    dict(head='ro', body='theo', skin=SKIN['deep'], top='#C9574A', bottoms='#3B4A5E'),
    dict(head='mika', body='receptionist', skin=SKIN['brown'], hair='#1E1612', top='#E0A93B'),
    dict(head='receptionist', body='ro', skin=SKIN['tan'], top='#5E8C7A'),
    dict(head='theo', body='agency', skin=SKIN['brown'], hair='#B5532A'),
    dict(head='mika', body='theo', skin=SKIN['fair'], hair='#E4A140', top='#7B4B6A', bottoms='#6B5B45'),
    dict(head='ro', body='receptionist', skin=SKIN['fair'], top='#3F6FA8', bottoms='#4A4A52'),
    dict(head='receptionist', body='theo', skin=SKIN['deep'], top='#E0A93B'),
    dict(head='theo', body='receptionist', skin=SKIN['tan'], hair='#8E8E8E', top='#C9574A'),
    dict(head='mika', body='ro', skin=SKIN['olive'], hair='#6B3F22', top='#5E8C7A', bottoms='#3B4A5E'),
    dict(head='ro', body='agency', skin=SKIN['brown']),
    dict(head='receptionist', body='agency', skin=SKIN['fair'], top='#7B4B6A'),
]
cells = [person(**p) for p in PEOPLE]
cols = 6
rows = (len(cells) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cells[0].width, rows * cells[0].height), '#8C8C8C')
for i, c in enumerate(cells):
    sheet.paste(c, ((i % cols) * c.width, (i // cols) * c.height), c)
sheet.save(out)
print(out, sheet.size)
