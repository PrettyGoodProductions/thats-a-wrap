"""Measures the batch 4 masters (Thats-A-Wrap-Approved-Assets-02.zip, approvals 33 to 69) and writes the batch map.

  python3 -I tools/make_batch4_map.py <unzipped folder>/assets tools/batch4.map.json
  python3 -I tools/prep_art.py tools/batch4.map.json <unzipped folder>/assets art

Every number comes from the master's own alpha: the piece's bounding box sets the scale against the size in the
Asset Manifest, and the pivot is read off the art (flat bottoms, the cord top of a lamp, the base of a pot).
"""
import json, os, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1:3]
TARGET = 6

def load(name):
    im = Image.open(os.path.join(src, name)).convert('RGBA')
    return im, np.array(im)[..., 3]

def bbox(al, t=128):
    ys, xs = np.where(al > t)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def col_center(al, y0, y1, t=128):
    """x center of the opaque pixels in rows y0 to y1"""
    ys, xs = np.where(al[y0:y1] > t)
    return float(xs.mean())

def row_center(al, x0, x1, t=128):
    ys, xs = np.where(al[:, x0:x1] > t)
    return float(ys.mean())

pieces = {}
info = {}

def add(pid, files, native, pivot, target=TARGET, **extra):
    p = {'native': round(native, 3), 'target': target, 'pivot': [round(float(pivot[0]), 1), round(float(pivot[1]), 1)], 'files': files}
    p.update(extra)
    pieces[pid] = p

# ---- Tiles: one master is one 200 x 200 unit tile at 5 px per unit. Made seamless before the resize.
add('set.wall', {'default': {'file': '33-blue-wall.png'}}, 1254 / 200, (0, 0), target=5, seamless=True, quantize=160)
add('set.floor', {'default': {'file': '34-cardboard-floor.png'}}, 1254 / 200, (0, 0), target=5, seamless=True, quantize=160)

# ---- Flats: fit by height (the manifest height keeps the floor line and the skyline), pivot at the bottom center
FLATS = [  # backdrop file, manifest size (w, h)
    ('40-backdrop-01-blue.png', 204), ('41-backdrop-02-brick-red.png', 183), ('42-backdrop-03-muted-mustard.png', 84),
    ('43-backdrop-04-sage.png', 186), ('44-backdrop-05-navy-corrugated.png', 208), ('45-backdrop-06-kraft.png', 196),
    ('46-backdrop-07-mustard.png', 174), ('47-backdrop-08-plum.png', 203), ('48-backdrop-09-red.png', 196),
    ('49-backdrop-10-cream.png', 173), ('50-backdrop-11-sage.png', 200),
]
for i, (f, hu) in enumerate(FLATS, 1):
    im, al = load(f)
    x0, y0, x1, y1 = bbox(al)
    # Crop to the flat (a few px of canvas margin kept) so no file carries empty canvas. Flats are opaque paper, so the
    # palette is reduced (quantize) to keep the page light.
    cr = tuple(int(v) for v in (max(0, x0 - 4), max(0, y0 - 4), min(im.width, x1 + 4), min(im.height, y1 + 4)))
    add(f'set.flat-{i}', {'default': {'file': f, 'crop': list(cr)}}, (y1 - y0) / hu, ((x0 + x1) / 2 - cr[0], y1 - cr[1]), target=5, quantize=256)
    info[f'flat-{i}-width-units'] = round((x1 - x0) / ((y1 - y0) / hu), 1)

def top_left_fit(pid, f, wu):
    im, al = load(f)
    x0, y0, x1, y1 = bbox(al)
    add(pid, {'default': {'file': f}}, (x1 - x0) / wu, (x0, y0))

top_left_fit('set.call-sheet', '51-handdrawn-call-sheet.png', 52)
top_left_fit('set.poster', '52-blank-client-poster.png', 44)

# ---- Practicals: two colors, off and on. Pivot at the top of the cord. One scale for the pair
for color, (off, on) in {'red': ('53-red-pendant-off.png', '54-red-pendant-on.png'), 'sage': ('55-sage-pendant-off.png', '56-sage-pendant-on.png')}.items():
    im, al = load(off)
    x0, y0, x1, y1 = bbox(al)
    cx = col_center(al, y0, y0 + 40)
    add(f'set.practical-{color}', {'off': {'file': off}, 'on': {'file': on}}, (x1 - x0) / 24, (cx, y0))

# ---- Flag: hangs from the small tab at the top
im, al = load('57-overhead-lighting-flag.png')
x0, y0, x1, y1 = bbox(al)
add('set.overhead-flag', {'default': {'file': '57-overhead-lighting-flag.png'}}, (x1 - x0) / 44, (col_center(al, y0, y0 + 25), y0))

# ---- Plants: pivot at the middle of the pot base
for pid, f, hu in [('set.plant-1', '58-terracotta-plant.png', 70), ('set.plant-2', '59-mustard-fern.png', 56)]:
    im, al = load(f)
    x0, y0, x1, y1 = bbox(al)
    add(pid, {'default': {'file': f}}, (y1 - y0) / hu, (col_center(al, y1 - 30, y1), y1))

