"""Measures the batch 5 masters (Thats-A-Wrap-Approved-Assets-03.zip, approvals 70 to 132) and writes the batch map.

  python3 -I tools/make_batch5_map.py <unzipped folder>/assets tools/batch5.map.json
  python3 -I tools/prep_art.py tools/batch5.map.json <unzipped folder>/assets art
  python3 -I tools/audit_art.py art && python3 -I tools/audit_art.py art/_parked

(The project calls this zip "art batch 3". The repo already numbers Approved-Assets-01 as batch 3 and 02 as batch 4,
so this is batch 5 here.)

Every number comes from the master's own alpha: the piece's bounding box sets the scale against the size in the
Asset Manifest, and each pivot is read off the art (the pole's clamp, the arm's knuckle, the bottle's clamp tab,
the monitor's screen, the beam's tip). Pieces the game does not use yet carry "dir": "_parked", so they are fitted
and audited but stay out of the page (the packer skips folders that start with an underscore). Moving a piece out of
art/_parked/ is all it takes once it is wired.

Rules of fit (Asset-Manifest.md sizes are the target; the dimension that carries the layout wins):
  flag, pole, fork, bottle, backlight, chair, coffee, monitor     by height or width as noted on each line
  pole       the clamp lands on y 58 (manifest: arm knuckle at (292, 58)), so the arm, fork and bottle stay put
  arm        100 long, drawn with its knuckle on the left, so it is mirrored (`flip`) to reach left from the pole
  beams      pivot on the narrow end (the light face) and the engine stretches the wedge to the burger
  monitor    fitted by width, the screen inset is saved as the named points `screen` and `screen2`
  HQ shell   exported at the master's own 3.6 px per unit (upscaling to 6 would only add weight)
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1:3]
NAMES = {int(f[:3]): f for f in sorted(os.listdir(src)) if f[:3].isdigit()}   # approval number -> file name


def fname(n):
    return NAMES[n]


def load(n):
    a = np.array(Image.open(os.path.join(src, fname(n))).convert('RGBA'))
    return a


def bbox(a, t=128):
    ys, xs = np.where(a[..., 3] > t)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def lum(a):
    return a[..., :3].astype(float) @ [.299, .587, .114]


def blob(mask, pick='largest'):
    lab, n = ndi.label(mask)
    sz = ndi.sum(mask, lab, range(1, n + 1))
    i = int(np.argmax(sz)) + 1
    ys, xs = np.where(lab == i)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, xs.mean(), ys.mean()


pieces = {}
info = {}


def add(pid, files, native, pivot, target=6, **extra):
    p = {'native': round(float(native), 3), 'target': target, 'pivot': [round(float(pivot[0]), 1), round(float(pivot[1]), 1)], 'files': files}
    p.update(extra)
    pieces[pid] = p
    return p


def crop_for(boxes, native, target, w_im, h_im, quantum=1):
    """One crop for every state of a piece (so the states stay registered): the union of the art's boxes plus about 5 export px of margin"""
    m = int(np.ceil(5 * native / target)) + 1
    x0 = min(b[0] for b in boxes) - m
    y0 = min(b[1] for b in boxes) - m
    x1 = max(b[2] for b in boxes) + m
    y1 = max(b[3] for b in boxes) + m
    return [int(x0), int(y0), int(x1), int(y1)]   # may reach past the canvas: the crop then pads with transparent pixels


