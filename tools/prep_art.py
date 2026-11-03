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
        out = im.resize((w, h), Image.LANCZOS)   # Pillow premultiplies RGBA for resizing
        name = pid + ('' if state == 'default' else '.' + state) + '@%gx.png' % p['target']
        out.save(os.path.join(out_dir, name), optimize=True)
        sizes[state] = (w, h, os.path.getsize(os.path.join(out_dir, name)))
    cfg = dict(p.get('settings', {}))
    cfg['pivot'] = [round(p['pivot'][0] * k, 1), round(p['pivot'][1] * k, 1)]
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
