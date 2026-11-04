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
  return {
    chars,
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
    b = p.chromium.launch(channel='chrome', args=['--no-sandbox'])
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
    page.click('[data-book]')
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
    deadline = time.time() + 150
    chaos_taken = False
    walked, worked = set(), set()
    while time.time() < deadline:
        pr = page.evaluate(PROBE)
        final = pr
        for k in peak:
            peak[k] = max(peak[k], pr[k])
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

result = {'expect': expect, 'notes': notes, 'walked': sorted(walked), 'worked': sorted(worked), 'seconds': round(time.time() - t0, 1), 'seenAt': seen, 'peak': peak, 'hire': hire_probe, 'last': final, 'errors': errors[:20]}
print(json.dumps(result, indent=2))

problems = []
if errors: problems.append('page logged errors')
if not final.get('wrap'): problems.append('shoot never reached the wrap report')
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