def fit(pid, n, size, by='w', target=6, pivot='bottom-left', flip=False, points=None, extra_files=None, **extra):
    """One master fitted to `size` set units by its width or height. pivot: a name, or an (x, y) in master px"""
    a = load(n)
    x0, y0, x1, y1 = bbox(a)
    native = ((x1 - x0) if by == 'w' else (y1 - y0)) / size
    names = {'top-left': (x0, y0), 'top-center': ((x0 + x1) / 2, y0), 'bottom-center': ((x0 + x1) / 2, y1), 'bottom-left': (x0, y1),
             'center': ((x0 + x1) / 2, (y0 + y1) / 2), 'left-center': (x0, (y0 + y1) / 2)}
    pv = names[pivot] if isinstance(pivot, str) else pivot
    cr = crop_for([(x0, y0, x1, y1)], native, target, a.shape[1], a.shape[0])
    rel = lambda p: (p[0] - cr[0], p[1] - cr[1])
    files = {'default': {'file': fname(n), 'crop': cr}}
    p = add(pid, files, native, rel(pv), target=target, **extra)
    if flip: p['settings'] = {'flip': True}
    if points: p['points'] = {k: [round(float(v[0] - cr[0]), 1), round(float(v[1] - cr[1]), 1)] for k, v in points.items()}
    return p, (x0, y0, x1, y1), native, cr


# =====================================================================================================================
# SET: the pieces marked Ready in the manifest (6 px per set unit)
# =====================================================================================================================

# ---- Grip. The flag is fitted by height (140). Pivot: the stand's base, centered on the pole
a = load(92); x0, y0, x1, y1 = bbox(a)
ys, xs = np.where(a[..., 3] > 128)
pole_x = xs[(ys > y0 + 900) & (ys < y0 + 1100)].mean()
fit('grip.flag', 92, 140, by='h', pivot=(pole_x, y1), quantize=256)

# Gear pile: 46 wide, bottom left corner at (246, 202)
fit('grip.gear-pile', 93, 46, by='w', pivot='bottom-left')

# Rig pole: the clamp knob (the big dark blob, where the arm attaches) lands 144 units above the base, so the arm's
# knuckle can stay at (292, 58) as the manifest says. That makes the pole about 8% taller than the manifest's 150.
a = load(94); x0, y0, x1, y1 = bbox(a)
dark = (a[..., 3] > 200) & (lum(a) < 70)
dark[:200] = False; dark[400:] = False
kx0, ky0, kx1, ky1, kcx, kcy = blob(dark)
ys, xs = np.where(a[..., 3] > 128)
pole_cx = xs[ys < y0 + 150].mean()
native = (y1 - kcy) / 144
fit_p, _, _, cr = fit('grip.rig-pole', 94, 150, by='h', pivot=(pole_cx, y1), points={'clamp': (pole_cx, kcy)})
pieces['grip.rig-pole']['native'] = round(float(native), 3)   # the clamp decides the scale, not the height
cr = crop_for([(x0, y0, x1, y1)], native, 6, a.shape[1], a.shape[0])
pieces['grip.rig-pole']['files']['default']['crop'] = cr
pieces['grip.rig-pole']['pivot'] = [round(float(pole_cx - cr[0]), 1), round(float(y1 - cr[1]), 1)]
pieces['grip.rig-pole']['points'] = {'clamp': [round(float(pole_cx - cr[0]), 1), round(float(kcy - cr[1]), 1)]}
info['rig-pole-height-units'] = round((y1 - y0) / native, 1)
info['rig-pole-width-units'] = round((x1 - x0) / native, 1)

# Rig arm: 100 long, drawn with the knuckle (dark round end) on the left. The pivot is the knuckle's center, and the
# art is mirrored so the arm reaches left from the pole, toward the burger
a = load(95)
dark = (a[..., 3] > 200) & (lum(a) < 70)
dark[:, 1000:] = False
bx0, by0, bx1, by1, bcx, bcy = blob(dark)
fit('grip.rig-arm', 95, 100, by='w', pivot=(bcx, bcy), flip=True)

# Fork head on its rod: 30 tall, hangs from the arm's end. Pivot at the top of the rod
a = load(96); x0, y0, x1, y1 = bbox(a)
ys, xs = np.where(a[..., 3] > 128)
fit('grip.rig-fork', 96, 30, by='h', pivot=(xs[ys < y0 + 15].mean(), y0))

