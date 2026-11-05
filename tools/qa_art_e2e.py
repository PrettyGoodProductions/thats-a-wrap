"""End-to-end check of the asset loader in a real browser (Chrome via Playwright).

  node build.mjs --art tests/fixtures/art --out /tmp/standin-dist
  python3 tools/qa_art_e2e.py /tmp/standin-dist/index.html /tmp/qa-shots --expect art

  node build.mjs --art /nonexistent --out /tmp/plain-dist
  python3 tools/qa_art_e2e.py /tmp/plain-dist/index.html /tmp/qa-plain --expect none

Plays a real shoot at 2x on a phone held sideways (or upright with --upright): title, office, job board, hire, shoot, ACTION, key light
failure, wrap. Samples the page while it runs, saves a screenshot the first time each state shows up, and
fails if a state never appears or the page logs any error.

--expect ro     the delivered batch (art/): platform, key light states, and Ro on the fixed-character rig.
                Hires Ro as gaffer and checks he walks, works, and is the only fixed character on set
--expect crew   the four delivered characters (batches 1 and 2): hires Ro, Mika, Dani and Lu, checks all four are on the
                fixed rig, each walks and works, and each hire card shows its own art
--expect art    stand-in art is built in: real images must draw, swap state with the simulation, and resolve
--expect none   no art delivered: no art slots may exist and the placeholders must play exactly as before
"""
import json, sys, time, os
from playwright.sync_api import sync_playwright

page_path, out_dir = sys.argv[1], sys.argv[2]
expect = sys.argv[sys.argv.index('--expect') + 1] if '--expect' in sys.argv else 'art'
os.makedirs(out_dir, exist_ok=True)

