"""Art pipeline validation, run in a real browser against the art test bench (lab.html).

  node build.mjs --art art --out /tmp/lab-dist --lab
  python3 tools/qa_pipeline.py /tmp/lab-dist /tmp/qa-pipeline

Checks what a successful image load does not: transparency on any background, drawn size at real gameplay
scale on a phone and a tablet, pivots and placement, no jump between key light states, and a puppet that
stays in one piece through a walk and a work/reach cycle. Writes the evidence (contact sheets, filmstrips,
animated GIFs) next to the numbers. Exit code 1 when any check fails.
"""
import json, math, os, sys
import numpy as np
import cv2
from PIL import Image
from io import BytesIO
from playwright.sync_api import sync_playwright

dist, out = sys.argv[1], sys.argv[2]
# --char ro|mika|dani|lu picks which delivered character the puppet checks run on (default ro). Run once per character
CH = sys.argv[sys.argv.index('--char') + 1] if '--char' in sys.argv else 'ro'
NAME = {'ro': 'Ro', 'mika': 'Mika', 'dani': 'Dani', 'lu': 'Lu'}[CH]
DEPT = {'ro': 'lighting', 'mika': 'camera', 'dani': 'grip', 'lu': 'art'}[CH]
PUP = f"'{CH}',{{name:'{NAME}',dept:'{DEPT}'}}"
os.makedirs(out, exist_ok=True)
LAB = 'file://' + os.path.abspath(os.path.join(dist, 'lab.html'))
results = []

def check(name, ok, detail=''):
    if name.startswith('Ro '): name = name[3:]
    name = f'[{NAME}] ' + name
    results.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + detail) if detail else ''))

def rgba(png):
    return Image.open(BytesIO(png)).convert('RGBA')

def mask(im, thr=128):
    return np.array(im)[..., 3] >= thr

def components(m, min_px=25):
    n, lab = cv2.connectedComponents(m.astype(np.uint8), connectivity=8)
    return int(sum(1 for i in range(1, n) if (lab == i).sum() >= min_px))

