"""Builds tools/batch3.map.json from the approved design masters (Thats-A-Wrap-Approved-Assets-01.zip).

  python3 tools/make_batch3_map.py <unzipped folder with masters/> tools/batch3.map.json

The masters are design approvals, not exports: every one has its own canvas and its own px per set unit. This
script measures each master (art bounds from alpha, pole centers, the camera's lens mount ring, the lens flange,
the platform lid, the pot opening) and writes the fit: px per set unit (`native`), pivot, named points and
per-state settings. Then fit and audit as usual:

  python3 tools/prep_art.py tools/batch3.map.json <unzipped folder>/masters art
  python3 tools/audit_art.py art

Rules of fit (Asset-Manifest.md sizes are the target; where the art's proportions differ from the manifest,
the dimension that carries the layout wins, and the doc says which):
  platform   front face + lid depth = 72 units (manifest 56 + 16), pivot bottom center, `contact` = lid centroid
  stand      pole top to wheels = 126 units         fill light  = 110 units tall
  sweep      108 wide     tube 118 wide     track 126 wide     frame marks 70 wide
  camera     90 tall, flipped to face the burger. Lens flange outer ring = the camera's mount ring, so the
             standard and macro lenses share one physical size (each has its own px per unit)
  burger     50 wide (hero). Cart stack = 0.6 x the hero's layer widths and offsets, so the burger does not
             change size when it leaves the cart
  cheese     base 50 wide, top bun 46 wide, strands about 5 wide (stretched in height by the game)
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
M = os.path.join(src, 'masters')


def load(rel):
    return np.array(Image.open(os.path.join(M, rel)).convert('RGBA')).astype(int)


def solid_bbox(a, thr=128, min_frac=0.002):
    """Art bounds from alpha, ignoring specks."""
    m = a[..., 3] >= thr
    lab, n = ndi.label(m)
    if n > 1:
        sz = ndi.sum(m, lab, range(1, n + 1))
        keep = [i + 1 for i in range(n) if sz[i] >= min_frac * sz.max()]
        m = np.isin(lab, keep)
    ys, xs = np.where(m)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1, m


def rnd(v, n=1):
    return round(float(v), n)


pieces = {}


def add(pid, target, native, pivot, files, settings=None, points=None):
    p = {'native': rnd(native, 3), 'target': target, 'pivot': [rnd(pivot[0]), rnd(pivot[1])], 'files': files}
    if settings: p['settings'] = settings
    if points: p['points'] = {k: [rnd(v[0]), rnd(v[1])] for k, v in points.items()}
    pieces[pid] = p


def box(rel):
    a = load(rel)
    x0, y0, x1, y1, m = solid_bbox(a)
    return a, x0, y0, x1, y1, m


# ---- Grip ----
a, x0, y0, x1, y1, m = box('grip/grip.platform.master.png')
lid = (a[..., 3] > 200) & (a[..., 0] > 225) & (a[..., 1] > 135) & (a[..., 2] < 140) & (a[..., 1] < 200)
lab, n = ndi.label(lid)
ids, cnt = np.unique(lab[lab > 0], return_counts=True)
ys, xs = np.where(lab == ids[np.argmax(cnt)])
native = (y1 - y0) / 72.0            # front face 56 + lid depth 16
add('grip.platform', 6, native, ((x0 + x1) / 2, y1), {'default': 'grip/grip.platform.master.png'},
    points={'contact': (xs.mean(), ys.mean())})

a, x0, y0, x1, y1, m = box('grip/grip.sweep.master.png')
add('grip.sweep', 6, (x1 - x0) / 108.0, ((x0 + x1) / 2, y0), {'default': 'grip/grip.sweep.master.png'}, settings={'shadow': False})
a, x0, y0, x1, y1, m = box('grip/grip.sweep-tube.master.png')
add('grip.sweep-tube', 6, (x1 - x0) / 118.0, ((x0 + x1) / 2, (y0 + y1) / 2), {'default': 'grip/grip.sweep-tube.master.png'})

# ---- Electric ----
def pole_x(a, y0, y1):
    m = a[y0 + 120:y0 + 420, :, 3] >= 128
    return np.where(m.any(0))[0].mean()

a, x0, y0, x1, y1, m = box('elec/elec.keylight-stand.master.png')
add('elec.keylight-stand', 6, (y1 - y0) / 126.0, (pole_x(a, y0, y1), y1), {'default': 'elec/elec.keylight-stand.master.png'})
a, x0, y0, x1, y1, m = box('elec/elec.fill.master.png')
# the manifest draws lights facing right, toward the stage; the fill stands right of the burger, so it is flipped in settings
add('elec.fill', 6, (y1 - y0) / 110.0, (pole_x(a, y0, y1), y1), {'default': 'elec/elec.fill.master.png'}, settings={'flip': True})

# ---- Camera ----
a, x0, y0, x1, y1, m = box('cam/cam.track.master.png')
add('cam.track', 6, (x1 - x0) / 126.0, (x0, y0), {'default': 'cam/cam.track.master.png'})
a, x0, y0, x1, y1, m = box('cam/cam.frame-marks.master.png')
add('cam.frame-marks', 6, (x1 - x0) / 70.0, ((x0 + x1) / 2, (y0 + y1) / 2), {'default': 'cam/cam.frame-marks.master.png'})

a, x0, y0, x1, y1, m = box('cam/cam.camera.lensless.master.png')
cam_native = (y1 - y0) / 90.0
base = a[-120:, :, 3] >= 128
cols = np.where(base.any(0))[0]
base_x = (cols.min() + cols.max()) / 2
# mount ring: the beige face-on ring on the front plate
R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
beige = (A > 200) & (R > 140) & (R < 225) & (abs(R - G) < 14) & (abs(G - B) < 24)
lab, n = ndi.label(beige)
reg = lab[300:560, 560:800]
ids, cnt = np.unique(reg[reg > 0], return_counts=True)
rm = lab == ids[np.argmax(cnt)]
ys, xs = np.where(rm)
ring = ((xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2, ys.max() + 1 - ys.min())
add('cam.camera', 6, cam_native, (base_x, y1), {'default': 'cam/cam.camera.lensless.master.png'},
    settings={'flip': True}, points={'mount': (ring[0], ring[1])})
ring_units = ring[2] / cam_native          # outer ring height in set units
mount_dx = -(ring[0] - base_x) / cam_native    # flipped: the mount is on the left of the dolly
mount_dy = (ring[1] - y1) / cam_native
LENS_ANCHOR = (289.0, 138.0)                    # slots.js
CAM_ANCHOR = (304.0, 210.0)
lens_off = (CAM_ANCHOR[0] + mount_dx - LENS_ANCHOR[0], CAM_ANCHOR[1] + mount_dy - LENS_ANCHOR[1])

lens_files, lens_state = {}, {}
for nm in ('standard', 'macro'):
    rel = f'cam/cam.lens.{nm}.master.png'
    a, x0, y0, x1, y1, m = box(rel)
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    bg = (A > 200) & (R > 130) & (abs(R - G) < 14) & (abs(G - B) < 24)
    lab, n = ndi.label(bg)
    best = None
    for i in np.unique(lab[lab > 0]):
        mm = lab == i
        if mm.sum() > 20000:
            yy, xx = np.where(mm)
            if xx.min() < a.shape[1] * 0.25 and (best is None or mm.sum() > best[0]): best = (mm.sum(), xx.min(), xx.max() + 1)
    col = int(best[1] + 0.4 * (best[2] - best[1]))
    cy = np.where(A[:, col] >= 128)[0]
    flange_h = cy.max() + 1 - cy.min()                    # the flange ellipse is the tallest thing at its own column
    lens_state[nm] = dict(native=flange_h / ring_units, pivot=(col, (cy.min() + cy.max() + 1) / 2), file=rel)
for nm, v in lens_state.items():
    lens_files[nm] = {'file': v['file'], 'native': rnd(v['native'], 3), 'pivot': [rnd(v['pivot'][0]), rnd(v['pivot'][1])]}
add('cam.lens', 6, lens_state['standard']['native'], lens_state['standard']['pivot'], lens_files,
    settings={'flip': True, 'offset': [rnd(lens_off[0], 2), rnd(lens_off[1], 2)]})

# ---- Props ----
a, hx0, hy0, hx1, hy1, m = box('prop/prop.burger.hero.master.png')
hero_native = (hx1 - hx0) / 50.0
add('prop.burger', 6, hero_native, ((hx0 + hx1) / 2, hy1), {'default': 'prop/prop.burger.hero.master.png'},
    points={'top': ((hx0 + hx1) / 2, hy0)})       # dome top: where the sauce drip lands

a, x0, y0, x1, y1, m = box('prop/prop.cheese.base.master.png')
base_n = (x1 - x0) / 50.0
files = {'base': {'file': 'prop/prop.cheese.base.master.png', 'native': rnd(base_n, 3), 'pivot': [rnd((x0 + x1) / 2), y1], 'points': {'top': [rnd((x0 + x1) / 2), y0]}}}
a, x0, y0, x1, y1, m = box('prop/prop.cheese.top-bun.master.png')
files['top-bun'] = {'file': 'prop/prop.cheese.top-bun.master.png', 'native': rnd((x1 - x0) / 46.0, 3), 'pivot': [rnd((x0 + x1) / 2), y1]}
for i in (1, 2, 3):
    rel = f'prop/prop.cheese.strand-0{i}.master.png'
    a = load(rel)
    if i == 3:
        # strand 03 arrived with a wide translucent haze around it: keep the strand and a thin margin only
        a = np.array(Image.open(os.path.join(M, rel)).convert('RGBA')).astype(int)
        al = a[..., 3]
        core = ndi.label(al >= 64)[0]
        ids, cnt = np.unique(core[core > 0], return_counts=True)
        mm = ndi.binary_dilation(core == ids[np.argmax(cnt)], iterations=10)
        ys, xs = np.where(mm & (al >= 8))
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        files['strand-03'] = {'file': rel, 'native': 65.0, 'pivot': [rnd((x0 + x1) / 2), rnd(y0 + 8)], 'mask': 'core'}
    else:
        x0, y0, x1, y1, m = solid_bbox(a)
        files[f'strand-0{i}'] = {'file': rel, 'native': 65.0, 'pivot': [rnd((x0 + x1) / 2), y0]}
add('prop.cheese', 6, base_n, files['base']['pivot'], files)

a, x0, y0, x1, y1, m = box('prop/prop.sauce.drip.master.png')
files = {'drip': {'file': 'prop/prop.sauce.drip.master.png', 'native': rnd((x1 - x0) / 26.0, 3), 'pivot': [rnd((x0 + x1) / 2), y0]}}
a, x0, y0, x1, y1, m = box('prop/prop.sauce.stream.master.png')
files['stream'] = {'file': 'prop/prop.sauce.stream.master.png', 'native': rnd((y1 - y0) / 16.0, 3), 'pivot': [rnd((x0 + x1) / 2), y0]}
add('prop.sauce', 6, files['drip']['native'], files['drip']['pivot'], files)

# ---- Art department ----
# Burger stack on the cart = 0.6 x the hero. Widths are the hero's layer widths measured on the delivered hero art
# (bun 43.1, patty 42.4, cheese 46.6, lettuce 49.5, top bun 44.5 units at the hero's 50 wide), times 0.6.
CART_K = 0.6
HERO_W = {'bottom-bun': 43.1, 'patty': 42.4, 'cheese': 46.6, 'lettuce': 49.5, 'top-bun': 44.5}
layers = {}
for nm, hw in HERO_W.items():
    rel = f'art/art.burger-build.{nm}.master.png'
    a, x0, y0, x1, y1, m = box(rel)
    layers[nm] = {'file': rel, 'native': rnd((x1 - x0) / (hw * CART_K), 3), 'pivot': [rnd((x0 + x1) / 2), y1]}
add('art.burger-build', 6, layers['bottom-bun']['native'], layers['bottom-bun']['pivot'], layers)

a, x0, y0, x1, y1, m = box('art/art.cheese-pot.empty.master.png')
R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
dark = (A > 200) & (R < 85) & (G < 85) & (B < 85)
lab, n = ndi.label(dark)
hole = lab == lab[447, 654]
ys, xs = np.where(hole)
hx0_, hy0_, hx1_, hy1_ = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
pot_n = (x1 - x0) / 18.0
pot_px = ((hx0_ + hx1_) / 2, y1)
hole_units = (hx1_ - hx0_) / pot_n
files = {'empty': {'file': 'art/art.cheese-pot.empty.master.png', 'native': rnd(pot_n, 3), 'pivot': [rnd(pot_px[0]), rnd(pot_px[1])]}}
a2, fx0, fy0, fx1, fy1, m = box('art/art.cheese-pot.fill.master.png')
files['fill'] = {'file': 'art/art.cheese-pot.fill.master.png', 'native': rnd((fx1 - fx0) / hole_units, 3), 'pivot': [rnd((fx0 + fx1) / 2), rnd((fy0 + fy1) / 2)]}
a3, sx0, sy0, sx1, sy1, m = box('art/art.cheese-pot.steam.frame-01.master.png')
# the delivered name is art.cheese-pot.steam.frame-01: the game's file names allow one state segment, so it exports as steam-1
files['steam-1'] = {'file': 'art/art.cheese-pot.steam.frame-01.master.png', 'native': rnd((sy1 - sy0) / 14.0, 3), 'pivot': [rnd((sx0 + sx1) / 2), sy1]}
add('art.cheese-pot', 6, pot_n, pot_px, files,
    points={'holeL': (hx0_, (hy0_ + hy1_) / 2), 'holeR': (hx1_, (hy0_ + hy1_) / 2), 'holeT': ((hx0_ + hx1_) / 2, hy0_), 'holeB': ((hx0_ + hx1_) / 2, hy1_)})

spec = {
    '_note': 'Batch 3 (Nov 4): set and prop masters from Thats-A-Wrap-Approved-Assets-01.zip. Generated by tools/make_batch3_map.py, which measures each master. native = px per set unit in the master, target = px per set unit exported. A state entry may carry its own native, pivot and mask (core = drop the translucent haze around the piece). Crew masters in the zip are assembled figures, not parts, and are not part of this map.',
    'info': {'camera_ring_units': rnd(ring_units, 2), 'camera_mount_offset_for_lens': [rnd(lens_off[0], 2), rnd(lens_off[1], 2)], 'pot_hole_units': rnd(hole_units, 2), 'hero_native': rnd(hero_native, 3)},
    'pieces': pieces,
}
json.dump(spec, open(out, 'w'), indent=2)
open(out, 'a').write('\n')
print('wrote', out)
for pid, p in pieces.items():
    print(f"{pid:22s} native {p['native']:8.3f}  pivot {p['pivot']}  states {list(p['files'])}")
print(spec['info'])
