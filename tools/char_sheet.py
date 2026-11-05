"""Lineup of fixed characters, assembled from art/ the way the game's rig does it (idle pose, feet on one floor line).

  python3 tools/char_sheet.py art out.png ro mika theo [--px 8] [--guides]

A quick check of a character's joints and height without opening the game. --guides marks each joint and the
51.8 unit height line. The game is still the reference for animation: this draws the rest pose only.
"""
import json, os, sys
from PIL import Image, ImageDraw

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = {sys.argv[i][2:]: (sys.argv[i + 1] if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--') else True) for i in range(1, len(sys.argv)) if sys.argv[i].startswith('--')}
for v in [v for v in opt.values() if v is not True]:
    if v in args: args.remove(v)
art, out, names = args[0], args[1], args[2:]
R = float(opt.get('px', 8))
ORDER = ['leg-back', 'leg-front', 'pelvis', 'arm-back', 'torso', 'head', 'arm-front']
JOINT = {'head': 'neck', 'torso': 'hips', 'pelvis': 'pelvis', 'arm-front': 'shoulderFront', 'arm-back': 'shoulderBack', 'leg-front': 'hipFront', 'leg-back': 'hipBack'}

def find(stem):
    for ext in ('png', 'webp'):
        for f in os.listdir(art):
            if f.startswith(stem + '@') and f.endswith(ext): return os.path.join(art, f)
    return None

def character(ch):
    cfg = json.load(open(os.path.join(art, f'crew.{ch}.json')))
    W, H = int(40 * R), int(62 * R)
    ox, oy = W // 2, int(58 * R)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    def paste(path, pivot, scale, at):
        im = Image.open(path).convert('RGBA')
        k = R / scale
        im2 = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS) if abs(k - 1) > 1e-6 else im
        cv.alpha_composite(im2, (round(ox + at[0] * R - pivot[0] * k), round(oy + at[1] * R - pivot[1] * k)))
    order = ORDER[:3] + cfg.get('order', {}).get('upper', ORDER[3:])
    holds = cfg.get('holds')
    for role in order:
        path = find(f'crew.{ch}.{role}')
        if not path: continue
        pc = json.load(open(os.path.join(art, f'crew.{ch}.{role}.json')))
        if holds and holds['role'] == role:
            hc = json.load(open(os.path.join(art, 'crew.held.json')))
            paste(find(f"crew.held.{holds['item']}"), hc['states'][holds['item']]['pivot'], hc.get('scale', 6), holds['at'])
        paste(path, pc['pivot'], pc.get('scale', cfg.get('scale', 8)), cfg['joints'][JOINT[role]])
    if opt.get('guides'):
        d = ImageDraw.Draw(cv)
        for n, (x, y) in cfg['joints'].items():
            d.ellipse([ox + x * R - 3, oy + y * R - 3, ox + x * R + 3, oy + y * R + 3], outline=(255, 0, 80, 255), width=2)
        d.line([0, oy - 51.8 * R, W, oy - 51.8 * R], fill=(0, 160, 255, 200))
        d.line([0, oy, W, oy], fill=(0, 160, 255, 200))
    return cv

cells = [character(n) for n in names]
sheet = Image.new('RGB', (sum(c.width for c in cells), cells[0].height), opt.get('bg', '#8C8C8C') if opt.get('bg') is not True else '#8C8C8C')
x = 0
for c in cells:
    sheet.paste(c, (x, 0), c); x += c.width
sheet.save(out)
print(out, sheet.size)
