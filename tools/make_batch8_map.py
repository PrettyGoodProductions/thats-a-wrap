"""Batch 8 (Nov 5): Client, Agency, Receptionist and Theo, plus the Agency's latte.

  python3 tools/make_batch8_map.py <delivery folder> > tools/batch8.map.json
  python3 tools/prep_art.py tools/batch8.map.json <delivery folder> art

The delivery folder is the unzipped "Thats-A-Wrap-Agency-Receptionist-Theo-Components".

Agency, Receptionist and Theo arrive with every part resized to the manifest's guide heights at 8 px per unit, so
they keep the delivered pixels (native 8, target 8). The joints are fitted the way Ro's are:
  - arm and leg pivots at the center of the rounded cap (the cap's own radius below its top), read from the alpha
  - the pelvis pivot on its hip line, centered. The legs sit side by side with LEG_OVERLAP units shared at the middle
  - the delivered pelvis is narrower than the two legs it has to cover (each part was sized by height alone), so it is
    refitted from its 27 px master to the width of the legs. The waist stays where it was, the crotch drops
  - the pelvis art has dark leg openings at the bottom of each tube. They are trimmed off (prep_art "trim_openings"),
    because the legs hang under the pelvis and the openings would show on the thighs
  - both arms draw over the torso (the torso art has an armhole painted where the near arm attaches)
  - the shirt hem overlaps the waistband by HEM_OVERLAP units, the neck stub tucks NECK_TUCK units under the collar
  - shoulders from the delivery's suggested points on the torso
The Client arrives cut from one assembled drawing, with her own placement file (origins and pivots on a 267 x 401
canvas). Her joints come straight from that file, and her scale is set so she stands as tall as the others.
"""
import json, os, sys
import numpy as np
from PIL import Image

src = sys.argv[1]
ART = os.path.join(src, 'art')
PX = 8                 # delivered px per set unit
HEM_OVERLAP = 2.1      # units of shirt hem over the waistband (Ro: 2.2)
LEG_OVERLAP = 1.0     # units the two thighs share at the centerline
HIP_LINE = 5.16        # units from the top of the pelvis down to the hip joints (the delivery's hip points)
MASTER = 27            # px per unit of the masters
STAND = 51.8           # units from sole to the top of the head, like Ro and batch 2
ROLES = ['head', 'torso', 'pelvis', 'arm-front', 'arm-back', 'leg-front', 'leg-back']
r2 = lambda v: round(float(v), 2)

def alpha(ch, role):
    return np.array(Image.open(os.path.join(ART, f'crew.{ch}.{role}@8x.png')).convert('RGBA'))[..., 3] >= 128

def bbox(a):
    ys, xs = np.where(a)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

