"""Crew kit template: the footprint every kit piece has to fit, drawn from the delivered art.

  python3 tools/make_kit_template.py art docs/kit

Writes into the output folder:
  crew-kit-template.png     one sheet: the assembled mannequin with its joints, each slot's canvas with its guide
                            silhouette and pivot, the shared head canvas, and the key colors
  crew-kit-template.json    the same numbers as data: canvases, pivots, joints, guide sizes, key colors
  guides/kit.guide.<slot>@27x.png   one guide per slot at master scale (27 px per unit), transparent, to lay under or
                            over new art when checking its scale and placement

The body guides are Theo's parts as fitted in batch 8, because he is drawn to the guide sizes and stands on Ro's
rig. The head guide is a canvas with zones, not a silhouette: hair and hats change the outline.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

art, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'guides'), exist_ok=True)
M = 27          # master px per unit
BODY = 'theo'   # whose parts are the body guides

def font(size, bold=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if bold else '') + '.ttf', size)

def find(stem):
    for f in sorted(os.listdir(art)):
        if f.startswith(stem + '@') and f.rsplit('.', 1)[-1] in ('png', 'webp'): return os.path.join(art, f)

cfg = json.load(open(os.path.join(art, f'crew.{BODY}.json')))
J = cfg['joints']

# Slot canvases in set units: size, and where the pivot sits on the canvas
SLOTS = {
    'head':      {'canvas': [28, 32], 'pivot': [14, 26], 'joint': 'neck',          'pivot_is': 'bottom center of the neck stub'},
    'torso':     {'canvas': [18, 18], 'pivot': [9, 16.5], 'joint': 'hips',         'pivot_is': 'bottom center of the hem'},
    'pelvis':    {'canvas': [18, 14], 'pivot': [9, 6.5],  'joint': 'pelvis',       'pivot_is': 'center of the hip line, 5.2 units below the waistband top'},
    'arm-front': {'canvas': [10, 20], 'pivot': [5, 3.5],  'joint': 'shoulderFront', 'pivot_is': 'center of the round sleeve cap'},
    'arm-back':  {'canvas': [10, 20], 'pivot': [5, 3.5],  'joint': 'shoulderBack', 'pivot_is': 'center of the round sleeve cap'},
    'leg-front': {'canvas': [14, 26], 'pivot': [6, 5],    'joint': 'hipFront',     'pivot_is': 'center of the rounded leg top'},
    'leg-back':  {'canvas': [14, 26], 'pivot': [6, 5],    'joint': 'hipBack',      'pivot_is': 'center of the rounded leg top'},
}
GUIDE = {   # what the art inside the canvas should measure, in set units
    'head':      {'base_head': [12.5, 15.5], 'note': 'bald base head with ear, nose and neck stub. Hair, hats and beards may use the rest of the canvas'},
    'torso':     {'height': 14.1, 'width': '10.5 to 14.5'},
    'pelvis':    {'width': '12.5 to 14.5 (two thighs side by side)', 'height': '10 to 12'},
    'arm-front': {'height': 15.5}, 'arm-back': {'height': 15.5},
    'leg-front': {'height': 22.8}, 'leg-back': {'height': 22.8},
}
KEY = {   # key colors: areas drawn in these get recolored by the game
    'skin': '#F0A56C', 'hair': '#7A4A2E', 'top': '#8E9B6B', 'bottoms': '#5F6470',
}

def silhouette(role, px):
    """A part of the body guide as a flat grey shape at px per unit, with its pivot in px."""
    im = Image.open(find(f'crew.{BODY}.{role}')).convert('RGBA')
    pc = json.load(open(os.path.join(art, f'crew.{BODY}.{role}.json')))
    k = px / pc.get('scale', 8)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    a = np.asarray(im)[..., 3]
    g = np.zeros((im.height, im.width, 4), np.uint8)
    g[..., :3] = 150
    g[..., 3] = (a >= 128) * 255
    return Image.fromarray(g, 'RGBA'), [pc['pivot'][0] * k, pc['pivot'][1] * k]

def cross(d, x, y, r=9, col=(220, 30, 80, 255), w=3):
    d.line([x - r, y, x + r, y], fill=col, width=w); d.line([x, y - r, x, y + r], fill=col, width=w)
    d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=col)

def slot_guide(role, px, labels=False):
    s = SLOTS[role]
    W, H = round(s['canvas'][0] * px), round(s['canvas'][1] * px)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pvx, pvy = s['pivot'][0] * px, s['pivot'][1] * px
    if role == 'head':
        bw, bh = GUIDE['head']['base_head']
        # base head box: sits on the pivot, a little forward of it (the face looks right)
        x0 = pvx - bw * px * 0.46; y0 = pvy - bh * px
        d.rounded_rectangle([x0, y0, x0 + bw * px, pvy], radius=px * 2, outline=(90, 90, 90, 255), width=max(2, px // 9), fill=(150, 150, 150, 70))
        # neck stub
        d.rectangle([pvx - 2.1 * px, pvy - 2.2 * px, pvx + 2.1 * px, pvy], fill=(150, 150, 150, 150))
        # hair may fall behind the shoulders down to here
        d.line([0, pvy + 5 * px, W, pvy + 5 * px], fill=(60, 120, 200, 200), width=max(1, px // 12))
    else:
        sil, sp = silhouette(role, px)
        im.alpha_composite(sil, (round(pvx - sp[0]), round(pvy - sp[1])))
    d.rectangle([0, 0, W - 1, H - 1], outline=(60, 120, 200, 255), width=max(1, px // 12))
    cross(d, pvx, pvy, r=max(6, px // 2), w=max(2, px // 10))
    return im

# ---- per-slot guides at master scale
for role in SLOTS:
    slot_guide(role, M).save(os.path.join(out, 'guides', f'kit.guide.{role}@27x.png'))

# ---- data
spec = {
    'name': 'crew kit template A', 'units': 'set units. Masters at 27 px per unit, game exports at 8 px per unit',
    'facing': 'right. Front three-quarter view, light from the upper left',
    'stands': 'about 52 units to the top of a hat, feet at 0,0, y up is negative',
    'joints': {k: v for k, v in J.items()},
    'draw_order_back_to_front': ['hair back piece', 'leg-back', 'leg-front', 'pelvis', 'torso', 'arm-back', 'head', 'beard', 'hair', 'glasses', 'hat', 'arm-front'],
    'slots': {r: {**SLOTS[r], 'canvas_px_27x': [round(v * M) for v in SLOTS[r]['canvas']], 'pivot_px_27x': [round(v * M) for v in SLOTS[r]['pivot']],
                  'canvas_px_8x': [round(v * 8) for v in SLOTS[r]['canvas']], 'guide': GUIDE[r]} for r in SLOTS},
    'head_layers': 'head, hair, hair back piece, hat, beard and glasses for one base head all share the head canvas and are exported without moving them, so they stack exactly',
    'key_colors': KEY,
}
json.dump(spec, open(os.path.join(out, 'crew-kit-template.json'), 'w'), indent=2)

# ---- the sheet
P = 14                                 # px per unit on the sheet
SW, SH = 2600, 1500
sheet = Image.new('RGB', (SW, SH), '#F4EFE6')
d = ImageDraw.Draw(sheet)
INK = '#2B2B33'; BLUE = '#3C78C8'; RED = '#DC1E50'
d.text((40, 28), "That's a Wrap!  Crew kit template A", font=font(40, True), fill=INK)
d.text((40, 82), 'One body, drawn to these footprints. Blue box = the canvas of a slot. Red cross = its pivot. Grey = guide shape. 1 square = 2 units.', font=font(21), fill=INK)

# Panel 1: the assembled mannequin on a unit grid
ox, oy = 330, 1330
for u in range(-12, 13, 2):
    d.line([ox + u * P, oy - 58 * P, ox + u * P, oy + 2 * P], fill='#DDD6C8')
for u in range(0, 60, 2):
    d.line([ox - 12 * P, oy - u * P, ox + 12 * P, oy - u * P], fill='#DDD6C8')
    if u % 10 == 0: d.text((ox - 12 * P - 38, oy - u * P - 11), str(u), font=font(18), fill=INK)
for role in ['leg-back', 'leg-front', 'pelvis', 'torso', 'arm-back', 'arm-front']:
    sil, sp = silhouette(role, P)
    px_ = np.asarray(sil).copy(); shade = {'leg-back': 120, 'leg-front': 140, 'pelvis': 160, 'torso': 175, 'arm-back': 130, 'arm-front': 150}[role]
    px_[..., :3] = shade
    jx, jy = J[SLOTS[role]['joint']]
    sheet.paste(Image.fromarray(px_, 'RGBA'), (round(ox + jx * P - sp[0]), round(oy + jy * P - sp[1])), Image.fromarray(px_, 'RGBA'))
# head canvas on the neck joint
hg = slot_guide('head', P)
nx, ny = J['neck']
sheet.paste(hg, (round(ox + nx * P - SLOTS['head']['pivot'][0] * P), round(oy + ny * P - SLOTS['head']['pivot'][1] * P)), hg)
for name, (jx, jy) in J.items():
    cross(d, ox + jx * P, oy + jy * P, r=7, w=3)
labels = {'neck': 'neck', 'hips': 'hem', 'pelvis': 'hip line', 'shoulderFront': 'shoulder'}
for name, text in labels.items():
    jx, jy = J[name]
    d.line([ox + jx * P, oy + jy * P, ox + 14 * P, oy + jy * P], fill=RED, width=1)
    d.text((ox + 14 * P + 6, oy + jy * P - 12), f'{text}  y {(-jy):.1f}', font=font(19), fill=RED)
d.line([ox - 12 * P, oy, ox + 12 * P, oy], fill=INK, width=3)
d.text((ox - 150, oy + 34), 'Assembled, feet at 0. Faces right.', font=font(21, True), fill=INK)
d.text((ox - 150, oy + 62), 'Arms draw over the torso. Legs hang under the pelvis.', font=font(19), fill=INK)

# Panel 2: slots, each on its canvas
x = 760; y0 = 170
def place(role, x, y, title):
    g = slot_guide(role, P)
    sheet.paste(g, (x, y), g)
    s = SLOTS[role]
    d.text((x, y - 56), title, font=font(23, True), fill=INK)
    d.text((x, y - 28), f"canvas {s['canvas'][0]} x {s['canvas'][1]} u", font=font(18), fill=BLUE)
    d.text((x, y + g.height + 6), f"27x: {round(s['canvas'][0]*M)} x {round(s['canvas'][1]*M)} px", font=font(17), fill=INK)
    d.text((x, y + g.height + 28), f"8x: {round(s['canvas'][0]*8)} x {round(s['canvas'][1]*8)} px", font=font(17), fill=INK)
    d.text((x, y + g.height + 50), f"pivot {s['pivot'][0]}, {s['pivot'][1]} u", font=font(17), fill=RED)
    return g
g = place('head', x, y0 + 40, 'HEAD CANVAS')
hx, hy = x, y0 + 40
bw, bh = GUIDE['head']['base_head']
d.text((hx + 8, hy + 8), 'shared by head, hair, hat, beard, glasses.\nHair and hats may use the whole canvas', font=font(16), fill=BLUE)
d.text((hx + 8, hy + (SLOTS['head']['pivot'][1] + 5) * P - 24), 'long hair ends by this line', font=font(16), fill=BLUE)
d.text((hx + SLOTS['head']['pivot'][0] * P - 70, hy + (SLOTS['head']['pivot'][1] - bh / 2) * P - 20), f'base head\n{bw} x {bh} u', font=font(18, True), fill=INK, align='center')
tx = x + 28 * P + 70
place('torso', tx, y0 + 40, 'TORSO')
d.text((tx, y0 + 40 + 18 * P + 74), 'guide height 14.1 u\nno arms, no armholes', font=font(17), fill=INK)
place('pelvis', tx, y0 + 500, 'PELVIS')
d.text((tx, y0 + 500 + 14 * P + 74), 'guide width 12.5 to 14.5 u\nends on fabric, no dark\nleg openings', font=font(17), fill=INK)
ax = tx + 18 * P + 70
place('arm-back', ax, y0 + 40, 'ARM back')
place('arm-front', ax + 10 * P + 50, y0 + 40, 'ARM front')
d.text((ax, y0 + 40 + 20 * P + 74), 'guide height 15.5 u, hanging straight\nsleeve and hand in one piece', font=font(17), fill=INK)
lx = ax + 2 * (10 * P + 50) + 30
place('leg-back', lx, y0 + 40, 'LEG back')
place('leg-front', lx + 14 * P + 50, y0 + 40, 'LEG front')
d.text((lx, y0 + 40 + 26 * P + 74), 'guide height 22.8 u, toe points right\ntrouser and shoe in one piece', font=font(17), fill=INK)

# Panel 3: key colors
kx, ky = 760, 1010
d.text((kx, ky), 'KEY COLORS', font=font(23, True), fill=INK)
d.text((kx, ky + 32), 'Draw these areas in these colors. The game recolors them. Everything else keeps the color it is drawn in.', font=font(19), fill=INK)
for i, (name, hx_) in enumerate(KEY.items()):
    cx = kx + i * 290
    d.rounded_rectangle([cx, ky + 72, cx + 120, ky + 152], radius=12, fill=hx_, outline=INK, width=2)
    d.text((cx + 132, ky + 80), name, font=font(22, True), fill=INK)
    d.text((cx + 132, ky + 110), hx_, font=font(20), fill=INK)
rules = [
    'One flat color per area, the same paper grain as Ro. Shading inside an area stays the same hue.',
    'Inside one piece, no two areas in similar colors (a cream tee under a sage jacket is too close: make the tee light blue).',
    'Head layers for one base head are cut from one drawing and exported on the head canvas without moving them.',
    'Every piece also comes with an approved picture of the mannequin wearing it. That picture is what placement is checked against.',
]
for i, r in enumerate(rules):
    d.text((kx, ky + 184 + i * 34), f'{i + 1}.  {r}', font=font(19), fill=INK)
d.text((kx, ky + 184 + len(rules) * 34 + 16), 'Numbers as data: crew-kit-template.json.  Guides at master scale: guides/kit.guide.<slot>@27x.png', font=font(18), fill=BLUE)
sheet.save(os.path.join(out, 'crew-kit-template.png'), optimize=True)
print('wrote', os.path.join(out, 'crew-kit-template.png'), sheet.size, 'and', len(SLOTS), 'guides')