PROBE = """() => {
  const shown = el => { for (let n = el; n && n.nodeType === 1; n = n.parentNode) { if (n.getAttribute && n.getAttribute('display') === 'none') return false; if (n.hidden) return false; } return true; };
  const slot = id => document.querySelector(`[data-slot="${id}"]`);
  const stateShown = (id, st) => { const s = slot(id); if (!s) return false; const u = s.querySelector(`:scope > use[data-st="${st}"]`); return !!u && shown(u); };
  const resolves = el => { try { const b = el.getBBox(); return b.width > 0 && b.height > 0; } catch (e) { return false; } };
  const uses = [...document.querySelectorAll('#setSvg use[data-st]')].filter(u => shown(u));
  const ro = document.querySelector('#crewLayer .wl-rig[data-character="ro"]');
  const roPup = ro && ro.closest('.pup');
  const work = [...document.querySelectorAll('.wl-pose[data-part="crew.arm-front"] use[data-st="work"]')].filter(shown);
  const idleArms = [...document.querySelectorAll('.wl-pose[data-part="crew.arm-front"] use[data-st="default"]')].filter(shown);
  const cart = document.querySelectorAll('#cartBurger use');
  const chars = {};
  for (const ch of ['ro', 'mika', 'dani', 'lu']) {
    const rig = document.querySelector(`#crewLayer .wl-rig[data-character="${ch}"]`);
    const pup = rig && rig.closest('.pup');
    chars[ch] = {
      on: !!rig,
      walking: !!(pup && pup.classList.contains('walking') && /rotate/.test((pup.querySelector('.wl-r-leg-front') || {}).style ? pup.querySelector('.wl-r-leg-front').style.transform : '')),
      working: !!(pup && pup.classList.contains('working') && !pup.classList.contains('walking') && pup.getAnimations({ subtree: true }).some(a => a.animationName === 'rigReach')),
    };
  }
  // Batch 5 (Nov 5): the pieces the manifest marked Ready. A piece counts as "up" when its art is shown, resolves to a real size,
  // and the element the simulation drives is visible (opacity above zero)
  const artUp = id => { const s = slot(id); return !!s && [...s.querySelectorAll(':scope > use')].some(u => shown(u) && resolves(u)); };
  const op = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentNode) { const v = n.getAttribute && n.getAttribute('opacity'); if (v !== null && v !== undefined) o *= parseFloat(v); } return o; };
  const drivenUp = (elId, art) => { const el = document.getElementById(elId); return !!el && shown(el) && op(el) > 0.05 && art(el); };
  const useUp = el => [...el.querySelectorAll('use')].some(u => shown(u) && resolves(u));
  const hrefCount = key => [...document.querySelectorAll('#setSvg use')].filter(u => (u.getAttribute('href') || '') === '#wl-' + key && shown(u) && resolves(u)).length;
  const b5 = {
    flag: drivenUp('pc-flag', () => artUp('grip.flag')),
    rigPole: drivenUp('rig-pole', () => artUp('grip.rig-pole')),
    rigArm: drivenUp('rig-arm', () => artUp('grip.rig-arm')),
    rigFork: drivenUp('rig-fork', () => artUp('grip.rig-fork')),
    rigBottle: drivenUp('rig-bottle', () => artUp('grip.rig-bottle')),
    beam: drivenUp('beamArt', useUp),
    fillBeam: drivenUp('fillBeamArt', useUp),
    backlight: drivenUp('backLight', () => artUp('elec.backlight')),
    deadFx: drivenUp('dead', () => artUp('elec.dead-fx')),
    sparkle: drivenUp('sparkle', el => !!el.querySelector('.sprk.a use') && !!el.querySelector('.sprk.b use') && el.querySelector('.sprk.a').getAnimations().length > 0 && el.querySelector('.sprk.b').getAnimations().length > 0),
    bowlSauce: drivenUp('bowlSauce', useUp),
    // always on the set once drawn
    cart: artUp('art.table'), gear: artUp('grip.gear-pile'), monitor: artUp('village.monitor'), craft: artUp('crafty.table'),
    chairs: hrefCount('village-chair--default'), coffee: hrefCount('crafty-coffee--default'), bowl: hrefCount('art-sauce-bowl--empty'),
    // the live view is clipped to the delivered screen and the clip really is the art's inset
    monitorClip: (() => { const r = document.querySelector('#monClip rect'); return r ? [+r.getAttribute('width'), +r.getAttribute('height')] : null; })(),
  };
  return {
    chars, b5,
    slots: document.querySelectorAll('[data-slot]').length,
    platformShown: stateShown('grip.platform', 'default') && shown(document.getElementById('platform')),
    keyOff: stateShown('elec.keylight-head', 'off'),
    keyOn: stateShown('elec.keylight-head', 'on'),
    keyDead: stateShown('elec.keylight-head', 'dead'),
    placeholderFaceHidden: (() => { const p = slot('elec.keylight-head'); const ph = p && p.querySelector(':scope > .wl-ph'); return !!ph && ph.getAttribute('display') === 'none'; })(),
    workArm: work.length, idleArm: idleArms.length,
    puppets: document.querySelectorAll('#setSvg .wl-pose[data-part="crew.torso"]').length,
    cartLayers: cart.length,
    usesShown: uses.length,
    usesResolved: uses.filter(resolves).length,
    action: !!document.querySelector('#actionBtn.on'),
    chaos: !!document.querySelector('[data-choose]'),
    wrap: !!document.querySelector('#overlay:not([hidden]) [data-again]'),
    ro: !!ro, rigs: document.querySelectorAll('#crewLayer .wl-rig').length,
    roWalking: !!(roPup && roPup.classList.contains('walking') && /rotate/.test((roPup.querySelector('.wl-r-leg-front') || {}).style ? roPup.querySelector('.wl-r-leg-front').style.transform : '')),
    roWorking: !!(roPup && roPup.classList.contains('working') && !roPup.classList.contains('walking') && roPup.getAnimations({ subtree: true }).some(a => a.animationName === 'rigReach')),
  };
}"""

errors = []
notes = []
seen = {}
timeline = []

def snap(page, name, sel='#setWrap'):
    if name in seen:
        return
    seen[name] = round(time.time() - t0, 1)
    try:
        page.locator(sel).first.screenshot(path=os.path.join(out_dir, f'{name}.png'))
    except Exception as e:
        errors.append(f'screenshot {name} failed: {e}')

