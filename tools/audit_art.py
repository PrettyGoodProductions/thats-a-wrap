"""Checks delivered or exported art for the problems that bite later, in numbers.

  python3 tools/audit_art.py art                                   a folder of named art (scale from @Nx or the settings file)
  python3 tools/audit_art.py --map tools/batch1.map.json --src <delivered folder>   the raw delivery, before fitting

Per image: size and weight, transparent margin, stray specks, faint haze far from the art, edge matte colour
(dark or bright rings that show on a different background), and px per set unit. Per piece with several states:
how far each state sits from the first one (the "jump" when the game swaps them), in set units and at 2x.
Exit code is 1 when a check fails.
"""
import json, os, re, sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

args = sys.argv[1:]
files = []   # (piece, state, path, px_per_unit)
cfg_dirs = {}   # piece -> folder holding its settings file (art/ or a subfolder like art/_parked/)
if '--map' in args:
    spec = json.load(open(args[args.index('--map') + 1]))
    src = args[args.index('--src') + 1]
    for pid, p in spec['pieces'].items():
        for st, fn in p['files'].items():
            files.append((pid, st, os.path.join(src, fn), p['native']))
else:
    d = args[0]
    for path in sorted(glob.glob(os.path.join(d, '**', '*.png'), recursive=True)):
        m = re.match(r'^(crew\.[a-z0-9]+\.[a-z0-9-]+|hq\.room\.[a-z0-9]+|[a-z0-9]+\.[a-z0-9-]+)(?:\.([a-z0-9_-]+))?(?:@([\d.]+)x)?\.png$', os.path.basename(path))
        if not m: continue
        pid, st, hint = m.group(1), m.group(2) or 'default', m.group(3)
        cfgp = os.path.join(os.path.dirname(path), pid + '.json')
        cfg = json.load(open(cfgp)) if os.path.exists(cfgp) else {}
        scale = cfg.get('scale') or (float(hint) if hint else 3)
        files.append((pid, st, path, scale))
        cfg_dirs[pid] = os.path.dirname(path)

# Pieces whose "states" are separate parts (layers of a stack, strands, a lens in two lengths), each on its own
# canvas by design, so the one-canvas check below does not apply to them
SEPARATE_PARTS = {'art.burger-build', 'art.cheese-pot', 'prop.cheese', 'prop.sauce', 'cam.lens', 'ui.shot-status',
                  # batch 5: different items sharing a piece ID (icons, steam frames, held tools, the clapper stick, bowl and its fill, sparkle frames)
                  'hq.room.edit', 'hq.room.craft', 'hq.room.gear', 'hq.room.kitchen',   # whole opaque pictures swapped in place: outline registration means nothing for them
                  'art.sauce-bowl', 'fx.sparkle', 'fx.steam', 'crew.held', 'ui.action', 'ui.crew-ring', 'ui.dept-icons', 'ui.chaos-icons'}
# Soft pieces (the spotlight mask and the floor shadow) have a gradient edge by design
SOFT = {'fx.spotlight', 'crew.shadow', 'hq.room.edit', 'hq.room.craft', 'hq.room.gear', 'hq.room.kitchen'}   # the rooms are full-bleed pictures
# Seamless tiles run to the edge of their canvas on purpose
TILES = {'set.wall', 'set.floor', 'set.grid', 'ui.panel', 'ui.chip-dark', 'ui.tag', 'ui.crew-card', 'ui.button-paper', 'ui.polaroid',
         'ui.card', 'ui.quest', 'ui.meter-track', 'ui.meter-fill',
         'hq.lobby', 'hq.street', 'hq.sky'}   # batch 6: full-bleed pictures. The rooms are in the next line
TILES |= {f'hq.room.{r}' for r in ('edit', 'craft', 'gear', 'kitchen')}   # the batch 5 nine-slices too   # nine-slices are cropped to the paper

# Nov 5: these darker cut-paper edges are intended (Tomas), so their ring warning is accepted
CUT_EDGE_OK = {('set.flat-3', 'default'), ('ui.button-paper', 'default'), ('crew.held', 'gel-frame'), ('crew.held.gel-frame', 'default'), ('ui.action', 'stick')}