def bbox(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

class Env:
    def __init__(self, p, w, dpr):
        self.w, self.dpr = w, dpr
        self.unit = w / 360.0            # css px per set unit
        self.k = self.unit * dpr         # device px per set unit
        self.ctx = p.chromium.launch(channel='chrome', args=['--no-sandbox']).new_context(viewport={'width': max(w, 400), 'height': 1000}, device_scale_factor=dpr)
        self.page = self.ctx.new_page()
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('console', lambda m: self.errors.append(m.text) if m.type in ('error', 'warning') and 'Failed to load resource' not in m.text else None)
        self.page.goto(LAB)
    def js(self, expr): return self.page.evaluate(expr)
    def mount(self, bg='transparent'): return self.js(f"lab.mount({{bg:'{bg}',width:{self.w}}})")
    def shot(self): return rgba(self.page.locator('#stage').screenshot(omit_background=True))
    def px(self, x, y): return x * self.k, (y + 70) * self.k   # set units -> stage device px
    def close(self): self.page.context.browser.close()

with sync_playwright() as p:
    # ---------------------------------------------------------------- 1. drawn size at gameplay scale
    print('\n== 1. Gameplay scale: pixels delivered vs pixels drawn ==')
    ENVS = [('phone 390 css px @2x', 390, 2), ('phone 430 css px @3x', 430, 3), ('tablet 820 css px @2x', 820, 2)]
    sizing = {}
    for label, w, dpr in ENVS:
        e = Env(p, w, dpr)
        e.mount('set')
        e.js("lab.key('on',0)")
        e.js(f"lab.addPuppet({PUP},104,300,false)")
        imgs = {i['key']: i for i in e.js('lab.images()')}
        seen = {}
        for m in e.js('lab.measure()'):
            i = imgs.get(m['key'])
            if not i: continue
            ratio = i['imgW'] / m['devW']
            seen[m['key']] = min(seen.get(m['key'], 99), ratio)
        for key, r in seen.items():
            sizing.setdefault(key, {})[label] = r
        if e.errors: check(f'lab page errors ({label})', False, '; '.join(e.errors[:3]))
        e.close()
    # Hire card and crew bar portraits of Ro (the head, in a 56 x 60 css px card at 3x)
    e = Env(p, 430, 3)
    rect = e.js(f"lab.portrait({{name:'{NAME}',dept:'{DEPT}'}},56,60,'transparent')")
    portrait_png = e.shot()
    imgs = {i['key']: i for i in e.js('lab.images()')}
    head = [i for i in imgs.values() if i['id'] == f'crew.{CH}.head'][0]
    box = e.js(f"(WrapLoader.portraitOf('{CH}'))")
    head_dev_w = head['w'] * (56 / box[2]) * 3
    sizing.setdefault(head['key'], {})['hire card portrait @3x'] = head['imgW'] / head_dev_w
    pm = mask(portrait_png, 40)
    x0, y0, x1, y1 = bbox(pm)
    W, H = portrait_png.size
    clipped = x0 <= 0 or y0 <= 0 or x1 >= W   # the bottom edge is meant to cut through the shoulders
    check('Ro portrait crop shows the whole head (nothing cut off at the top or sides of the card)', not clipped, f'art spans x {x0}-{x1} of {W}, y {y0}-{y1} of {H} device px')
    portrait_png.save(os.path.join(out, f'portrait-{CH}.png'))
    e.close()
    worst = 99
    print('   piece: delivered px / drawn device px  (1.0 = exact, below 1.0 = soft, above 3 = wasted weight)')
    for key, d in sorted(sizing.items()):
        line = '   ' + key.replace('wl-', '').replace('--', '.') + ': ' + ', '.join(f'{r:.2f} ({lab})' for lab, r in d.items())
        print(line)
        worst = min(worst, min(d.values()))
    # Headroom is judged on the hardest display each image meets (the smallest ratio): it must be sharp there
    # (>= 1) and not wasteful (<= 2). Easier displays naturally show a bigger ratio.
    hard = {k: min(d.values()) for k, d in sizing.items()}
    lo, hi = min(hard.values()), max(hard.values())
    check('every image is sharp on the hardest display it meets (delivered px >= drawn device px)', lo >= 0.98, f'softest {lo:.2f}x')
    check('no image carries more than 2x the pixels the hardest display can show', hi <= 2.0, f'most oversized {hi:.2f}x')

    # ---------------------------------------------------------------- 2. transparency on any background
    print('\n== 2. Transparency ==')
    e = Env(p, 430, 3)
    e.mount('transparent'); e.js("lab.key('on',0)")
    e.js(f"lab.addPuppet({PUP},184,330,false)")
    pieces = {}
    for name, mode in (('platform', 'platform'), ('key-on', 'key'), (CH, 'puppet')):
        e.js(f"lab.iso('{mode}')")
        im = e.shot()
        pieces[name] = im
        a = np.array(im)[..., 3]
        x0, y0, x1, y1 = bbox(a >= 8)
        # a clean cut-out is transparent in the four corners and has no solid pixels on the canvas border
        corners = [a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]
        check(f'{name}: corners fully transparent', max(corners) == 0, f'corner alpha {corners}')
    # Contact sheet: each piece over white, black, magenta, checker
    def over(im, bg):
        if bg == 'checker':
            arr = np.full((im.size[1], im.size[0], 4), 255, np.uint8)
            yy, xx = np.mgrid[0:im.size[1], 0:im.size[0]]; arr[((yy // 24 + xx // 24) % 2).astype(bool)] = (200, 200, 200, 255)
            base = Image.fromarray(arr, 'RGBA')
        else:
            base = Image.new('RGBA', im.size, bg)
        base.alpha_composite(im); return base.convert('RGB')
    rows = []
    for name, im in pieces.items():
        x0, y0, x1, y1 = bbox(np.array(im)[..., 3] >= 8)
        pad = 30; crop = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
        c = im.crop(crop)
        tiles = [over(c, bg) for bg in ((255, 255, 255, 255), (0, 0, 0, 255), (255, 0, 255, 255), 'checker')]
        rows.append(tiles)
    sh = max(t.height for r in rows for t in r); sw = [max(r[i].width for r in rows) for i in range(4)]
    sheet = Image.new('RGB', (sum(sw) + 12, sum(max(t.height for t in r) + 6 for r in rows)), (128, 128, 128))
    yy = 0
    for r in rows:
        xx = 0
        for i, t in enumerate(r): sheet.paste(t, (xx, yy)); xx += sw[i] + 4
        yy += max(t.height for t in r) + 6
    sheet.save(os.path.join(out, 'transparency.png'))
    # Edge halos are measured on the files themselves (tools/audit_art.py, 'ring'): the game adds its own drop
    # shadow to these pieces, which would read as a dark ring in a screenshot.
    e.close()

    # ---------------------------------------------------------------- 3. platform placement
    print('\n== 3. Hero platform placement ==')
    e = Env(p, 430, 3)
    e.mount('transparent'); e.js("lab.iso('platform')")
    im = e.shot(); m = mask(im, 128)
    x0, y0, x1, y1 = bbox(m)
    cx = (x0 + x1) / 2 / e.k; bottom = (y1 / e.k) - 70; width = (x1 - x0) / e.k; height = (y1 - y0) / e.k
    check('platform bottom edge sits on the spot (y = 192 set units, +-0.8)', abs(bottom - 192) <= 0.8, f'bottom {bottom:.2f}')
    check('platform is centered on its spot (x = 184, +-1.0)', abs(cx - 184) <= 1.0, f'center {cx:.2f}')
    check('platform footprint is within 15% of the manifest width (112 units)', abs(width - 112) / 112 <= 0.15, f'drawn {width:.1f} wide x {height:.1f} tall (manifest 112 x 60)')
    im.save(os.path.join(out, 'platform-iso.png'))
    # the hero burger stands on the platform's contact point, and that point is on the lid
    e.mount('transparent')
    hs = e.js("(() => { document.getElementById('prop').innerHTML = WrapArt.propInner('hero'); const h = WrapArt.heroSpot(); const r = document.getElementById('prop').getBBox(); const m = document.getElementById('prop').getCTM(); return { h, x: m.e + (r.x + r.width / 2) * m.a, y: m.f + (r.y + r.height) * m.d, sx: m.a }; })()")
    stage_w = e.w
    # getCTM maps to the svg viewport in css px; convert to set units
    bx = hs['x'] / e.unit; by = hs['y'] / e.unit - 70
    check('hero burger base sits on the platform contact point (+-0.8 units)', abs(bx - hs['h']['x']) <= 0.8 and abs(by - hs['h']['y']) <= 0.8, f"base at {bx:.1f}, {by:.1f}; contact {hs['h']['x']:.1f}, {hs['h']['y']:.1f}; layout shift {hs['h']['dx']:+.1f}, {hs['h']['dy']:+.1f}")
    cx, cy = e.px(hs['h']['x'], hs['h']['y'])
    on_lid = np.array(im)[int(cy) - 2, int(cx), 3] > 200
    check('the contact point is on the platform art (the lid), not in empty canvas', on_lid)
    e.close()

    # ---------------------------------------------------------------- 4. key light states
    print('\n== 4. Key light: states and pivot ==')
    e = Env(p, 430, 3)
    e.mount('transparent'); e.js("lab.iso('key')")
    ax, ay = e.px(72, 76)
    masks = {}; ims = {}
    for ang in (-12, 0, 20, 34):
        for st in ('off', 'on', 'dead'):
            e.js(f"lab.key('{st}',{ang})")
            im = e.shot(); ims[(st, ang)] = im; masks[(st, ang)] = mask(im, 128)
    worst_shift = 0; worst_iou = 1
    for ang in (-12, 0, 20, 34):
        ref = masks[('off', ang)].astype(np.float32)
        for st in ('on', 'dead'):
            mm = masks[(st, ang)].astype(np.float32)
            (dx, dy), _ = cv2.phaseCorrelate(ref, mm)
            iou = float((ref.astype(bool) & mm.astype(bool)).sum() / (ref.astype(bool) | mm.astype(bool)).sum())
            shift = math.hypot(dx, dy)
            worst_shift = max(worst_shift, shift); worst_iou = min(worst_iou, iou)
            print(f'   angle {ang:+3d}: {st:4s} vs off: shift {dx:+.2f},{dy:+.2f} device px ({shift/e.k:.2f} units), outline overlap {iou:.3f}')
    check('no jump between key light states (every state within 0.75 device px of "off", all aim angles)', worst_shift <= 0.75, f'worst {worst_shift:.2f} device px = {worst_shift/e.k:.2f} units at 3x')
    check('key light state outlines match (overlap >= 0.97)', worst_iou >= 0.97, f'worst {worst_iou:.3f}')
    # pivot: a rotated copy of the 0 degree art must land on the art drawn at that angle
    worst_rot = 1
    for ang in (-12, 20, 34):
        M = cv2.getRotationMatrix2D((ax, ay), -ang, 1.0)   # SVG rotate() is clockwise, OpenCV's is counter-clockwise
        rot = cv2.warpAffine(masks[('off', 0)].astype(np.uint8) * 255, M, (masks[('off', 0)].shape[1], masks[('off', 0)].shape[0])) > 127
        real = masks[('off', ang)]
        iou = float((rot & real).sum() / (rot | real).sum())
        worst_rot = min(worst_rot, iou)
    check('key head turns about the stand (pivot at the yoke): rotated art matches drawn art >= 0.95', worst_rot >= 0.95, f'worst {worst_rot:.3f}')
    a0 = masks[('off', 0)]
    on_art = a0[int(round(ay)), int(round(ax))]
    check('pivot point sits on the art (the yoke), not in empty canvas', on_art, f'pixel at pivot opaque: {bool(on_art)}')
    # evidence: states side by side at the two aim extremes
    strip = []
    for ang in (-12, 20, 34):
        row = [ims[(st, ang)].crop((int(ax - 40 * e.k), int(ay - 40 * e.k), int(ax + 40 * e.k), int(ay + 14 * e.k))) for st in ('off', 'on', 'dead')]
        strip.append(row)
    cw, ch_ = strip[0][0].size
    sheet = Image.new('RGB', (cw * 3 + 8, ch_ * 3 + 8), (246, 239, 224))
    for r, row in enumerate(strip):
        for c, t in enumerate(row):
            bg = Image.new('RGBA', t.size, (246, 239, 224, 255)); bg.alpha_composite(t); sheet.paste(bg.convert('RGB'), (c * (cw + 4), r * (ch_ + 4)))
    sheet.save(os.path.join(out, 'keylight-states.png'))
    e.close()

    # ---------------------------------------------------------------- 5. the puppet
    print('\n== 5. Ro: pose, walk, work/reach ==')
    e = Env(p, 430, 3)
    e.mount('transparent'); e.js("lab.iso('puppet')")
    X, Y = 184, 330
    e.js(f"lab.addPuppet({PUP},{X},{Y},false)")
    e.js(f"lab.addPuppet('paz',{{name:'Paz',dept:'art',look:{{skin:'#C99070',hair:'#7A2E1E',top:'bun'}}}},300,{Y},false)")
    n_rig = e.js("document.querySelectorAll('.wl-rig[data-character]').length")
    check('only Ro uses the fixed rig, other crew keep their own look', n_rig == 1, f'{n_rig} fixed-character puppet(s) on set')
    e.js("document.querySelector('#labCrew .pup:nth-child(2)').style.display='none'")
    ox, oy = e.px(X, Y)
    def frame(): return e.shot()
    def stats(im):
        m = mask(im, 128)
        # only Ro: keep the left half where he stands
        m[:, int(e.px(240, 0)[0]):] = False
        x0, y0, x1, y1 = bbox(m)
        return m, dict(x0=(x0 - ox) / e.k, x1=(x1 - ox) / e.k, top=(y0 - oy) / e.k, bottom=(y1 - oy) / e.k, comps=components(m))
    e.js(f"lab.cls('{CH}','')")
    idle_im = frame(); idle_m, idle = stats(idle_im)
    h_units = (idle['bottom'] - idle['top']) / 1.25
    check('idle: puppet stands on the ground mark (feet at y = 0, +-0.8 units)', abs(idle['bottom']) <= 0.8, f"feet {idle['bottom']:+.2f} units from the mark")
    check('idle: puppet height is in line with the other crew (44 to 52 puppet units)', 44 <= h_units <= 52, f'{h_units:.1f} puppet units tall')
    check('idle: one solid piece (no gaps at neck, shoulders, hips)', idle['comps'] == 1, f"{idle['comps']} piece(s)")
    idle_im.save(os.path.join(out, f'{CH}-idle.png'))

    def run(cls_name, cycle_ms, n):
        e.js(f"lab.cls('{CH}','{cls_name}')")
        frames = []
        for i in range(n):
            e.js(f"lab.freeze('{CH}',{i / n},{cycle_ms})")
            im = frame(); m, s = stats(im); frames.append((im, m, s))
        return frames
    work = run('working', 1200, 12)
    ws = [f[2] for f in work]
    check('work: one solid piece in all 12 frames (arm stays attached at the shoulder)', all(s['comps'] == 1 for s in ws), f"pieces per frame {[s['comps'] for s in ws]}")
    reach = max(s['x1'] for s in ws) - idle['x1']
    check('work: front arm reaches forward (>= 6 units past the idle silhouette)', reach >= 6.0, f'reaches {reach:.1f} units further')
    sway = max(s['top'] for s in ws) - min(s['top'] for s in ws)
    check('work: body stays planted (feet within 1.5 units of the mark)', all(abs(s['bottom']) <= 1.5 for s in ws), f"feet {min(s['bottom'] for s in ws):+.2f} to {max(s['bottom'] for s in ws):+.2f}")

    # filmstrips and GIFs, on the real set background
    def film(frames_im, name, gif_ms):
        crop = (int(ox - 34 * e.k), int(oy - 62 * e.k), int(ox + 38 * e.k), int(oy + 8 * e.k))
        tiles = []
        for im in frames_im:
            t = im.crop(crop); bg = Image.new('RGBA', t.size, (233, 214, 170, 255)); bg.alpha_composite(t); tiles.append(bg.convert('RGB'))
        sheet = Image.new('RGB', (tiles[0].width * len(tiles), tiles[0].height))
        for i, t in enumerate(tiles): sheet.paste(t, (i * tiles[0].width, 0))
        sheet.save(os.path.join(out, name + '-strip.png'))
        small = [t.resize((t.width // 2, t.height // 2), Image.LANCZOS) for t in tiles]
        small[0].save(os.path.join(out, name + '.gif'), save_all=True, append_images=small[1:], duration=gif_ms, loop=0, optimize=False)
    film([f[0] for f in work], f'{CH}-work', 100)
    errs = e.errors
    check('lab page logged no errors', not errs, '; '.join(errs[:3]))
    e.close()

    # ---------------------------------------------------------------- 5b. walking across the real set
    print('\n== 5b. Ro walking across the set, both directions, start and stop ==')
    e = Env(p, 430, 3)
    TRIPS = [((40, 334), (318, 300)), ((318, 300), (70, 250))]   # left to right along the front, then back up-left
    def walk_trip(bg, start, end, measure):
        e.mount(bg)
        if measure: e.js("lab.iso('puppet')")
        e.js(f"lab.addPuppet({PUP},{start[0]},{start[1]},false)")
        frames = [(e.shot(), {'x': start[0], 'y': start[1], 'moving': False, 'step': None, 'planted': None})]
        e.js(f"lab.walkTo('{CH}',{end[0]},{end[1]})")
        for _ in range(4000):
            st = e.js(f"lab.walkTick('{CH}', 1/60)")
            if st['changed']: frames.append((e.shot(), st))
            if not st['moving']: break
        return frames
    slides = []; bottoms = []; pops = []; spacing_bad = []; pieces_ok = True; per_step = []
    for (a, b) in TRIPS:
        fr = walk_trip('transparent', a, b, True)
        D = math.hypot(b[0] - a[0], b[1] - a[1])
        by_step = {}
        moving = [f for f in fr if f[1].get('moving')]
        for im, st in fr:
            m = mask(im, 128)
            if components(m) != 1: pieces_ok = False
            ys, xs = np.where(m)
            bottoms.append((ys.max() + 1) / e.k - 70 - st['y'])
            if st.get('moving') and st.get('planted'):
                sole = st['soles'][st['planted']]
                by_step.setdefault(st['step'], []).append(sole['x'])
        for k, xs_ in by_step.items():
            if len(xs_) >= 2: slides.append(max(xs_) - min(xs_))
        per_step.append(len(moving) / max(1, len(by_step) - 1))
        pts = [(f[1]['x'], f[1]['y']) for f in fr[1:]]
        gaps = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
        spacing_bad.append(max(gaps) - min(gaps))
        # starting and stopping: the change from standing to the first frame, and from the last frame to standing,
        # is no bigger than an ordinary frame-to-frame change
        def iou_shift(f0, f1):
            dxp = (f1[1]['x'] - f0[1]['x']) * e.k; dyp = (f1[1]['y'] - f0[1]['y']) * e.k
            M = np.float32([[1, 0, dxp], [0, 1, dyp]])
            m0 = cv2.warpAffine(mask(f0[0]).astype(np.uint8), M, (f0[0].width, f0[0].height)) > 0
            m1 = mask(f1[0])
            return float((m0 & m1).sum() / (m0 | m1).sum())
        seq = [iou_shift(fr[i], fr[i + 1]) for i in range(len(fr) - 1)]
        pops.append((seq[0], seq[-1], float(np.percentile(seq[1:-1], 10))))
        print(f'   trip {a} -> {b}: {D:.0f} units in {len(fr) - 1} frames, {len(by_step)} planted phases')
    step_len = 10
    check('walk: one solid piece in every frame of both trips', pieces_ok)
    check('walk: the planted foot does not slide (sole center moves < 0.25 units while planted)', max(slides) < 0.25, f'worst {max(slides):.3f} set units, against a step of about {step_len}')
    check('walk: feet on the floor in every frame (lowest point within 0.6 units of the mark)', max(abs(b) for b in bottoms) <= 0.6, f'{min(bottoms):+.2f} to {max(bottoms):+.2f} units')
    check('walk: steps matched to travel (even spacing, 4 poses per step)', max(spacing_bad) < 0.01 and all(abs(x - 4) < 0.6 for x in per_step), f'spacing varies {max(spacing_bad):.4f} units, {", ".join(f"{x:.1f}" for x in per_step)} frames per step')
    worst_pop = min(min(a_, b_) / p10 for a_, b_, p10 in pops)
    check('walk: starts and stops without a pop (first and last change within the range of ordinary frames)', worst_pop >= 0.98, 'start/stop overlap vs the 10th percentile of ordinary frames: ' + '; '.join(f'{a_:.3f}/{b_:.3f} vs {p10:.3f}' for a_, b_, p10 in pops))
    # evidence: both trips on the real set, as one GIF with holds at start and stop
    gif = []
    for (a, b) in TRIPS:
        fr = walk_trip('set', a, b, False)
        crop = (0, int((235 + 70) * e.k), int(360 * e.k), int((345 + 70) * e.k))
        tiles = [im.convert('RGB').crop(crop) for im, _ in fr]
        tiles = [tiles[0]] * 6 + tiles + [tiles[-1]] * 8
        gif += tiles
    small = [t.resize((t.width // 3, t.height // 3), Image.LANCZOS) for t in gif]
    small[0].save(os.path.join(out, f'{CH}-walk-set.gif'), save_all=True, append_images=small[1:], duration=83, loop=0)
    fr = walk_trip('transparent', (60, 330), (300, 330), True)
    strip = [f[0] for f in fr[1:17]]
    film_crop = None
    tiles = []
    for im in strip:
        m = mask(im, 40); x0, y0, x1, y1 = bbox(m)
        c = im.crop((int(x0 - 6 * e.k), int(y1 - 70 * e.k), int(x0 + 40 * e.k), int(y1 + 4 * e.k)))
        bg_ = Image.new('RGBA', c.size, (233, 214, 170, 255)); bg_.alpha_composite(c); tiles.append(bg_.convert('RGB'))
    sheet = Image.new('RGB', (sum(t.width for t in tiles), tiles[0].height), (233, 214, 170))
    x = 0
    for t in tiles: sheet.paste(t, (x, 0)); x += t.width
    sheet.save(os.path.join(out, f'{CH}-walk-strip.png'))
    e.close()

    # ---------------------------------------------------------------- 6. whole set at phone scale
    e = Env(p, 430, 3)
    e.mount('set'); e.js("lab.key('on',20)")
    for i, (c_, n_, d_) in enumerate((('ro', 'Ro', 'lighting'), ('mika', 'Mika', 'camera'), ('dani', 'Dani', 'grip'), ('lu', 'Lu', 'art'))):
        e.js(f"lab.addPuppet('{c_}',{{name:'{n_}',dept:'{d_}'}},{70 + 70 * i},300,false)")
        e.js(f"lab.cls('{c_}','working'); lab.freeze('{c_}',0.25,1200)")
    e.page.locator('#stage').screenshot(path=os.path.join(out, f'set-phone-3x.png' if CH == 'ro' else f'set-phone-3x-{CH}.png'))
    e.close()

fails = [r for r in results if not r[1]]
json.dump([{'check': n, 'pass': ok, 'detail': d} for n, ok, d in results], open(os.path.join(out, 'results.json'), 'w'), indent=2)
print(f'\n{len(results) - len(fails)}/{len(results)} checks passed')
sys.exit(1 if fails else 0)
