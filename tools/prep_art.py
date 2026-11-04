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

def core_mask(im, keep_alpha=64, grow=10):
    """For a delivery with a wide translucent haze around the art: keep only the main piece plus a thin
    antialiasing margin (grow px), and drop everything else. Used when a piece lists "mask": "core"."""
    a = np.array(im)
    al = a[..., 3]
    lab, n = ndi.label(al >= keep_alpha)
    if n:
        sizes = ndi.sum(al >= keep_alpha, lab, range(1, n + 1))
        main = lab == (1 + int(np.argmax(sizes)))
        near = ndi.binary_dilation(main, iterations=grow)
        al[~near] = 0
    return Image.fromarray(a, 'RGBA')

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
    state_cfg = {}
    for state, ent in p['files'].items():
        fname = ent['file'] if isinstance(ent, dict) else ent
        ent = ent if isinstance(ent, dict) else {}
        kk = p['target'] / ent['native'] if ent.get('native') else k   # a state may need its own scale (same piece, different render size)
        im = Image.open(os.path.join(src_dir, fname)).convert('RGBA')
        if ent.get('mask') == 'core': im = core_mask(im)
        im = clean_alpha(im)
        if ent.get('native') or ent.get('pivot'):
            state_cfg[state] = {}
            if ent.get('pivot'): state_cfg[state]['pivot'] = [round(ent['pivot'][0] * kk, 1), round(ent['pivot'][1] * kk, 1)]
            if ent.get('native'): state_cfg[state]['scale'] = p['target']
            if ent.get('points'): state_cfg[state]['points'] = {n: [round(v[0] * kk, 1), round(v[1] * kk, 1)] for n, v in ent['points'].items()}
        w, h = round(im.width * kk), round(im.height * kk)
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
    if state_cfg:
        cfg['states'] = {**cfg.get('states', {}), **{st: {**cfg.get('states', {}).get(st, {}), **v} for st, v in state_cfg.items()}}
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