# Sauce bottle in its clamp, 32 tall. The pivot is the clamp tab's far end (the grey strip on the right of the strap),
# and `nozzle` is the lowest point, where the pour stream starts
a = load(97); x0, y0, x1, y1 = bbox(a)
grey = (a[..., 3] > 200) & (abs(a[..., 0].astype(int) - a[..., 1]) < 22) & (abs(a[..., 1].astype(int) - a[..., 2]) < 22) & (a[..., 0] > 90) & (a[..., 0] < 190)
tx0, ty0, tx1, ty1, tcx, tcy = blob(grey)
ys, xs = np.where(a[..., 3] > 128)
nozzle = (xs[ys >= y1 - 6].mean(), y1)
fit('grip.rig-bottle', 97, 32, by='h', pivot=(tx1 - 8, tcy), points={'nozzle': nozzle})

# ---- Electric
# Key light beam: a wedge from the lens to the burger. The pivot is the middle of the narrow end (the light face); the
# engine turns it from the lens to the burger and stretches it to the distance. 150 long is the manifest size
a = load(98); x0, y0, x1, y1 = bbox(a)
ys, xs = np.where(a[..., 3] > 128)
fit('elec.beam', 98, 150, by='w', pivot=(x0, ys[xs < x0 + 25].mean()), quantize=256)
a = load(99); x0, y0, x1, y1 = bbox(a)
ys, xs = np.where(a[..., 3] > 128)
fit('elec.fill-beam', 99, 50, by='w', pivot=(x0, ys[xs < x0 + 20].mean()))
# Backlight with its cone, 60 tall (the manifest's 20 x 60 holds). Pivot: the top of the cord
a = load(100); x0, y0, x1, y1 = bbox(a)
ys, xs = np.where(a[..., 3] > 128)
fit('elec.backlight', 100, 60, by='h', pivot=(xs[ys < y0 + 20].mean(), y0))
fit('elec.dead-fx', 101, 60, by='w', pivot='center')

# ---- Art department
fit('art.table', 102, 72, by='w', pivot='bottom-left', quantize=256)
# Sauce bowl: the empty bowl and the sauce fill share one canvas, so both use the bowl's base center as the pivot and
# the bowl's scale
ba = load(103); bx0, by0, bx1, by1 = bbox(ba)
fa = load(104); fx0, fy0, fx1, fy1 = bbox(fa)
nat = (bx1 - bx0) / 16
cr = crop_for([(bx0, by0, bx1, by1), (fx0, fy0, fx1, fy1)], nat, 6, ba.shape[1], ba.shape[0])
pv = ((bx0 + bx1) / 2, by1)
add('art.sauce-bowl', {'empty': {'file': fname(103), 'crop': cr}, 'fill': {'file': fname(104), 'crop': cr}}, nat, (pv[0] - cr[0], pv[1] - cr[1]))
# Sparkle: two frames on one canvas, pivot on the canvas center (the burger's center), one scale for both
sa = load(105); sb = load(106)
s0 = bbox(sa); s1 = bbox(sb)
nat = (s0[2] - s0[0]) / 80
cr = crop_for([s0, s1], nat, 6, sa.shape[1], sa.shape[0])
cvc = (sa.shape[1] / 2, sa.shape[0] / 2)
add('fx.sparkle', {'01': {'file': fname(105), 'crop': cr}, '02': {'file': fname(106), 'crop': cr}}, nat, (cvc[0] - cr[0], cvc[1] - cr[1]))

# ---- Video village and craft table
# Monitor: 60 wide, stand base at the bottom. The screen inset (the big near-black rectangle) is saved as two points
a = load(107); x0, y0, x1, y1 = bbox(a)
dark = (a[..., 3] > 200) & (lum(a) < 45)
sx0, sy0, sx1, sy1, _, _ = blob(dark)
ys, xs = np.where(a[..., 3] > 128)
base_cx = xs[ys > y1 - 30].mean()
p, _, nat, cr = fit('village.monitor', 107, 60, by='w', pivot=(base_cx, y1), points={'screen': (sx0, sy0), 'screen2': (sx1, sy1)}, quantize=256)
info['monitor-screen-units'] = [round((sx1 - sx0) / nat, 1), round((sy1 - sy0) / nat, 1)]
info['monitor-head-height-units'] = round((sy1 + 50 - y0) / nat, 1)
fit('village.chair', 108, 44, by='h', pivot='bottom-center')
fit('crafty.table', 109, 150, by='w', pivot='top-left', quantize=256)
fit('crafty.coffee', 110, 7, by='h', pivot='bottom-center')

