"""Crew kit template: the footprint every kit piece has to fit, drawn from the fitted kit itself.

  python3 tools/make_kit_template.py art/_kit docs/kit

Reads the kit catalog (art/_kit/kit.json, written by tools/fit_kit01.py) and writes into the output folder:
  crew-kit-template.png     one sheet: the assembled mannequin with its joints, each slot's canvas with its guide
                            silhouette and pivot, the shared head canvas, the shoe zone, and the key colors
  crew-kit-template.json    the same numbers as data: canvases, pivots, joints, guide sizes, key colors
  guides/kit.guide.<slot>@27x.png   one guide per slot at 27 px per unit, transparent, to lay under or over new art

Template A2 (Nov 5) replaces template A. A was Theo's body, which turned out too slim next to Ro once real kit
pieces were on it. A2 is Crew Kit 01 as fitted: the tee and shorts are the body guides, the bald head is the head
guide. New pieces drawn to these guides drop in at 8 px per unit with no refitting.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

kit_dir, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'guides'), exist_ok=True)
M = 27
cat = json.load(open(os.path.join(kit_dir, 'kit.json')))
PXK = cat['px_per_unit']
J = cat['joints']
SLOTS = cat['slots']
KEY = cat['key_colors']
GUIDE_PIECE = {'head': 'kit.head.a', 'torso': 'kit.top.tee.torso', 'pelvis': 'kit.bottoms.shorts.pelvis', 'arm-front': 'kit.top.tee.arm-front',
               'arm-back': 'kit.top.tee.arm-back', 'leg-front': 'kit.bottoms.shorts.leg-front', 'leg-back': 'kit.bottoms.shorts.leg-back'}
PIVOT_IS = {'head': 'bottom center of the neck stub', 'torso': 'bottom center of the hem', 'pelvis': 'center of the hip line, 5.1 units below the waistband top',
            'arm-front': 'center of the round sleeve cap', 'arm-back': 'center of the round sleeve cap',
            'leg-front': 'center of the rounded leg top', 'leg-back': 'center of the rounded leg top'}
# Where a shoe sits on a leg canvas, in units from the leg's pivot: x0, y0, x1, y1. Every shoe covers the foot inside this box
SHOE = [-4.2, 10.5, 7.1, 17.5]

def font(size, bold=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if bold else '') + '.ttf', size)

def content(slot):
    a = np.asarray(Image.open(os.path.join(kit_dir, GUIDE_PIECE[slot] + '@8x.png')).convert('RGBA'))[..., 3] >= 128
    ys, xs = np.where(a)
    return (xs.max() + 1 - xs.min()) / PXK, (ys.max() + 1 - ys.min()) / PXK

GUIDE = {s: {'width': round(content(s)[0], 1), 'height': round(content(s)[1], 1)} for s in SLOTS}

def silhouette(slot, px, shade=150):
    """The guide piece of a slot on its full canvas, as a flat grey shape at px per unit."""
    im = Image.open(os.path.join(kit_dir, GUIDE_PIECE[slot] + '@8x.png')).convert('RGBA')
    k = px / PXK
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    g = np.zeros((im.height, im.width, 4), np.uint8)
    g[..., :3] = shade
    g[..., 3] = (np.asarray(im)[..., 3] >= 128) * 255
    return Image.fromarray(g, 'RGBA')

def cross(d, x, y, r=9, col=(220, 30, 80, 255), w=3):
    d.line([x - r, y, x + r, y], fill=col, width=w); d.line([x, y - r, x, y + r], fill=col, width=w)
    d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=col)

def slot_guide(slot, px, shade=150):
    s = SLOTS[slot]
    W, H = round(s['canvas'][0] * px), round(s['canvas'][1] * px)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    im.alpha_composite(silhouette(slot, px, shade))
    d = ImageDraw.Draw(im)
    pvx, pvy = s['pivot'][0] * px, s['pivot'][1] * px
    lw = max(1, round(px / 12))
    if slot == 'head':
        d.line([0, pvy + 5 * px, W, pvy + 5 * px], fill=(60, 120, 200, 200), width=lw)   # long hair ends by here
    if slot.startswith('leg-'):
        x0, y0, x1, y1 = SHOE
        d.rectangle([pvx + x0 * px, pvy + y0 * px, pvx + x1 * px, pvy + y1 * px], outline=(230, 140, 20, 255), width=max(2, lw))
    d.rectangle([0, 0, W - 1, H - 1], outline=(60, 120, 200, 255), width=lw)
    cross(d, pvx, pvy, r=max(6, px // 2), w=max(2, px // 10))
    return im

for slot in SLOTS:
    slot_guide(slot, M).save(os.path.join(out, 'guides', f'kit.guide.{slot}@27x.png'))

spec = {
    'name': 'crew kit template A2', 'replaces': 'template A (Theo\'s body). Canvases, pivots, joints and guide sizes changed for torso, arms and legs',
    'units': 'set units. Game exports at 8 px per unit. Masters at 27 px per unit are welcome',
    'facing': 'right. Front three-quarter view, light from the upper left',
    'stands': 'at template scale, 50.2 units to the top of a bald head, about 51.5 with hair and 53.6 in a cap. Feet at 0,0, y up is negative. The game draws kit people at ' + str(cat.get('stature', 1.0)) + ' of template scale, so a person in a cap stands level with Ro',
    'joints': J,
    'draw_order_back_to_front': cat['layers'] + ['shoes draw over their leg, inside the leg'],
    'slots': {s: {'canvas': SLOTS[s]['canvas'], 'pivot': SLOTS[s]['pivot'], 'joint': SLOTS[s]['joint'], 'pivot_is': PIVOT_IS[s],
                  'canvas_px_8x': [round(v * 8) for v in SLOTS[s]['canvas']], 'pivot_px_8x': [round(v * 8, 1) for v in SLOTS[s]['pivot']],
                  'canvas_px_27x': [round(v * M) for v in SLOTS[s]['canvas']], 'pivot_px_27x': [round(v * M, 1) for v in SLOTS[s]['pivot']],
                  'guide_content_units': GUIDE[s]} for s in SLOTS},
    'shoe_zone_units_from_leg_pivot': {'x0': SHOE[0], 'y0': SHOE[1], 'x1': SHOE[2], 'y1': SHOE[3]},
    'head_layers': 'head, hair, hair back piece, hat, beard and glasses for one base head all share the head canvas and are exported without moving them, so they stack exactly',
    'arms': 'drawn hanging 5 degrees out from straight down, the hand away from the body. Both arms draw over the torso',
    'key_colors': KEY,
}
json.dump(spec, open(os.path.join(out, 'crew-kit-template.json'), 'w'), indent=2)

# ---- the sheet
P = 14
SW, SH = 2760, 1560
sheet = Image.new('RGB', (SW, SH), '#F4EFE6')
d = ImageDraw.Draw(sheet)
INK = '#2B2B33'; BLUE = '#3C78C8'; RED = '#DC1E50'; ORANGE = '#E68C14'
d.text((40, 28), "That's a Wrap!  Crew kit template A2", font=font(40, True), fill=INK)
d.text((40, 82), 'Blue box = the canvas of a slot. Red cross = its pivot. Grey = guide shape (Crew Kit 01 as fitted). Orange box = shoe zone. 1 square = 2 units.', font=font(21), fill=INK)

ox, oy = 330, 1330
for u in range(-12, 13, 2):
    d.line([ox + u * P, oy - 58 * P, ox + u * P, oy + 2 * P], fill='#DDD6C8')
for u in range(0, 60, 2):
    d.line([ox - 12 * P, oy - u * P, ox + 12 * P, oy - u * P], fill='#DDD6C8')
    if u % 10 == 0: d.text((ox - 12 * P - 38, oy - u * P - 11), str(u), font=font(18), fill=INK)
shades = {'leg-back': 120, 'leg-front': 140, 'pelvis': 160, 'torso': 175, 'arm-back': 130, 'head': 190, 'arm-front': 150}
for slot in ['leg-back', 'leg-front', 'pelvis', 'torso', 'arm-back', 'head', 'arm-front']:
    sil = silhouette(slot, P, shades[slot])
    jx, jy = J[SLOTS[slot]['joint']]
    sheet.paste(sil, (round(ox + (jx - SLOTS[slot]['pivot'][0]) * P), round(oy + (jy - SLOTS[slot]['pivot'][1]) * P)), sil)
for name, (jx, jy) in J.items():
    cross(d, ox + jx * P, oy + jy * P, r=7, w=3)
for name, text in {'neck': 'neck', 'hips': 'hem', 'pelvis': 'hip line', 'shoulderFront': 'shoulder'}.items():
    jx, jy = J[name]
    d.line([ox + jx * P, oy + jy * P, ox + 14 * P, oy + jy * P], fill=RED, width=1)
    d.text((ox + 14 * P + 6, oy + jy * P - 12), f'{text}  y {(-jy):.1f}', font=font(19), fill=RED)
d.text((ox + 14 * P + 6, oy + J['shoulderFront'][1] * P + 12), f"x ±{J['shoulderFront'][0]:.1f}", font=font(19), fill=RED)
d.text((ox + 14 * P + 6, oy + J['pelvis'][1] * P + 12), f"hips x ±{J['hipFront'][0]:.1f}", font=font(19), fill=RED)
d.line([ox - 12 * P, oy, ox + 12 * P, oy], fill=INK, width=3)
d.text((ox - 150, oy + 34), 'Assembled, feet at 0. Faces right.', font=font(21, True), fill=INK)
d.text((ox - 150, oy + 62), 'Arms draw over the torso. Legs hang under the pelvis.', font=font(19), fill=INK)

x = 760; y0 = 170
def place(slot, x, y, title):
    g = slot_guide(slot, P)
    sheet.paste(g, (x, y), g)
    s = SLOTS[slot]
    d.text((x, y - 56), title, font=font(23, True), fill=INK)
    d.text((x, y - 28), f"canvas {s['canvas'][0]} x {s['canvas'][1]} u", font=font(18), fill=BLUE)
    d.text((x, y + g.height + 6), f"8x: {round(s['canvas'][0]*8)} x {round(s['canvas'][1]*8)} px", font=font(17), fill=INK)
    d.text((x, y + g.height + 28), f"27x: {round(s['canvas'][0]*M)} x {round(s['canvas'][1]*M)} px", font=font(17), fill=INK)
    d.text((x, y + g.height + 50), f"pivot {s['pivot'][0]}, {s['pivot'][1]} u", font=font(17), fill=RED)
    d.text((x, y + g.height + 72), f"guide {GUIDE[slot]['width']} x {GUIDE[slot]['height']} u", font=font(17), fill=INK)
    return g
place('head', x, y0 + 40, 'HEAD CANVAS')
hx, hy = x, y0 + 40
d.text((hx + 8, hy + 8), 'shared by head, hair, hat, beard, glasses.\nHair and hats may use the whole canvas', font=font(16), fill=BLUE)
d.text((hx + 8, hy + (SLOTS['head']['pivot'][1] + 5) * P - 24), 'long hair ends by this line', font=font(16), fill=BLUE)
tx = x + 28 * P + 70
place('torso', tx, y0 + 40, 'TORSO')
d.text((tx, y0 + 40 + SLOTS['torso']['canvas'][1] * P + 98), 'no arms, no armholes', font=font(17), fill=INK)
py = y0 + 40 + SLOTS['torso']['canvas'][1] * P + 200
place('pelvis', tx, py, 'PELVIS')
d.text((tx, py + SLOTS['pelvis']['canvas'][1] * P + 98), 'ends on fabric, no dark\nleg openings. A skirt is a\nlonger pelvis piece', font=font(17), fill=INK)
ax = tx + SLOTS['torso']['canvas'][0] * P + 70
aw = SLOTS['arm-back']['canvas'][0] * P + 50
place('arm-back', ax, y0 + 40, 'ARM back')
place('arm-front', ax + aw, y0 + 40, 'ARM front')
d.text((ax, y0 + 40 + SLOTS['arm-front']['canvas'][1] * P + 98), 'sleeve and hand in one piece,\nhanging 5 degrees out', font=font(17), fill=INK)
lx = ax + 2 * aw + 30
lw_ = SLOTS['leg-back']['canvas'][0] * P + 50
place('leg-back', lx, y0 + 40, 'LEG back')
place('leg-front', lx + lw_, y0 + 40, 'LEG front')
d.text((lx, y0 + 40 + SLOTS['leg-front']['canvas'][1] * P + 98), 'toe points right. Orange box: the shoe zone.\nA shoe is its own piece on the leg canvas\nand covers the whole foot', font=font(17), fill=INK)

kx, ky = 760, 1090
d.text((kx, ky), 'KEY COLORS', font=font(23, True), fill=INK)
d.text((kx, ky + 32), 'Draw these areas in these colors. The game recolors them. Everything else keeps the color it is drawn in.', font=font(19), fill=INK)
for i, (name, hx_) in enumerate(KEY.items()):
    cx = kx + i * 290
    d.rounded_rectangle([cx, ky + 72, cx + 120, ky + 152], radius=12, fill=hx_, outline=INK, width=2)
    d.text((cx + 132, ky + 80), name, font=font(22, True), fill=INK)
    d.text((cx + 132, ky + 110), hx_, font=font(20), fill=INK)
rules = [
    'One flat color per area, the same paper grain as Ro. Shading inside an area stays the same hue.',
    'Inside one piece, no two areas in similar colors.',
    'Head layers for one base head are exported on the head canvas without moving them.',
    'Resize a piece evenly to its guide. Never stretch it in one direction.',
    'Every piece also comes with a picture of the mannequin wearing it.',
]
for i, r in enumerate(rules):
    d.text((kx, ky + 184 + i * 34), f'{i + 1}.  {r}', font=font(19), fill=INK)
d.text((kx, ky + 184 + len(rules) * 34 + 16), 'Numbers as data: crew-kit-template.json.  Guides at 27 px per unit: guides/kit.guide.<slot>@27x.png', font=font(18), fill=BLUE)
sheet.save(os.path.join(out, 'crew-kit-template.png'), optimize=True)
print('wrote', os.path.join(out, 'crew-kit-template.png'), sheet.size, 'guides', GUIDE)