with sync_playwright() as p:
    try:
        b = p.chromium.launch(channel='chrome', args=['--no-sandbox'])
    except Exception:
        b = p.chromium.launch(args=['--no-sandbox'])   # Chrome is not installed here: Playwright's own Chromium is the same engine
    # The shoot plays in landscape. --upright plays it on an upright phone, where the game turns the shoot sideways
    vw, vh = (390, 844) if '--upright' in sys.argv else (844, 390)
    ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, has_touch=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    # Web fonts come from the internet and are blocked in some sandboxes. That is not a game error.
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') and 'Failed to load resource' not in m.text else None)
    t0 = time.time()
    page.goto('file://' + os.path.abspath(page_path))
    page.wait_for_selector('[data-go="office"]')
    page.screenshot(path=os.path.join(out_dir, '01-title.png'))
    page.click('[data-go="office"]')
    page.wait_for_selector('[data-jobs]')
    page.screenshot(path=os.path.join(out_dir, '02-office.png'))
    page.click('[data-jobs]')
    page.click('#modal [data-book]')   # the HQ also has a Continue job button with data-book
    page.click('[data-hire-screen]')
    page.wait_for_selector('#startBtn')

    for dept in ('grip', 'lighting', 'camera', 'art'):
        sel = f'[data-cands="{dept}"] [data-hire]:not([disabled])'
        if expect == 'ro' and dept == 'lighting' and page.locator('[data-hire="lighting:ro"]').count():
            page.click('[data-hire="lighting:ro"]')
            continue
        if expect == 'crew':
            want = {'lighting': 'ro', 'camera': 'mika', 'grip': 'dani', 'art': 'lu'}[dept]
            hire_sel = f'[data-hire="{dept}:{want}"]'
            if page.locator(hire_sel).count() == 0:
                page.click(f'[data-net="{dept}:yours"]') if page.locator(f'[data-net="{dept}:yours"]').count() else None
            if page.locator(hire_sel).count() == 0:
                errors.append(f'{want} is not on the hire screen for {dept}')
                continue
            if page.locator(hire_sel).is_disabled():
                notes.append(f'{want} is booked on this job, so she cannot be hired here (cover her in the Lab bench)')
                fb = f'[data-cands="{dept}"] [data-hire]:not([disabled])'
                if page.locator(fb).count() == 0:
                    page.click(f'[data-net="{dept}:fof"]')
                page.locator(fb).nth(page.locator(fb).count() - 1).click()
                continue
            page.click(hire_sel)
            continue
        if page.locator(sel).count() == 0:
            page.click(f'[data-net="{dept}:fof"]')
        n = page.locator(sel).count()
        page.locator(sel).nth(n - 1).click()  # cheapest, so the budget works
    if page.locator('#startBtn').is_disabled():
        errors.append('could not afford a crew in the harness, pick cheaper hires')
    page.locator('.hire-h').scroll_into_view_if_needed()
    page.screenshot(path=os.path.join(out_dir, '03-hire.png'), full_page=True)
    hire_probe = page.evaluate("() => ({ chosen: [...document.querySelectorAll('.hire-h ~ * .cand.on, .cand.sel, .cand.picked')].length, faces: document.querySelectorAll('.cand svg.face .wl-pose').length, uses: document.querySelectorAll('.cand svg.face use').length })")
    page.click('#startBtn')
    page.wait_for_selector('#setSvg')

    # 2x speed
    page.click('#pauseBtn')
    page.click('[data-speed="2"]')
    page.click('[data-resume]')

    final = {}
    peak = {'cartLayers': 0, 'usesResolved': 0, 'usesShown': 0, 'puppets': 0, 'workArm': 0, 'idleArm': 0, 'rigs': 0}
    b5seen = {}   # batch 5 piece -> highest value seen
    deadline = time.time() + 150
    chaos_taken = False
    walked, worked = set(), set()
    while time.time() < deadline:
        pr = page.evaluate(PROBE)
        final = pr
        for k in peak:
            peak[k] = max(peak[k], pr[k])
        for k, v in pr['b5'].items():
            if k == 'monitorClip': b5seen[k] = v; continue
            b5seen[k] = max(b5seen.get(k, 0), int(v))
        for k, name in (('flag', '30-flag'), ('rigPole', '31-rig-pole'), ('rigArm', '32-rig-arm'), ('rigFork', '33-rig-fork-cheese'), ('rigBottle', '34-rig-bottle-sauce'),
                        ('beam', '35-key-beam'), ('fillBeam', '36-fill-beam'), ('backlight', '37-backlight'), ('deadFx', '38-dead-fx'),
                        ('sparkle', '39-sparkle'), ('bowlSauce', '40-bowl-sauce')):
            if pr['b5'][k]: snap(page, name)
        if pr['platformShown']: snap(page, '10-platform')
        if pr['keyOn']: snap(page, '11-key-on')
        if pr['keyOff'] and pr['slots']: seen.setdefault('key-off-seen', round(time.time() - t0, 1))
        if pr['workArm']: snap(page, '12-crew-working')
        if pr['cartLayers'] >= 4: snap(page, '13-burger-stack')
        if pr['chaos'] and not chaos_taken:
            snap(page, '14-chaos-card', '#setWrap')
            page.locator('[data-choose]').first.click()
            chaos_taken = True
        if pr['keyDead']: snap(page, '15-key-dead')
        if pr['roWalking']: snap(page, '16-ro-walking')
        if pr['roWorking']: snap(page, '17-ro-working')
        for ch, st in pr['chars'].items():
            if st['walking']: snap(page, f'20-{ch}-walking'); walked.add(ch)
            if st['working']: snap(page, f'21-{ch}-working'); worked.add(ch)
        if pr['action']:
            page.click('#actionBtn')
        if pr['wrap']:
            break
        page.wait_for_timeout(350)
    page.screenshot(path=os.path.join(out_dir, '99-wrap.png'))
    b.close()