# =====================================================================================================================
# HQ (6 px per unit, except the shell: the master has 3.6)
# =====================================================================================================================
a = load(129); x0, y0, x1, y1 = bbox(a)
nat = (x1 - x0) / 336
cr = crop_for([(x0, y0, x1, y1)], nat, 3.6, a.shape[1], a.shape[0])
# PARKED: the shell's window openings are 121 x 80 units (rooms) and 270 x 67 (lobby), the manifest's rooms are 152 x 112 and
# the lobby 312 x 84, so code-drawn rooms would cover the brick frames. Needs a re-export (see Art-Batch-5-Validation.md)
add('hq.shell', {'default': {'file': fname(129), 'crop': cr}}, nat, (x0 - cr[0], y0 - cr[1]), target=3.6, quantize=256, dir='_parked')
info['hq-shell-px-per-unit'] = round(nat, 2)
info['hq-shell-height-units'] = round((y1 - y0) / nat, 1)

# Sign: both states on one canvas, 220 wide. The art reaches the canvas edges, so the crop pads it. Pivot: the center
sa = load(130); sb = load(131)
b0 = bbox(sa); b1 = bbox(sb)
nat = (b0[2] - b0[0]) / 220
m = int(np.ceil(5 * nat / 6)) + 1
cr = [-m, min(b0[1], b1[1]) - m, sa.shape[1] + m, max(b0[3], b1[3]) + m]
add('hq.sign', {'off': {'file': fname(130), 'crop': cr}, 'on': {'file': fname(131), 'crop': cr}}, nat, ((cr[2] - cr[0]) / 2, (cr[3] - cr[1]) / 2), quantize=256)
info['hq-sign-height-units'] = round((b0[3] - b0[1]) / nat, 1)

# Edit Bay, empty and for rent: 152 wide, an opaque picture. Pivot top left
a = load(132); x0, y0, x1, y1 = bbox(a)
if (x1 - x0) / (y1 - y0) > 152 / 112:   # trim to the room's 152 : 112 aspect around the art's own box, as batch 6 does for the other states
    nw = int(round((y1 - y0) * 152 / 112)); x0 += (x1 - x0 - nw) // 2; x1 = x0 + nw
else:
    nh = int(round((x1 - x0) * 112 / 152)); y0 += (y1 - y0 - nh) // 2; y1 = y0 + nh
nat = (x1 - x0) / 152
add('hq.room.edit', {'for-rent': {'file': fname(132), 'crop': [x0, y0, x1, y1]}}, nat, (0, 0), target=4, quantize=256, opaque=True)
info['hq-room-edit-height-units'] = round((y1 - y0) / nat, 1)

# =====================================================================================================================
# PARKED: fitted and audited, not used by the game yet (art/_parked/). Not marked Ready in the manifest
# =====================================================================================================================
P = '_parked'




