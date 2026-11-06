"""Build people from the crew kit: pick pieces, recolor them, assemble them on the rig, or bake one for the game.

  python3 tools/kit_person.py art/_kit lineup out.png [--px 10] [--with ro,theo]     the twelve test people
  python3 tools/kit_person.py art/_kit sheet out.png                                 every piece in every color
  python3 tools/kit_person.py art/_kit bake <art folder> roster                      write the ten roster people as crew.<name>.*
  python3 tools/kit_person.py art/_kit bake <art folder> bo=2 ines=6                 write test recipe 2 as crew.bo.* and so on

A recipe names a base head, optional hair, hat, beard and glasses, a top and bottoms, and colors:
  {"head": "kit.head.a", "hair": "kit.hair.short", "top": "kit.top.tee", "bottoms": "kit.bottoms.shorts",
   "skin": "#A5663F", "hair_color": "#2A1D14", "top_color": "#3F6FA8", "bottoms_color": "#3B4A5E", "stature": 0.98}
Colors are optional: a piece keeps its drawn color when none is given. "stature" makes a person a little taller
or shorter (the catalog's value when left out).

Recoloring moves one color area at a time (tools/recolor_area.py). The kit's key colors say which area is which:
skin on heads, arms and legs, the top color on torso and sleeves, the bottoms color on pelvis and legs. Hair, beards
and hats are one area each. Eyes, mouths, glasses and shoes keep their colors.

Baking flattens the head layers into one head part and writes a normal fixed character (seven parts, plus
hair-back for long hair), so the game needs nothing new to show a kit person. Baked files are derived: delete
and re-bake them freely.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recolor_area import palette_of, recolor_areas, nearest, hex2lab

SKIN = {'porcelain': '#F6CFAE', 'fair': '#EDB58A', 'tan': '#D9965F', 'olive': '#BF8052', 'brown': '#9A5F3A', 'deep': '#6F4028'}
HAIR = {'black': '#2A1D14', 'brown': '#6B3F22', 'auburn': '#A6502A', 'blond': '#D9A441', 'gray': '#9A9794', 'white': '#DDD6CC'}
CLOTH = {'red': '#C9574A', 'blue': '#3F6FA8', 'mustard': '#E0A93B', 'plum': '#7B4B6A', 'teal': '#4F8C82', 'sage': '#8E9B6B', 'cream': '#E9DCC3', 'charcoal': '#4A4A52'}
BOTTOM = {'slate': '#5F6470', 'navy': '#3B4A5E', 'khaki': '#A8926A', 'olive': '#6B6B45', 'black': '#3A3A40'}

class Kit:
    def __init__(self, folder):
        self.dir = folder
        self.cat = json.load(open(os.path.join(folder, 'kit.json')))
        self.key = {k: hex2lab(v) for k, v in self.cat['key_colors'].items()}
        self._img, self._pal = {}, {}

    def image(self, piece):
        if piece not in self._img:
            self._img[piece] = Image.open(os.path.join(self.dir, f'{piece}@8x.png')).convert('RGBA')
            self._pal[piece] = palette_of(self._img[piece], 6)
        return self._img[piece], self._pal[piece]

    def family(self, pal, lab, join=11.0):
        lead = nearest(pal, lab)
        d = [np.sqrt((0.25 * (p[0] - pal[lead][0])) ** 2 + (p[1] - pal[lead][1]) ** 2 + (p[2] - pal[lead][2]) ** 2) for p in pal]
        return lead, [i for i in range(len(pal)) if i != lead and d[i] < join]

    def colored(self, piece, colors):
        """One piece with its areas moved to the recipe's colors. colors: {'skin': hex, 'hair': hex, 'top': hex, 'bottoms': hex, 'hat': hex}"""
        im, pal = self.image(piece)
        moves, follow = {}, {}
        for area in self.cat['pieces'][piece]['areas']:
            whole = area.endswith('*')
            name = area.rstrip('*')
            if not colors.get(name): continue
            if whole:
                lead, rest = 0, list(range(1, len(pal)))
            else:
                lead, rest = self.family(pal, self.key[name], 11.0 if name == 'skin' else 8.0)
            if lead in moves or lead in follow: continue
            moves[lead] = colors[name]
            for i in rest:
                if i not in moves: follow[i] = lead
        return recolor_areas(im, pal, moves, follow) if moves else im

    def layers(self, rec):
        """The recipe as a list of (layer, slot, image), back to front."""
        c = {'skin': rec.get('skin'), 'hair': rec.get('hair_color'), 'top': rec.get('top_color'), 'bottoms': rec.get('bottoms_color'), 'hat': rec.get('hat_color')}
        chosen = {}
        def take(piece):
            p = self.cat['pieces'][piece]
            chosen[p['layer']] = (p['slot'], self.colored(piece, c))
        take(rec['head'])
        for k in ('hair', 'hat', 'beard', 'glasses'):
            if rec.get(k): take(rec[k])
        if rec.get('hair') and self.cat['pieces'][rec['hair']].get('with_back'): take(self.cat['pieces'][rec['hair']]['with_back'])
        for bundle in (rec['top'], rec['bottoms']):
            for piece, p in self.cat['pieces'].items():
                if p.get('bundle') == bundle: take(piece)
        for a, b in self.cat.get('exclude', []):
            used = {rec.get(k) for k in ('hair', 'hat', 'beard', 'glasses')}
            if a in used and b in used: raise ValueError(f'{a} and {b} do not go together')
        return [(l, *chosen[l]) for l in self.cat['layers'] if l in chosen]

    def stature(self, rec):
        return float(rec.get('stature') or self.cat.get('stature', 1.0))

    def person(self, rec, R=10.0, joints=None):
        J = joints or self.cat['joints']
        W, H = int(34 * R), int(60 * R)
        ox, oy = W // 2, int(56 * R)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        R = R * self.stature(rec)   # the whole person scales about the feet
        k = R / self.cat['px_per_unit']
        for layer, slot, im in self.layers(rec):
            s = self.cat['slots'][slot]
            if abs(k - 1) > 1e-6: im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
            jx, jy = J[s['joint']]
            cv.alpha_composite(im, (round(ox + (jx - s['pivot'][0]) * R), round(oy + (jy - s['pivot'][1]) * R)))
        return cv

    def bake(self, rec, name, out):
        """Write the recipe as a fixed character the game can load: crew.<name>.<part>@8x.png and the settings files."""
        PX = self.cat['px_per_unit']
        parts = {}
        for layer, slot, im in self.layers(rec):
            role = 'hair-back' if layer == 'hair-back' else slot
            if role in parts: parts[role].alpha_composite(im)   # beard, hair, glasses and hat land on the head
            else: parts[role] = im.copy()
        st = self.stature(rec)
        J = {k: [round(v[0] * st, 2), round(v[1] * st, 2)] for k, v in self.cat['joints'].items()}
        for role, im in parts.items():
            slot = 'head' if role == 'hair-back' else role
            pv = [v * PX for v in self.cat['slots'][slot]['pivot']]
            a = np.asarray(im)[..., 3] >= 8
            ys, xs = np.where(a)
            x0, y0, x1, y1 = max(0, xs.min() - 4), max(0, ys.min() - 4), min(im.width, xs.max() + 5), min(im.height, ys.max() + 5)
            im = im.crop((x0, y0, x1, y1))
            cfg = {'pivot': [round(float(pv[0] - x0), 1), round(float(pv[1] - y0), 1)], 'scale': round(PX / st, 3)}
            if role.startswith('leg-'):
                # the bottom outline of the shoe, as prep_art writes it, so the walk keeps the planted foot down
                al = np.asarray(im)[..., 3] >= 128
                bottom = int(np.where(al.any(1))[0].max())
                cols = [x for x in range(al.shape[1]) if al[:, x].any() and np.where(al[:, x])[0].max() >= bottom - 4 * PX]
                pts = [[int(x), int(np.where(al[:, x])[0].max()) + 1] for x in cols]
                keep = sorted({0, len(pts) - 1, *range(0, len(pts), max(1, len(pts) // 8))})
                cfg['sole'] = [pts[i] for i in keep]
            im.save(os.path.join(out, f'crew.{name}.{role}@8x.png'), optimize=True)
            json.dump(cfg, open(os.path.join(out, f'crew.{name}.{role}.json'), 'w'), indent=2)
        head = parts['head']; hp = self.cat['slots']['head']['pivot']
        a = np.asarray(head)[..., 3] >= 128
        ys, xs = np.where(a)
        left = J['neck'][0] + (xs.min() / PX - hp[0]) * st; top = J['neck'][1] + (ys.min() / PX - hp[1]) * st
        w = (xs.max() + 1 - xs.min()) / PX * st; h = (min(ys.max() + 1, hp[1] * PX) - ys.min()) / PX * st   # down to the neck, not the long hair
        char = {'scale': round(PX / st, 3), 'fixed': True, 'joints': J, 'portrait': [round(float(left - 3), 2), round(float(top - 3), 2), round(float(w + 6), 2), round(float(h + 6.5), 2)],
                'order': {'upper': ['torso', 'arm-back', 'head', 'arm-front']}, 'note': 'Baked from the crew kit by tools/kit_person.py: ' + json.dumps(rec)}
        json.dump(char, open(os.path.join(out, f'crew.{name}.json'), 'w'), indent=2)
        return sorted(parts)

TEE, SHORTS = 'kit.top.tee', 'kit.bottoms.shorts'
A_, B_ = 'kit.head.a', 'kit.head.b'
def R_(head, hair=None, hat=None, beard=False, glasses=False, skin=None, hc=None, top=None, bot=None, hatc=None):
    return {'head': head, 'hair': hair and 'kit.hair.' + hair, 'hat': hat and 'kit.hat.' + hat, 'beard': 'kit.face.beard' if beard else None,
            'glasses': 'kit.face.glasses' if glasses else None, 'top': TEE, 'bottoms': SHORTS,
            'skin': skin and SKIN[skin], 'hair_color': hc and HAIR[hc], 'top_color': top and CLOTH[top], 'bottoms_color': bot and BOTTOM[bot], 'hat_color': hatc and CLOTH[hatc]}
# Twelve fixed test people: both heads, every hair, the allowed hat combinations, six skin tones
PEOPLE = [
    R_(A_, 'short', skin='porcelain', hc='black', top='blue', bot='navy'),
    R_(B_, 'curly', glasses=True, skin='brown', hc='gray', top='mustard', bot='slate'),
    R_(A_, 'long', skin='tan', hc='auburn', top='teal', bot='khaki'),
    R_(B_, None, beard=True, skin='deep', hc='black', top='red', bot='black'),
    R_(A_, 'short', hat='cap', skin='olive', hc='brown', top='cream', bot='olive', hatc='red'),
    R_(A_, 'curly', skin='deep', hc='black', top='plum', bot='slate'),
    R_(B_, 'long', glasses=True, skin='fair', hc='white', top='sage', bot='navy'),
    R_(A_, None, hat='cap', beard=True, skin='fair', hc='auburn', top='charcoal', bot='khaki'),
    R_(B_, 'short', beard=True, glasses=True, skin='olive', hc='brown', top='blue', bot='black'),
    R_(A_, 'curly', glasses=True, skin='tan', hc='blond', top='red', bot='slate'),
    R_(B_, 'short', hat='cap', skin='brown', hc='black', top='mustard', bot='navy', hatc='teal'),
    R_(A_, 'long', beard=True, skin='porcelain', hc='blond', top='plum', bot='olive'),
]

# The ten roster members with no hand-drawn art, as kit recipes close to the looks the game describes for them.
# Tees take the department color, as the code-drawn crew do. The kit has no beanie, beret or bun yet, so those
# looks use the nearest piece.
DEPT = {'grip': '#8EA3C2', 'lighting': '#E7B84F', 'camera': '#8FB1A3', 'art': '#E59380'}
def P_(dept, **kw):
    r = R_(**kw); r['top_color'] = DEPT[dept]; return r
ROSTER = {
    'bo':    P_('lighting', head=B_, hat='cap', beard=True, skin='deep', hc='black', bot='black', hatc='blue'),
    'lee':   P_('lighting', head=A_, hair='short', skin='fair', hc='brown', bot='navy'),
    'ines':  P_('camera', head=B_, hair='long', glasses=True, skin='tan', hc='black', bot='slate'),
    'sam':   P_('camera', head=A_, hair='curly', glasses=True, skin='porcelain', hc='auburn', bot='khaki'),
    'max':   P_('grip', head=B_, hair='short', hat='cap', beard=True, skin='tan', hc='brown', bot='olive', hatc='charcoal'),
    'chuy':  P_('grip', head=A_, hair='short', hat='cap', skin='brown', hc='black', bot='navy', hatc='mustard'),
    'vera':  P_('art', head=B_, hair='long', skin='tan', hc='brown', bot='black'),
    'paz':   P_('art', head=A_, hair='long', skin='olive', hc='auburn', bot='slate'),
    'kit':   P_('art', head=A_, hair='curly', skin='fair', hc='black', bot='khaki'),
    'jules': P_('art', head=B_, hat='cap', glasses=True, skin='deep', hc='black', bot='navy', hatc='plum'),
}
ROSTER['kit']['hair_color'] = '#2E7D6B'   # Kit has teal hair

def font(size, bold=False):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans' + ('-Bold' if bold else '') + '.ttf', size)

if __name__ == '__main__':
    kit = Kit(sys.argv[1]); mode = sys.argv[2]
    opt = lambda n, d=None: sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
    if mode == 'lineup':
        import subprocess
        R = float(opt('--px', 10))
        cells = [kit.person(p, R) for p in PEOPLE]
        refs = [n for n in (opt('--with', '') or '').split(',') if n]
        ref = None
        if refs:
            tmp = sys.argv[3] + '.ref.png'
            subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'char_sheet.py'), os.path.dirname(kit.dir.rstrip('/')) or 'art', tmp, *refs, '--px', str(int(R))], check=True, capture_output=True)
            ref = Image.open(tmp).convert('RGBA'); os.remove(tmp)
        cols = 6
        cw, ch = cells[0].size
        rw = ref.width if ref else 0
        sheet = Image.new('RGB', (rw + cols * cw, 2 * ch), '#8C8C8C')
        if ref:
            # the references sit on the top row's floor line (char_sheet draws feet 58 units down, the kit 56)
            sheet.paste(ref, (0, round((56 - 58) * R)), ref)
        for i, c in enumerate(cells):
            sheet.paste(c, (rw + (i % cols) * cw, (i // cols) * ch), c)
        sheet.save(sys.argv[3]); print(sys.argv[3], sheet.size)
    elif mode == 'bake':
        out = sys.argv[3]
        for spec in sys.argv[4:]:
            if spec == 'roster':
                for name, rec in ROSTER.items(): print(name, kit.bake(rec, name, out))
                continue
            name, i = spec.split('=')
            print(name, 'recipe', i, kit.bake(PEOPLE[int(i)], name, out))
    elif mode == 'sheet':
        # every piece across the palettes: heads and limbs by skin, hair by hair color, garments by color
        rows = []
        k = 1
        def row(label, pieces, key, pal):
            cells = []
            for piece in pieces:
                cells.append(kit.image(piece)[0])
                cells += [kit.colored(piece, {key: v}) for v in pal.values()]
            rows.append((label, cells, 1 + len(pal)))
        row('skin', ['kit.head.a', 'kit.head.b', 'kit.top.tee.arm-front', 'kit.bottoms.shorts.leg-front'], 'skin', SKIN)
        row('hair', ['kit.hair.short', 'kit.hair.curly', 'kit.hair.long', 'kit.face.beard'], 'hair', HAIR)
        row('top', ['kit.top.tee.torso', 'kit.top.tee.arm-front'], 'top', dict(list(CLOTH.items())[:6]))
        row('bottoms', ['kit.bottoms.shorts.pelvis', 'kit.bottoms.shorts.leg-front'], 'bottoms', {**BOTTOM, 'red': CLOTH['red']})
        row('hat', ['kit.hat.cap'], 'hat', dict(list(CLOTH.items())[:6]))
        tile = 150
        W = 7 * tile * 2; H = sum(-(-len(c) // 14) for _, c, _ in rows) * tile
        sheet = Image.new('RGB', (W, H), '#8C8C8C'); y = 0
        for label, cells, per in rows:
            for i, im in enumerate(cells):
                a = np.asarray(im)[..., 3] >= 8; ys, xs = np.where(a)
                im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); im.thumbnail((tile - 12, tile - 12), Image.LANCZOS)
                sheet.paste(im, ((i % 14) * tile + (tile - im.width) // 2, y + (i // 14) * tile + (tile - im.height) // 2), im)
            y += -(-len(cells) // 14) * tile
        sheet.save(sys.argv[3]); print(sys.argv[3], sheet.size)
