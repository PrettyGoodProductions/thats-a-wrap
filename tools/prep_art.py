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

map_path, src_dir, base_out = sys.argv[1:4]
spec = json.load(open(map_path))
os.makedirs(base_out, exist_ok=True)

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

def make_seamless(im):
    """Make a texture tile wrap without a seam: blend the image with a copy shifted by half a tile, weighted so the
    edges show only the shifted copy's middle (which is continuous across the wrap). Paper grain hides the blend."""
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    wx = np.sin(np.linspace(0, np.pi, w, endpoint=False)) ** 2
    wy = np.sin(np.linspace(0, np.pi, h, endpoint=False)) ** 2
    m = (wy[:, None] * wx[None, :])[..., None]
    shifted = np.roll(a, (h // 2, w // 2), axis=(0, 1))
    return Image.fromarray(np.clip(a * m + shifted * (1 - m), 0, 255).astype(np.uint8), im.mode)

def resize_tile(im, w, h):
    """Resize a wrapping tile so the resample also wraps: filter a 3 x 3 repeat and keep the middle"""
    t = Image.new(im.mode, (im.width * 3, im.height * 3))
    for i in range(3):
        for j in range(3):
            t.paste(im, (i * im.width, j * im.height))
    t = t.resize((w * 3, h * 3), Image.LANCZOS)
    return t.crop((w, h, 2 * w, 2 * h))

def decontaminate(im, floor=0):
    """Remove a colored halo: drop faint alpha (under floor) and give every soft edge pixel the color of the nearest solid one"""
    a = np.array(im)
    al = a[..., 3]
    if floor: al[al < floor] = 0
    solid = al >= 250
    if solid.any():
        _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
        soft = (al > 0) & ~solid
        a[..., :3][soft] = a[..., :3][iy[soft], ix[soft]]
    return Image.fromarray(a, 'RGBA')

def recolor(im, hexcolor):
    """Tint neutral paper to a target color: scale each channel so the paper's median color becomes the target, which keeps the grain"""
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    mid = a[h // 5: 4 * h // 5, w // 5: 4 * w // 5]
    solid = mid[mid[..., 3] >= 250][:, :3]
    med = np.median(solid, axis=0)
    tgt = np.array([int(hexcolor[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)
    a[..., :3] = np.clip(a[..., :3] * (tgt / med), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

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
    # "dir": "_parked" puts a piece (and its settings file) in a subfolder; the packer skips folders starting with _
    out_dir = os.path.join(base_out, p['dir']) if p.get('dir') else base_out
    os.makedirs(out_dir, exist_ok=True)
    k = p['target'] / p['native']
    sizes = {}
    state_cfg = {}
    for state, ent in p['files'].items():
        fname = ent['file'] if isinstance(ent, dict) else ent
        ent = ent if isinstance(ent, dict) else {}
        kk = p['target'] / ent['native'] if ent.get('native') else k   # a state may need its own scale (same piece, different render size)
        im = Image.open(os.path.join(src_dir, fname)).convert('RGBA')
        if ent.get('mask') == 'core': im = core_mask(im)
        if ent.get('crop'): im = im.crop(tuple(ent['crop']))   # trim empty canvas, the pivot in the map is already relative to the crop
        if ent.get('recolor'): im = recolor(im, ent['recolor'])
        if p.get('seamless'): im = make_seamless(im)
        if ent.get('decontaminate'): im = decontaminate(im, ent.get('alpha_floor', 40))
        im = clean_alpha(im)
        if ent.get('native') or ent.get('pivot'):
            state_cfg[state] = {}
            if ent.get('pivot'): state_cfg[state]['pivot'] = [round(ent['pivot'][0] * kk, 1), round(ent['pivot'][1] * kk, 1)]
            if ent.get('native'): state_cfg[state]['scale'] = p['target']
            if ent.get('points'): state_cfg[state]['points'] = {n: [round(v[0] * kk, 1), round(v[1] * kk, 1)] for n, v in ent['points'].items()}
        w, h = round(im.width * kk), round(im.height * kk)
        out = clean_alpha(resize_tile(im, w, h) if p.get('seamless') else im.resize((w, h), Image.LANCZOS))   # Pillow premultiplies RGBA for resizing; resampling brings back faint alpha and specks, so clean again
        name = pid + ('' if state == 'default' else '.' + state) + '@%gx.png' % p['target']
        if p.get('quantize'):
            # Flat paper with fine grain: a 128 color palette with no dithering keeps the grain and cuts the PNG by two thirds
            q = out.quantize(colors=p['quantize'], method=Image.FASTOCTREE, dither=Image.NONE)   # keeps alpha
            q.save(os.path.join(out_dir, name), optimize=True)
        else:
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
    if p.get('slice'):
        # Nine-slice: insets in master px (top, right, bottom, left) become export px for border-image-slice and CSS px for its width
        cfg['nine'] = {'slice': [round(v * k) for v in p['slice']], 'width': [round(v / p['native'], 2) for v in p['slice']], 'fill': p.get('fill', True)}
    if state_cfg:
        cfg['states'] = {**cfg.get('states', {}), **{st: {**cfg.get('states', {}).get(st, {}), **v} for st, v in state_cfg.items()}}
    json.dump(cfg, open(os.path.join(out_dir, pid + '.json'), 'w'), indent=2)
    open(os.path.join(out_dir, pid + '.json'), 'a').write('\n')
    report.append((pid, sizes))

for cid, c in spec.get('characters', {}).items():
    json.dump(c, open(os.path.join(base_out, cid + '.json'), 'w'), indent=2)
    open(os.path.join(base_out, cid + '.json'), 'a').write('\n')

tot = 0
for pid, sizes in report:
    for st, (w, h, b) in sizes.items():
        tot += b
        print(f'{pid}.{st}: {w}x{h}px, {b/1024:.0f} KB')
print(f'total {tot/1024:.0f} KB')