def simple_parked(pid, approvals, size, by, target, pivot='center', thr=128, **extra):
    """pieces made of one or several states, each fitted by its own width or height (per-state scale), pivot on its own box"""
    files = {}
    first = None
    for st, n in approvals.items():
        a = load(n); x0, y0, x1, y1 = bbox(a, thr)
        nat = ((x1 - x0) if by == 'w' else (y1 - y0) if by == 'h' else max(x1 - x0, y1 - y0)) / size
        names = {'center': ((x0 + x1) / 2, (y0 + y1) / 2), 'bottom-center': ((x0 + x1) / 2, y1), 'top-left': (x0, y0)}
        pv = names[pivot] if isinstance(pivot, str) else pivot(a, (x0, y0, x1, y1))
        cr = crop_for([(x0, y0, x1, y1)], nat, target, a.shape[1], a.shape[0])
        ent = {'file': fname(n), 'crop': cr, 'native': round(nat, 3), 'pivot': [round(float(pv[0] - cr[0]), 1), round(float(pv[1] - cr[1]), 1)]}
        files['default' if st == 'default' else st] = ent
        if first is None: first = ent
    p = add(pid, files, first['native'], first['pivot'], target=target, dir=P, **extra)
    return p


# ---- HUD in CSS px at 4 px per CSS px, like batch 4
simple_parked('ui.shot-status', {'next': 70}, 22, 'w', 4)                       # ring with a play triangle, "up next"
simple_parked('ui.time-seg', {'empty': 73, 'filled': 74, 'overtime': 75}, 13, 'w', 4)
simple_parked('ui.station-badge', {'default': 82}, 18, 'w', 6)                  # set units
simple_parked('ui.bubble', {'default': 77}, 40, 'w', 6, pivot='bottom-center')  # set units, tail at the bottom center
simple_parked('ui.crew-ring', {'working': 84, 'waiting': 83, 'blocked': 86}, 12, 'w', 4)
simple_parked('ui.progress-ring', {'default': 122}, 14, 'w', 6)                 # set units. The sample has progress baked in
simple_parked('ui.logo', {'default': 91}, 60, 'h', 4)
simple_parked('ui.shot-thumbs', {'hero': 119, 'cheese': 120, 'sauce': 121}, 120, 'w', 3, pivot='top-left')
simple_parked('ui.dept-icons', {'camera': 78, 'lighting': 79, 'fix': 80, 'art': 81}, 32, 'x', 4)     # fitted so the longer side is 32
simple_parked('ui.chaos-icons', {'hammer': 123, 'van': 124, 'lightning': 125}, 44, 'x', 4)
simple_parked('fx.spotlight', {'default': 126}, 124, 'w', 6, thr=8, quantize=256)   # soft mask: measured on its whole soft extent
simple_parked('fx.puff', {'default': 127}, 40, 'w', 6)
# The three steam curls sit side by side on one sheet: cut them apart, 12 units tall each
a = load(128)
al = a[..., 3] > 40
lab, nlab = ndi.label(ndi.binary_dilation(al, iterations=25))
frames = []
for i in range(1, nlab + 1):
    ys, xs = np.where((lab == i) & al)
    frames.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
frames.sort()
nat = max(f[3] - f[1] for f in frames) / 12
files = {}
for k, (fx0, fy0, fx1, fy1) in enumerate(frames, 1):
    cr = crop_for([(fx0, fy0, fx1, fy1)], nat, 6, a.shape[1], a.shape[0])
    files[f'frame-{k}'] = {'file': fname(128), 'crop': cr, 'native': round(nat, 3), 'pivot': [round((fx0 + fx1) / 2 - cr[0], 1), round(fy1 - cr[1], 1)]}
add('fx.steam', files, nat, files['frame-1']['pivot'], target=6, dir=P)
info['steam-frames'] = len(frames)

# ---- Shared crew props (8 px per unit like the puppet parts). Pivot is an approximate grip point: confirm
HELD = [  # state, approval, width in units, grip point as a fraction of the box (x, y)
    ('sandbag', 111, 12, (0.5, 0.0)), ('hammer', 112, 12, (0.25, 0.8)), ('gel-frame', 113, 12, (0.5, 0.5)),
    ('light-head', 114, 12, (0.5, 1.0)), ('lens-case', 115, 10, (0.5, 0.0)), ('burger-plate', 116, 14, (0.5, 1.0)),
    ('tweezers', 117, 14, (0.05, 0.5)),
]
files = {}
for st, n, wu, (gx, gy) in HELD:
    a = load(n); x0, y0, x1, y1 = bbox(a)
    nat = (x1 - x0) / wu
    cr = crop_for([(x0, y0, x1, y1)], nat, 8, a.shape[1], a.shape[0])
    files[st] = {'file': fname(n), 'crop': cr, 'native': round(nat, 3), 'pivot': [round(x0 + gx * (x1 - x0) - cr[0], 1), round(y0 + gy * (y1 - y0) - cr[1], 1)]}