result = {'b5': b5seen, 'expect': expect, 'notes': notes, 'walked': sorted(walked), 'worked': sorted(worked), 'seconds': round(time.time() - t0, 1), 'seenAt': seen, 'peak': peak, 'hire': hire_probe, 'last': final, 'errors': errors[:20]}
print(json.dumps(result, indent=2))

problems = []
if errors: problems.append('page logged errors')
if not final.get('wrap'): problems.append('shoot never reached the wrap report')
if expect in ('ro', 'crew'):
    # Batch 5: every piece must have been seen up (its art shown, resolved, and driven visible by the simulation) at some point
    for k in ('flag', 'rigPole', 'rigArm', 'rigFork', 'rigBottle', 'beam', 'fillBeam', 'backlight', 'deadFx', 'sparkle', 'bowlSauce'):
        if not b5seen.get(k): problems.append(f'batch 5 piece never seen up on the set: {k}')
    for k, want in (('cart', 1), ('gear', 1), ('monitor', 1), ('craft', 1), ('chairs', 2), ('coffee', 1), ('bowl', 1)):
        if b5seen.get(k, 0) < want: problems.append(f'batch 5 piece missing from the set: {k} (saw {b5seen.get(k, 0)}, want {want})')
    mc = b5seen.get('monitorClip')
    if not mc or abs(mc[0] / mc[1] - 1.85) > 0.1: problems.append(f'monitor live view is not clipped to the delivered screen inset: {mc}')
if expect == 'ro':
    for need in ('10-platform', '11-key-on', '15-key-dead', 'key-off-seen', '16-ro-walking', '17-ro-working'):
        if need not in seen: problems.append(f'never saw: {need}')
    if peak['usesShown'] == 0 or peak['usesResolved'] < peak['usesShown']: problems.append('some delivered images did not resolve (use href broken)')
    if peak['rigs'] != 1: problems.append(f"expected exactly one fixed-character puppet on set, saw {peak['rigs']}")
    if hire_probe['uses'] == 0: problems.append('hire screen did not use Ro\'s art')
elif expect == 'crew':
    for need in ('10-platform', '11-key-on', '15-key-dead', 'key-off-seen'):
        if need not in seen: problems.append(f'never saw: {need}')
    hired = [c for c in ('ro', 'mika', 'dani', 'lu') if not any(n.startswith(c) for n in notes)]
    for ch in hired:
        if ch not in walked: problems.append(f'{ch} was never seen walking on the rig')
        if ch not in worked: problems.append(f'{ch} was never seen working (reach animation)')
    if peak['usesShown'] == 0 or peak['usesResolved'] < peak['usesShown']: problems.append('some delivered images did not resolve (use href broken)')
    if peak['rigs'] != len(hired): problems.append(f"expected {len(hired)} fixed-character puppets on set, saw {peak['rigs']}")
    if hire_probe['uses'] == 0: problems.append('hire screen did not use the delivered art')
elif expect == 'art':
    for need in ('10-platform', '11-key-on', '12-crew-working', '13-burger-stack', '15-key-dead', 'key-off-seen'):
        if need not in seen: problems.append(f'never saw: {need}')
    if peak['usesShown'] == 0 or peak['usesResolved'] < peak['usesShown']: problems.append('some delivered images did not resolve (use href broken)')
    if peak['puppets'] < 4: problems.append('puppet parts not drawn for the crew')
    if hire_probe['uses'] == 0: problems.append('hire screen faces did not use the delivered puppet')
else:
    if final.get('slots', 0) != 0 or peak['usesShown'] != 0 or hire_probe['uses'] != 0: problems.append('art slots exist even though no art was delivered')
print('PROBLEMS:' if problems else 'PASS', *problems, sep='\n  ')
sys.exit(1 if problems else 0)
