"""Fit a delivered art batch to the export spec and name it for the game.

  python3 tools/prep_art.py tools/batch1.map.json <folder with the delivered files> art

For each piece in the map: removes alpha specks, resizes to the target px per set unit (premultiplied, so no
dark or colored halos), writes <id>[.<state>]@<N>x.png, and writes the piece's settings file with the pivot
converted to the exported image's pixels. The delivered files are never modified. Re-run any time.
"""
import json, os, sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

map_path, src_dir, out_dir = sys.argv[1:4]
spec = json.load(open(map_path))
os.makedirs(out_dir, exist_ok=True)

def clean_alpha(im):
    a = np.array(im)
    al = a[..., 3]
    al[al < 8] = 0
    lab, n = ndi.label(al > 0)
    if n > 1:
        sizes = ndi.sum(al > 0, lab, range(1, n + 1))
        keep = sizes >= max(60, 0.002 * sizes.max())   # specks are a few pixels, real parts are thousands
        drop = ~np.isin(lab, [i + 1 for i in range(n) if keep[i]]) & (lab > 0)
        al[drop] = 0
    a[al == 0] = 0
    return Image.fromarray(a, 'RGBA')

report = []
for pid, p in spec['pieces'].items():
    k = p['target'] / p['native']
    sizes = {}
    for state, fname in p['files'].items():
        im = Image.open(os.path.join(src_dir, fname)).convert('RGBA')
        im = clean_alpha(im)
        w, h = round(im.width * k), round(im.height * k)
        out = clean_alpha(im.resize((w, h), Image.LANCZOS))   # Pillow premultiplies RGBA for resizing; resampling brings back faint alpha and specks, so clean again
        name = pid + ('' if state == 'default' else '.' + state) + '@%gx.png' % p['target']
        out.save(os.path.join(out_dir, name), optimize=True)
        sizes[state] = (w, h, os.path.getsize(os.path.join(out_dir, name)))
    cfg = dict(p.get('settings', {}))
    cfg['pivot'] = [round(p['pivot'][0] * k, 1), round(p['pivot'][1] * k, 1)]
    if p.get('points'):
        cfg['points'] = {n: [round(v[0] * k, 1), round(v[1] * k, 1)] for n, v in p['points'].items()}
    if pid.split('.')[-1].startswith('leg-'):
        # Where the sole meets the floor, so the walk can keep the planted boot flat on the ground
        # The bottom outline of the boot, as a few points (image px): the lowest pixel of each column in the
        # bottom 4 set units. The walk rolls the planted boot on this outline, so a rounded heel or toe stays down.
        a = np.array(out)[..., 3] >= 128
        bottom = int(np.where(a.any(1))[0].max())
        cols = [x for x in range(a.shape[1]) if a[:, x].any() and np.where(a[:, x])[0].max() >= bottom - 4 * p['target']]
        pts = [[x, int(np.where(a[:, x])[0].max()) + 1] for x in cols]
        keep = sorted({0, len(pts) - 1, *range(0, len(pts), max(1, len(pts) // 8))})
        cfg['sole'] = [pts[i] for i in keep]
    cfg['scale'] = p['target']
    json.dump(cfg, open(os.path.join(out_dir, pid + '.json'), 'w'), indent=2)
    open(os.path.join(out_dir, pid + '.json'), 'a').write('\n')
    report.append((pid, sizes))

for cid, c in spec.get('characters', {}).items():
    json.dump(c, open(os.path.join(out_dir, cid + '.json'), 'w'), indent=2)
    open(os.path.join(out_dir, cid + '.json'), 'a').write('\n')

tot = 0
for pid, sizes in report:
    for st, (w, h, b) in sizes.items():
        tot += b
        print(f'{pid}.{st}: {w}x{h}px, {b/1024:.0f} KB')
print(f'total {tot/1024:.0f} KB')