problems, warnings = [], []
info = {}
for pid, st, path, scale in files:
    im = Image.open(path).convert('RGBA'); a = np.array(im); al = a[..., 3].astype(int)
    solid = al >= 250
    dist, idx = ndi.distance_transform_edt(~solid, return_indices=True)
    ys, xs = np.where(al > 8)
    margins = (xs.min(), ys.min(), im.width - 1 - xs.max(), im.height - 1 - ys.max())
    lab, n = ndi.label(al > 8)
    sizes = np.array(ndi.sum(al > 8, lab, range(1, n + 1))) if n else np.array([0])
    specks = int((sizes < 0.0002 * al.size).sum()) if n > 1 else 0
    haze = int(((al > 0) & (al < 8) & (dist > 3)).sum())
    far = int(((al >= 8) & (dist > 4) & ~solid).sum())
    semi = (al > 8) & (al < 250)
    ref = a[idx[0], idx[1], :3].astype(int)
    dev = np.abs(a[..., :3].astype(int) - ref).sum(-1)[semi]
    lum = a[..., :3].astype(float) @ [0.299, 0.587, 0.114]
    reflum = ref @ [0.299, 0.587, 0.114]
    ring = float(np.median((lum - reflum)[semi])) if semi.any() else 0   # < -25 dark ring, > 25 bright ring
    kb = os.path.getsize(path) / 1024
    info[(pid, st)] = dict(al=al > 128, scale=scale)
    flags = []
    soft = pid in SOFT   # a soft glow or shadow fades out by design: no hard edge, so no ring or far-pixel checks
    if specks: flags.append(f'{specks} stray speck(s)')
    if far and not soft: flags.append(f'{far} faint px far from the art')
    if haze > 0.01 * al.size: flags.append(f'{haze} haze px')
    if abs(ring) > 25 and not soft and (pid, st) not in CUT_EDGE_OK: flags.append(f'edge ring {ring:+.0f} luminance')
    if min(margins) < 1 and pid not in TILES: flags.append('art touches the canvas edge (clipped?)')
    label = f'{pid}.{st}' if st != 'default' else pid
    print(f'{label:28s} {im.width:5d}x{im.height:<5d} {scale:6.2f}px/u  {im.width/scale:6.1f}x{im.height/scale:<5.1f}u  {kb:6.0f} KB  margin(px) {tuple(int(m) for m in margins)}  specks {specks} far {far} haze {haze} ring {ring:+.0f}' + ('  <-- ' + '; '.join(flags) if flags else ''))
    for fl in flags:
        (warnings if 'speck' in fl or 'haze' in fl or 'far' in fl else problems).append(f'{label}: {fl}')

# State registration: how far each state is from the first one
by = {}
for (pid, st), v in info.items(): by.setdefault(pid, {})[st] = v
print()
for pid, sts in by.items():
    names = sorted(sts)
    if len(names) < 2 or pid in SEPARATE_PARTS: continue
    ref_name = 'off' if 'off' in names else names[0]
    ref = sts[ref_name]['al']
    for st in names:
        if st == ref_name: continue
        b = sts[st]['al']
        if b.shape != ref.shape:
            problems.append(f'{pid}: {st} is {b.shape[::-1]} but {ref_name} is {ref.shape[::-1]}, states must share one canvas'); continue
        best = (0, 0, 0)
        for dy in range(-30, 31, 2):
            for dx in range(-60, 61, 2):
                s = np.roll(np.roll(b, dy, 0), dx, 1); iou = (ref & s).sum() / (ref | s).sum()
                if iou > best[0]: best = (iou, dx, dy)
        iou, dx, dy = best
        for dy2 in range(dy - 1, dy + 2):
            for dx2 in range(dx - 1, dx + 2):
                s = np.roll(np.roll(b, dy2, 0), dx2, 1); i2 = (ref & s).sum() / (ref | s).sum()
                if i2 > best[0]: best = (i2, dx2, dy2)
        iou, dx, dy = best
        sc = sts[st]['scale']
        # The game can nudge a state with "offset" in <piece>.json. Count what is left after that nudge.
        cfgp = os.path.join(cfg_dirs.get(pid, args[0]), pid + '.json') if '--map' not in args else None
        cfg = json.load(open(cfgp)) if cfgp and os.path.exists(cfgp) else {}
        sign = -1 if cfg.get('flip') else 1
        off = ((cfg.get('states') or {}).get(st) or {}).get('offset') or [0, 0]
        rx, ry = sign * dx / sc - off[0], dy / sc - off[1]
        u = max(abs(rx), abs(ry))
        extra = f', {off[0]:+.2f},{off[1]:+.2f} already applied by settings, {rx:+.2f},{ry:+.2f} left' if off != [0, 0] else ''
        print(f'{pid}: {st} vs {ref_name}: shift {dx:+d},{dy:+d}px = {dx/sc:+.2f},{dy/sc:+.2f} units{extra} ({u*2.4:.2f} device px left at 2.4 px/unit), outline overlap {iou:.3f}')
        if u > 0.2: warnings.append(f'{pid}: {st} is {u:.2f} units off {ref_name} (settings offset can correct it, or re-export on the same canvas)')

print()
for w in warnings: print('WARN', w)
for p in problems: print('FAIL', p)
print('PASS' if not problems else 'FAIL')
sys.exit(1 if problems else 0)