# ---- Floor dressing
im, al = load('60-floor-tape-x.png'); x0, y0, x1, y1 = bbox(al)
add('set.tape-mark', {'default': {'file': '60-floor-tape-x.png'}}, 140, ((x0 + x1) / 2, (y0 + y1) / 2))
im, al = load('61-floor-cable.png'); x0, y0, x1, y1 = bbox(al)
add('set.cable', {'default': {'file': '61-floor-cable.png'}}, (x1 - x0) / 230, (x0, row_center(al, x0, x0 + 30)))
im, al = load('62-floor-scuffs-second-version.png'); x0, y0, x1, y1 = bbox(al, 8)
add('set.floor-scuffs', {'default': {'file': '62-floor-scuffs-second-version.png'}}, 5, ((x0 + x1) / 2, (y0 + y1) / 2), target=5)
# Ceiling pipes: a strip that tiles sideways, 200 units per tile, centered on the strip
im, al = load('63-overhead-lighting-grid.png'); x0, y0, x1, y1 = bbox(al, 8)
add('set.grid', {'default': {'file': '63-overhead-lighting-grid.png'}}, 2172 / 200, (0, (y0 + y1) / 2))

# ---- HUD pieces that are plain images (the engine draws them inside SVG): stars, pause, shot status
for pid, f, st, size in [('ui.star', '65-filled-rating-star.png', 'on', 32), ('ui.star', '66-empty-rating-star-greige.png', 'off', 32)]:
    im, al = load(f); x0, y0, x1, y1 = bbox(al)
    pieces.setdefault(pid, {'native': round((x1 - x0) / size, 3), 'target': 4, 'pivot': [(x0 + x1) / 2, (y0 + y1) / 2], 'files': {}})
    pieces[pid]['files'][st] = {'file': f}
im, al = load('67-pause-icon.png'); x0, y0, x1, y1 = bbox(al)
add('ui.icon-pause', {'default': {'file': '67-pause-icon.png'}}, (y1 - y0) / 26, ((x0 + x1) / 2, (y0 + y1) / 2), target=4)
im, al = load('68-completed-shot-checkmark.png'); x0, y0, x1, y1 = bbox(al)
add('ui.shot-status', {'done': {'file': '68-completed-shot-checkmark.png', 'native': (x1 - x0) / 22, 'pivot': [(x0 + x1) / 2, (y0 + y1) / 2], 'decontaminate': True}}, (x1 - x0) / 22, ((x0 + x1) / 2, (y0 + y1) / 2), target=4)
im, al = load('69-pending-shot-ring.png'); x0, y0, x1, y1 = bbox(al)
pieces['ui.shot-status']['files']['pending'] = {'file': '69-pending-shot-ring.png', 'native': (x1 - x0) / 17, 'pivot': [(x0 + x1) / 2, (y0 + y1) / 2]}

# ---- HUD nine-slices. Each is cropped to its paper, scaled so the 100% size is the size it is first used at in the HUD,
# and cut with the same inset on every side (read off the corners' curve), except the polaroid, whose window sets the insets.
def nine(pid, f, cssw=None, cssslice=None, slice_m=None, native=None, states=None, fill=True, win=None):
    im, al = load(f)
    x0, y0, x1, y1 = (int(v) for v in bbox(al))
    cr = (max(0, x0 - 4), max(0, y0 - 4), min(im.width, x1 + 4), min(im.height, y1 + 4))
    if win:   # transparent window (the polaroid): insets are the frame's thickness
        wx0, wy0, wx1, wy1 = win
        sl = [wy0 - cr[1], cr[2] - wx1, cr[3] - wy1, wx0 - cr[0]]
    else:
        sl = [slice_m + 4] * 4
    nat = native if native else (x1 - x0) / cssw
    files = {'default': {'file': f, 'crop': list(cr)}}
    for st, hexc in (states or {}).items():
        files[st] = {'file': f, 'crop': list(cr), 'recolor': hexc}
    add(pid, files, nat, (0, 0), target=4, quantize=256, slice=sl, fill=fill)

nine('ui.panel', '35-cream-ui-panel.png', slice_m=100, native=100 / 14)
nine('ui.chip-dark', '36-dark-hud-panel.png', slice_m=90, native=90 / 10)
nine('ui.tag', '38-cream-job-tag.png', slice_m=110, native=110 / 10)
nine('ui.crew-card', '37-neutral-crew-card.png', slice_m=125, cssw=58, states={'camera': '#BFD6EE', 'lighting': '#F4D98A', 'art': '#F3C3C6', 'grip': '#BFDCC9'})
nine('ui.button-paper', '39-coral-orange-button.png', slice_m=130, cssw=38)
nine('ui.polaroid', '64-empty-polaroid-frame.png', native=1083 / 42, win=(170, 150, 1253, 810), fill=False)

json.dump({'_note': 'Batch 4 (Nov 4): set and HUD masters from Thats-A-Wrap-Approved-Assets-02.zip. Generated by tools/make_batch4_map.py.', 'info': info, 'pieces': pieces}, open(out, 'w'), indent=1)
print(len(pieces), 'pieces ->', out)
