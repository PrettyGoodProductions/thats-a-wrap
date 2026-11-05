"""Recolor chosen color areas of a paper-cut piece and leave the rest alone.

A piece is flat areas of colored paper (skin, hair, a jacket, buttons). Every pixel is assigned to the nearest of
the piece's own main colors, softly, so edges stay smooth. The areas named in `moves` are shifted to a new color:
lightness is scaled and chroma is moved, so the paper grain and the shading inside the area carry over.
Areas listed as followers (a nose, blush) take the same shift as the area they follow, so they stay a little
warmer or darker than the skin, as drawn.

  from recolor_area import palette_of, recolor_areas
  pal = palette_of(im, k=7)                       # the piece's main colors, as Lab
  out = recolor_areas(im, pal, {i_skin: '#7A4526'}, follow={i_nose: i_skin})
"""
import numpy as np
from PIL import Image
from skimage import color as skc

W_L = 0.5   # lightness counts half as much as chroma when matching a pixel to an area

def hex2lab(h):
    rgb = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255
    return skc.rgb2lab(rgb[None, None, :])[0, 0]

def lab2hex(lab):
    rgb = (np.clip(skc.lab2rgb(np.array(lab, float)[None, None, :])[0, 0], 0, 1) * 255).round().astype(int)
    return '#%02x%02x%02x' % tuple(rgb)

def _dist(lab, c):
    d = lab - c
    return np.sqrt((W_L * d[..., 0]) ** 2 + d[..., 1] ** 2 + d[..., 2] ** 2)

def palette_of(im, k=7, seed=3):
    """The k main colors of the opaque part of an image (k-means in Lab), biggest area first. Deterministic."""
    a = np.asarray(im.convert('RGBA')).astype(float) / 255
    pts = skc.rgb2lab(a[..., :3])[a[..., 3] > 0.9]
    rng = np.random.default_rng(seed)
    pts_s = pts[rng.choice(len(pts), min(len(pts), 20000), replace=False)]
    # farthest-point start, so small but distinct areas (a nose, an earring) get their own color
    c = [np.median(pts_s, 0)]
    for _ in range(k - 1):
        d = np.min([_dist(pts_s, ci) for ci in c], 0)
        c.append(pts_s[d.argmax()])
    c = np.array(c)
    for _ in range(30):
        lab_i = np.argmin([_dist(pts_s, ci) for ci in c], 0)
        c = np.array([np.median(pts_s[lab_i == i], 0) if (lab_i == i).any() else c[i] for i in range(k)])
    n = np.bincount(lab_i, minlength=k)
    order = np.argsort(-n)
    return [c[i] for i in order]

def nearest(palette, lab):
    return int(np.argmin([_dist(np.array(lab, float), np.array(p)) for p in palette]))

def recolor_areas(im, palette, moves, follow=None, sharp=2.5):
    """moves: {palette index: '#hex' target}. follow: {palette index: index it follows}. Returns a new RGBA image."""
    a = np.asarray(im.convert('RGBA')).astype(float) / 255
    lab = skc.rgb2lab(a[..., :3])
    d = np.stack([_dist(lab, np.array(p)) for p in palette], -1)
    w = np.exp(-(d - d.min(-1, keepdims=True)) / sharp)
    w /= w.sum(-1, keepdims=True)
    out = np.zeros_like(lab)
    follow = follow or {}
    for i, p in enumerate(palette):
        lead = i if i in moves else follow.get(i)
        if lead is None or lead not in moves:
            out += w[..., i:i + 1] * lab
            continue
        s = np.array(palette[lead]); t = hex2lab(moves[lead])
        gain = np.clip(np.hypot(t[1], t[2]) / max(np.hypot(s[1], s[2]), 4), 0.4, 1.3)
        new = np.empty_like(lab)
        new[..., 0] = np.clip(lab[..., 0] * t[0] / max(s[0], 1), 0, 100)
        new[..., 1] = t[1] + (lab[..., 1] - s[1]) * gain
        new[..., 2] = t[2] + (lab[..., 2] - s[2]) * gain
        out += w[..., i:i + 1] * new
    rgb = np.clip(skc.lab2rgb(out), 0, 1)
    return Image.fromarray((np.dstack([rgb, a[..., 3]]) * 255).round().astype('uint8'), 'RGBA')

if __name__ == '__main__':
    import sys
    for f in sys.argv[1:]:
        print(f)
        for i, p in enumerate(palette_of(Image.open(f))):
            print(f'  {i}: {lab2hex(p)}  lab {np.round(p, 1)}')