first = next(iter(files.values()))
add('crew.held', files, first['native'], first['pivot'], target=8, dir=P)
# Soft floor shadow under a person, 24 wide (measured on its soft edge, not the solid core)
a = load(118); x0, y0, x1, y1 = bbox(a, 8)
nat = (x1 - x0) / 24
cr = crop_for([(x0, y0, x1, y1)], nat, 6, a.shape[1], a.shape[0])
add('crew.shadow', {'default': {'file': fname(118), 'crop': cr}}, nat, ((x0 + x1) / 2 - cr[0], (y0 + y1) / 2 - cr[1]), target=6, dir=P)

# ---- Nine-slices (4 px per CSS px)
def nine(pid, n, native, slice_px, fill=True, target=4):
    a = load(n); x0, y0, x1, y1 = bbox(a)
    cr = (max(0, x0 - 4), max(0, y0 - 4), min(a.shape[1], x1 + 4), min(a.shape[0], y1 + 4))
    add(pid, {'default': {'file': fname(n), 'crop': list(cr)}}, native, (0, 0), target=target, quantize=256, slice=slice_px, fill=fill, dir=P)

nine('ui.card', 85, 100 / 24, [104] * 4)                         # torn paper, 24 CSS px corners
a = load(76); x0, y0, x1, y1 = bbox(a)
nine('ui.quest', 76, (y1 - y0) / 40, [0, 142, 0, 142])            # pill: only the round ends are cut off, 40 CSS px tall
for pid, n in (('ui.meter-track', 71), ('ui.meter-fill', 72)):
    a = load(n); x0, y0, x1, y1 = bbox(a)
    nine(pid, n, (y1 - y0) / 7, [0, 44, 0, 44])                   # bar: round ends keep their shape, 7 CSS px tall (tablet)

# ---- ACTION button: three face states and the clapper stick, which pivots on its left hinge
faces = {}
for st, n in (('muted', 90), ('ready', 89), ('rolling', 87)):
    a = load(n); x0, y0, x1, y1 = bbox(a)
    nat = (x1 - x0) / 140
    cr = crop_for([(x0, y0, x1, y1)], nat, 4, a.shape[1], a.shape[0])
    faces[st] = {'file': fname(n), 'crop': cr, 'native': round(nat, 3), 'pivot': [round((x0 + x1) / 2 - cr[0], 1), round(y1 - cr[1], 1)]}
a = load(88); x0, y0, x1, y1 = bbox(a)
nat = (x1 - x0) / 140
cr = crop_for([(x0, y0, x1, y1)], nat, 4, a.shape[1], a.shape[0])
dark = (a[..., 3] > 200) & (lum(a) < 70)
dark[:, 300:] = False
hx0, hy0, hx1, hy1, hcx, hcy = blob(dark)
faces['stick'] = {'file': fname(88), 'crop': cr, 'native': round(nat, 3), 'pivot': [round(hcx - cr[0], 1), round(hcy - cr[1], 1)]}
add('ui.action', faces, faces['muted']['native'], faces['muted']['pivot'], target=4, dir=P, quantize=256)

json.dump({'_note': 'Batch 5 (Nov 5): masters from Thats-A-Wrap-Approved-Assets-03.zip, approvals 70 to 132. Generated by tools/make_batch5_map.py.', 'info': info, 'pieces': pieces}, open(out, 'w'), indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
print(len(pieces), 'pieces ->', out)
print(json.dumps(info, indent=1))
