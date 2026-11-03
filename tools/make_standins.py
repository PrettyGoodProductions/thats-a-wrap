"""Make rough stand-in art for testing the asset loader end to end.

  python3 tools/make_standins.py            writes tests/fixtures/art/

These are NOT game art. They follow the Asset Manifest names and sizes (3x PNGs on transparent backgrounds)
with loud magenta outlines so it is obvious on screen which pieces came from files. Head and torso are drawn
near-white because the engine tints them (skin tone, department color).
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'tests/fixtures/art'
MAG = (255, 0, 200, 255)
INK = (34, 38, 43, 255)

def canvas(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

def save(im, name, sub=''):
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, name))

def label(d, xy, text, fill=INK):
    d.text(xy, text, fill=fill, font=ImageFont.load_default())

def write_json(name, obj, sub=''):
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, name), 'w') as f:
        json.dump(obj, f, indent=2)
        f.write('\n')

# --- grip.platform: 112 x 60 units. Pivot is the default (bottom center), so no settings file ---
im, d = canvas(336, 180)
d.polygon([(24, 0), (336 - 0, 0), (312, 40), (0, 40)], fill=(229, 138, 112, 255), outline=MAG)
d.rectangle([0, 40, 312, 179], fill=(214, 112, 90, 255), outline=MAG, width=3)
d.polygon([(312, 40), (336, 0), (336, 140), (312, 179)], fill=(184, 88, 70, 255), outline=MAG)
label(d, (110, 100), 'STAND-IN PLATFORM')
save(im, 'grip.platform@3x.png')

# --- elec.keylight-head: 56 x 34 units, three states, pivot dot at the yoke (84, 51) ---
def keyhead(face, glow=False, sparks=False):
    im, d = canvas(168, 102)
    if glow:
        for r, a in ((60, 60), (46, 90)):
            d.ellipse([84 - r, 94 - r // 2, 84 + r, 94 + r // 2], fill=(255, 231, 163, a))
    d.polygon([(30, 6), (138, 6), (162, 78), (6, 78)], fill=(244, 238, 223, 255), outline=MAG)
    d.rectangle([6, 78, 162, 96], fill=face, outline=MAG, width=2)
    if sparks:
        for a, b in (((120, 30), (140, 14)), ((140, 14), (134, 36)), ((40, 28), (22, 12)), ((22, 12), (30, 34))):
            d.line([a, b], fill=(216, 107, 86, 255), width=4)
    d.ellipse([78, 45, 90, 57], fill=INK, outline=MAG, width=2)  # the pivot, so rotation is easy to see
    return im
save(keyhead((122, 116, 104, 255)), 'elec.keylight-head.off@3x.png')
save(keyhead((255, 231, 163, 255), glow=True), 'elec.keylight-head.on@3x.png')
save(keyhead((58, 54, 49, 255), sparks=True), 'elec.keylight-head.dead@3x.png')
write_json('elec.keylight-head.json', {
    'note': 'stand-in. pivot is the yoke, in the image pixels. dead gets a nudge to prove per-state settings work',
    'pivot': [84, 51],
    'states': {'dead': {'offset': [0, 1]}},
})

# --- art.burger-build: five layers, 26 units wide (78 px), pivot bottom center ---
def layer(name, w, h, color, wave=False):
    im, d = canvas(w, h)
    if wave:
        d.rectangle([0, 6, w - 1, h - 1], fill=color, outline=MAG)
        for x in range(0, w, 12):
            d.ellipse([x, 0, x + 14, 12], fill=color, outline=MAG)
    elif name == 'top-bun':
        d.pieslice([0, 0, w - 1, h * 2 - 1], 180, 360, fill=color, outline=MAG, width=2)
        d.rectangle([0, h - 3, w - 1, h - 1], fill=color)
    else:
        d.rounded_rectangle([0, 0, w - 1, h - 1], radius=min(10, h // 2), fill=color, outline=MAG, width=2)
    save(im, f'art.burger-build.{name}@3x.png')
layer('bottom-bun', 78, 24, (217, 150, 63, 255))
layer('patty', 78, 21, (91, 58, 41, 255))
layer('cheese', 80, 15, (242, 193, 78, 255))
layer('lettuce', 82, 16, (127, 176, 105, 255), wave=True)
layer('top-bun', 78, 40, (227, 168, 90, 255))
write_json('art.burger-build.json', {
    'note': 'stand-in. layers stack with the engine defaults, top-bun gets a small nudge to prove offsets work',
    'states': {'top-bun': {'offset': [0, -0.4]}},
})

# --- crew puppet: modular parts at 3x, near-white where the engine tints ---
W = (250, 250, 250, 255)
S = 'crew'
im, d = canvas(52, 52); d.ellipse([1, 1, 50, 50], fill=W, outline=MAG, width=2); save(im, 'crew.head@3x.png', S)
im, d = canvas(60, 39); d.rounded_rectangle([0, 0, 59, 38], radius=8, fill=W, outline=MAG, width=2); save(im, 'crew.torso@3x.png', S)
im, d = canvas(14, 39); d.rounded_rectangle([0, 0, 13, 38], radius=6, fill=(225, 225, 225, 255), outline=MAG, width=2); save(im, 'crew.arm-back@3x.png', S)
im, d = canvas(14, 39); d.rounded_rectangle([0, 0, 13, 38], radius=6, fill=(240, 240, 240, 255), outline=MAG, width=2); save(im, 'crew.arm-front@3x.png', S)
# work pose for the front arm: raised and angled, orange so the pose swap is obvious
im, d = canvas(40, 40)
d.polygon([(0, 0), (12, 0), (40, 26), (30, 36)], fill=(255, 150, 60, 255), outline=MAG)
save(im, 'crew.arm-front.work@3x.png', S)
im, d = canvas(15, 39); d.rounded_rectangle([0, 0, 14, 38], radius=5, fill=(47, 52, 64, 255), outline=MAG, width=2); save(im, 'crew.leg-back@3x.png', S)
im, d = canvas(15, 39); d.rounded_rectangle([0, 0, 14, 38], radius=5, fill=(62, 68, 82, 255), outline=MAG, width=2); save(im, 'crew.leg-front@3x.png', S)
# hair and hats: state is the look name
im, d = canvas(54, 30); d.pieslice([0, 0, 53, 58], 180, 360, fill=(154, 166, 214, 255), outline=MAG, width=2); d.rectangle([30, 22, 53, 29], fill=(127, 139, 192, 255), outline=MAG); save(im, 'crew.hair.cap@3x.png', S)
im, d = canvas(54, 30); d.pieslice([0, 0, 53, 58], 180, 360, fill=(120, 80, 50, 255), outline=MAG, width=2); save(im, 'crew.hair.default@3x.png', S)
# face extras, all on the head's 52 x 52 canvas so they register with it
im, d = canvas(52, 52); d.ellipse([12, 14, 18, 20], fill=INK); d.ellipse([33, 14, 39, 20], fill=INK); save(im, 'crew.face.eyes@3x.png', S)
im, d = canvas(52, 52); d.ellipse([23, 22, 33, 32], fill=(216, 107, 86, 255), outline=MAG); save(im, 'crew.face.nose@3x.png', S)
im, d = canvas(52, 52); d.ellipse([6, 8, 24, 26], outline=INK, width=2); d.ellipse([28, 8, 46, 26], outline=INK, width=2); d.line([24, 16, 28, 16], fill=INK, width=2); save(im, 'crew.face.glasses@3x.png', S)
im, d = canvas(52, 52); d.pieslice([4, 20, 48, 62], 0, 180, fill=(70, 50, 36, 255), outline=MAG); save(im, 'crew.face.beard@3x.png', S)
im, d = canvas(52, 52); d.rectangle([14, 32, 38, 36], fill=(70, 50, 36, 255)); save(im, 'crew.face.mustache@3x.png', S)
write_json('crew.head.json', {'note': 'stand-in. near-white art, so the engine tints it with each crew member skin tone', 'tint': 'skin'}, S)
write_json('crew.arm-front.json', {
    'note': 'stand-in. both arms hang from the shoulder, the work pose is a different shape with its own pivot',
    'pivot': 'top-center',
    'states': {'work': {'pivot': [4, 2]}},
}, S)
print('wrote stand-ins to', OUT)