def cap_pivot(a):
    """Center of the rounded cap at the top of an arm or leg: one cap radius below the top, on the limb's axis."""
    x0, y0, x1, y1 = bbox(a)
    # The limb's width a little below the cap (a fifth of the way down) gives the radius
    row = a[y0 + (y1 - y0) // 5]
    xs = np.where(row)[0]
    r = (xs.max() + 1 - xs.min()) / 2
    row_c = a[int(y0 + r)]
    xc = np.where(row_c)[0]
    return [(xc.min() + xc.max() + 1) / 2, y0 + r]

def thigh_width(a):
    """Width of the upper leg in px: the median over the rows between the cap and the knee."""
    x0, y0, x1, y1 = bbox(a)
    rows = range(y0 + 30, y0 + 90, 5)
    return float(np.median([np.where(a[y])[0].max() + 1 - np.where(a[y])[0].min() for y in rows]))

def leg_openings(a):
    """Centers of the two leg tubes at the bottom of the shorts-shaped pelvis, as x in image px (back, front)."""
    x0, y0, x1, y1 = bbox(a)
    row = a[y1 - 6]
    xs = np.where(row)[0]
    gaps = np.where(np.diff(xs) > 1)[0]
    if len(gaps):
        left = xs[:gaps[0] + 1]; right = xs[gaps[-1] + 1:]
    else:   # no gap between the tubes: split the row down the middle
        mid = (xs.min() + xs.max()) // 2
        left = xs[xs <= mid]; right = xs[xs > mid]
    return (left.min() + left.max() + 1) / 2, (right.min() + right.max() + 1) / 2

def portrait(head_a, pivot, neck, scale):
    x0, y0, x1, y1 = bbox(head_a)
    left = neck[0] + (x0 - pivot[0]) / scale; top = neck[1] + (y0 - pivot[1]) / scale
    w = (x1 - x0) / scale; h = (y1 - y0) / scale
    return [r2(left - 4), r2(top - 3.7), r2(w + 8), r2(h + 7.5)]

pieces, characters, notes = {}, {}, {}

for ch in ['agency', 'receptionist', 'theo']:
    meta = json.load(open(os.path.join(src, 'metadata', f'crew.{ch}.delivery.json')))['parts']
    A = {r: alpha(ch, r) for r in ROLES}
    piv = {}
    piv['head'] = meta['head']['pivot_px']
    piv['torso'] = meta['torso']['pivot_px']
    for r in ['arm-front', 'arm-back', 'leg-front', 'leg-back']:
        piv[r] = cap_pivot(A[r])
    px0, py0, px1, py1 = bbox(A['pelvis'])
    thigh = float(np.median([thigh_width(A[r]) for r in ['leg-front', 'leg-back']])) / PX
    hip_x = thigh / 2 - LEG_OVERLAP / 2
    pelvis_w = 2 * hip_x + thigh + 0.4
    grow = max(1.0, pelvis_w / ((px1 - px0) / PX))
    pm = np.array(Image.open(os.path.join(src, 'masters', 'parts', f'crew.{ch}.pelvis@27x.png')).convert('RGBA'))[..., 3] >= 128
    mx0, my0, mx1, my1 = bbox(pm)
    pelvis_native = MASTER / grow
    pelvis_pivot_master = [(mx0 + mx1) / 2, my0 + HIP_LINE * pelvis_native]

    # Feet at 0,0. The longer leg sets the hip height so both soles reach the floor
    leg_len = {r: (bbox(A[r])[3] - piv[r][1]) / PX for r in ['leg-front', 'leg-back']}
    hip_y = -max(leg_len.values())
    hip_front = [hip_x, hip_y]
    hip_back = [-hip_x, hip_y]
    pelvis = [0, hip_y]
    pelvis_top = hip_y - HIP_LINE
    hips = [0, pelvis_top + HEM_OVERLAP]
    t = meta['torso']['points_px']; tp = piv['torso']
    neck = [hips[0] + (t['neck'][0] - tp[0]) / PX, hips[1] + (t['neck'][1] - tp[1]) / PX]
    # The far arm hangs from the torso's edge the way Ro's does (0.76 of the half width), a little outside the delivery's point
    tx0, _, tx1, _ = bbox(A['torso'])
    sh_f = [max((t['shoulder_front'][0] - tp[0]) / PX, 0.76 * (tx1 - tx0) / 2 / PX), hips[1] + (t['shoulder_front'][1] - tp[1]) / PX]
    sh_b = [hips[0] + (t['shoulder_back'][0] - tp[0]) / PX, hips[1] + (t['shoulder_back'][1] - tp[1]) / PX]
    top = neck[1] - (piv['head'][1] - bbox(A['head'])[1]) / PX

    for r in ROLES:
        if r == 'pelvis':
            pieces[f'crew.{ch}.{r}'] = {'native': r2(pelvis_native), 'target': PX, 'pivot': [r2(v) for v in pelvis_pivot_master], 'files': {'default': {'file': f'masters/parts/crew.{ch}.pelvis@27x.png', 'trim_openings': True}}}
        else:
            pieces[f'crew.{ch}.{r}'] = {'native': PX, 'target': PX, 'pivot': [r2(piv[r][0]), r2(piv[r][1])], 'files': {'default': f'art/crew.{ch}.{r}@8x.png'}}
    characters[f'crew.{ch}'] = {
        'scale': PX, 'fixed': True,
        'joints': {'hips': [r2(v) for v in hips], 'neck': [r2(v) for v in neck], 'shoulderFront': [r2(v) for v in sh_f], 'shoulderBack': [r2(v) for v in sh_b],
                   'pelvis': [r2(v) for v in pelvis], 'hipFront': [r2(v) for v in hip_front], 'hipBack': [r2(v) for v in hip_back]},
        'portrait': portrait(A['head'], piv['head'], neck, PX),
        # Back to front. The far arm (arm-front, toward the stage) and the near arm (arm-back) both sit over the torso
        'order': {'upper': ['torso', 'arm-back', 'head', 'arm-front']},
    }
    if ch == 'agency':
        # Her latte rides in the near hand, under the fingers, and turns with that arm
        g = meta['arm-back']['points_px']['grip']
        characters[f'crew.{ch}']['holds'] = {'role': 'arm-back', 'item': 'agency-latte',
                                             'at': [r2(sh_b[0] + (g[0] - piv['arm-back'][0]) / PX), r2(sh_b[1] + (g[1] - piv['arm-back'][1]) / PX)]}
    notes[ch] = f'stands {-top:.1f} units, hips {hip_y:.2f}, thigh {thigh:.1f}, pelvis refitted x{grow:.2f} to {pelvis_w:.1f} wide'

# The Client: joints from her own placement file
c = json.load(open(os.path.join(ART, 'crew.client.json')))
P = c['parts']
world = {r: [P[r]['origin_px'][0] + P[r]['pivot_px'][0], P[r]['origin_px'][1] + P[r]['pivot_px'][1]] for r in ROLES}
A = {r: alpha('client', r) for r in ROLES}
floor = max(P[r]['origin_px'][1] + bbox(A[r])[3] for r in ['leg-front', 'leg-back'])
top_px = P['head']['origin_px'][1] + bbox(A['head'])[1]
c_scale = (floor - top_px) / STAND      # image px per unit that makes her stand STAND units
feet_x = (world['leg-front'][0] + world['leg-back'][0]) / 2
J = lambda r: [r2((world[r][0] - feet_x) / c_scale), r2((world[r][1] - floor) / c_scale)]
# Her sheet is drawn the other way round from the rig's naming: the json's "front" limbs sit on the left (x < 0)
for r in ROLES:
    pieces[f'crew.client.{r}'] = {'native': PX, 'target': PX, 'scale': r2(c_scale), 'pivot': P[r]['pivot_px'], 'files': {'default': f'art/crew.client.{r}@8x.png'}}
neck = J('head')
characters['crew.client'] = {
    'scale': r2(c_scale), 'fixed': True,
    'joints': {'hips': J('torso'), 'neck': neck, 'shoulderFront': J('arm-front'), 'shoulderBack': J('arm-back'), 'pelvis': J('pelvis'), 'hipFront': J('leg-front'), 'hipBack': J('leg-back')},
    'portrait': portrait(A['head'], P['head']['pivot_px'], neck, c_scale),
}
notes['client'] = f'{(floor - top_px) / PX:.1f} units at 8 px per unit as delivered, drawn at {c_scale:.2f} px per unit to stand {STAND}'

# The Agency's latte joins the held props (its pivot is where the hand holds it)
latte = json.load(open(os.path.join(src, 'metadata', 'crew.agency.delivery.json')))['parts']['latte']['pivot_px']

out = {
    '_note': 'Batch 8 (Nov 5): Client, Agency, Receptionist and Theo on the fixed rig, and the Agency latte. Built by tools/make_batch8_map.py. ' + '. '.join(f'{k}: {v}' for k, v in notes.items()),
    'pieces': pieces,
    'characters': characters,
}
out['pieces']['crew.held'] = {'native': 6, 'target': 6, 'merge': True, 'files': {'agency-latte': {'file': 'art/crew.held.agency-latte@6x.png', 'pivot': latte}}}
json.dump(out, sys.stdout, indent=2)
print()
