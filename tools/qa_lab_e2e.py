"""Plays the Layout Lab in a real browser with real taps, the way a person would.

  node build.mjs
  python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab port
  python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab land
  python3 tools/qa_lab_e2e.py dist/index.html /tmp/qa-lab land-rot

Scenarios
  port       portrait layout on a 390x844 phone
  land       landscape layout on an 844x390 phone
  land-rot   landscape layout on a 390x844 phone (rotation locked), so the game turns the shoot sideways itself
  land-tab   landscape layout on a 1280x800 tablet (the larger HUD tier)

Every tap goes through document.elementFromPoint first, so a station that is covered by something else and cannot
actually be tapped fails the run. The bot taps the crew member who is asking for orders, then a lit-up station.
It plays at 2x speed, answers the chaos card, calls ACTION the moment it lights up, and fails on any page error,
on a shoot that does not finish, or on a layout that overflows the screen.
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright


def _launch(p):
    """Chrome if it is installed, else Playwright's own Chromium (the same engine)"""
    try:
        return p.chromium.launch(channel='chrome', args=['--no-sandbox'])
    except Exception:
        return p.chromium.launch(args=['--no-sandbox'])

page_path, out_dir, scenario = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
VIEW = {'port': (390, 844), 'land': (844, 390), 'land-rot': (390, 844), 'land-tab': (1280, 800)}[scenario]
LAYOUT = 'port' if scenario == 'port' else 'land'

# A point inside the element that really belongs to it (nothing is covering it), in viewport coordinates
FIND_POINT = """(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  for (let fy = 0.5; fy <= 0.95; fy += 0.15) for (let fx = 0.5; fx <= 0.95; fx += 0.15) {
    for (const [ax, ay] of [[fx, fy], [1 - fx, fy], [fx, 1 - fy], [1 - fx, 1 - fy]]) {
      const x = r.left + r.width * ax, y = r.top + r.height * ay;
      const top = document.elementFromPoint(x, y);
      if (top === el || (top && el.contains(top))) return [x, y];
    }
  }
  return null;
}"""

OVERFLOW = """() => {
  const d = document.documentElement;
  const s = document.getElementById('screen-shoot');
  const r = s.getBoundingClientRect();
  return { scrollW: d.scrollWidth, scrollH: d.scrollHeight, innerW: innerWidth, innerH: innerHeight,
           left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom),
           rot: document.body.classList.contains('rot') };
}"""

errors, shots_taken = [], set()

def snap(page, name):
    if name in shots_taken: return
    shots_taken.add(name)
    page.screenshot(path=os.path.join(out_dir, f'{scenario}-{name}.png'))

with sync_playwright() as p:
    b = _launch(p)
    ctx = b.new_context(viewport={'width': VIEW[0], 'height': VIEW[1]}, device_scale_factor=2, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    # The sandbox blocks Google Fonts, which is not a game error. Everything else counts.
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'ERR_NAME' not in m.text else None)
    page.goto('file://' + os.path.abspath(page_path))

    def tap(sel):
        pt = page.evaluate(FIND_POINT, sel)
        if not pt: return False
        page.mouse.click(pt[0], pt[1])
        return True

    page.click('[data-go="office"]')
    snap(page, '1-office')
    page.click('[data-lab]')
    snap(page, '2-lab-home')
    page.click(f'[data-labstart="{LAYOUT}"]')
    page.wait_for_selector('#setSvg')
    time.sleep(0.4)
    snap(page, '3-shoot-start')
    if LAYOUT == 'land' and page.query_selector('#shotsTab'):
        # The shot list pop-up uses the panel frame and the polaroid thumbnails, so look at it open
        page.click('#shotsTab'); page.wait_for_timeout(300)
        snap(page, '3b-shot-list')
        page.click('[data-shotsclose]'); page.wait_for_timeout(200)
    ov = page.evaluate(OVERFLOW)
    # Game speed 2x through the real pause menu
    page.click('#pauseBtn'); page.click('[data-speed="2"]'); page.click('[data-resume]')

    stats = {'orders_tapped': 0, 'untappable': 0, 'chaos_answered': 0, 'actions': 0, 'picked_on_set': 0, 'picked_on_bar': 0, 'puppet_covered': 0}
    chaos_fit = None
    t0 = time.time()
    done = False
    while time.time() - t0 < 240:
        time.sleep(0.25)
        # Wrap card ends the run
        if page.locator('#overlay:not([hidden]) .chaos-h b', has_text='run done').count():
            done = True
            break
        # Chaos card: choose the fix
        if page.locator('#overlay:not([hidden]) [data-choose="fix"]').count():
            snap(page, '5-chaos')
            chaos_fit = page.evaluate("""() => { const o = [...document.querySelectorAll('#overlay:not([hidden]) .opt')].map(e => e.getBoundingClientRect());
              const m = document.getElementById('modal').getBoundingClientRect();
              return { optionsInView: o.every(r => r.top >= 0 && r.bottom <= innerHeight), modalTop: Math.round(m.top), modalBottom: Math.round(m.bottom), innerH: innerHeight }; }""")
            page.click('[data-choose="fix"]'); stats['chaos_answered'] += 1
            continue
        if page.locator('#overlay:not([hidden])').count():
            continue
        # ACTION as soon as it lights up
        if page.locator('#actionBtn.on').count():
            if tap('#actionBtn'): stats['actions'] += 1; snap(page, '6-action')
            continue
        # Someone asking for orders: tap them (set puppet or crew tile), then a lit-up station
        asking_tile = page.locator('.cb.ask')
        if asking_tile.count():
            cid = asking_tile.first.get_attribute('data-crew')
            # Alternate between tapping the person on the set and their tile, so both routes are proven tappable
            use_set = (stats['orders_tapped'] % 2 == 0)
            if use_set and tap(f'.pup[data-crew="{cid}"]'):
                stats['picked_on_set'] += 1
            else:
                if use_set: stats['puppet_covered'] += 1
                if not tap(f'.cb[data-crew="{cid}"]'):
                    stats['untappable'] += 1; continue
                stats['picked_on_bar'] += 1
            time.sleep(0.12)
            snap(page, '4-selected')
            target = None
            for cls in ('hit-go', 'hit-slow'):
                n = page.locator(f'.station-hit.{cls}').count()
                for i in range(n):
                    st = page.locator(f'.station-hit.{cls}').nth(i).get_attribute('data-station')
                    if page.evaluate(FIND_POINT, f'.station-hit[data-station="{st}"]'):
                        target = st; break
                    stats['untappable'] += 1
                if target: break
            if target:
                tap(f'.station-hit[data-station="{target}"]'); stats['orders_tapped'] += 1
            else:
                page.mouse.click(2, 2)  # nothing to do, drop the selection
    snap(page, '7-wrap')
    lab = page.evaluate("() => JSON.parse(localStorage.getItem('thats-a-wrap-save-v1')).lab")
    result = (lab.get(LAYOUT) or [None])[-1]
    page.screenshot(path=os.path.join(out_dir, f'{scenario}-final.png'))
    b.close()

report = {'scenario': scenario, 'finished': done, 'overflow': ov, 'chaos_fit': chaos_fit, 'bot': stats, 'result': result, 'errors': errors}
print(json.dumps(report, indent=1))
problems = []
if not done: problems.append('shoot did not finish')
if errors: problems.append('page errors')
if ov['scrollW'] > ov['innerW'] + 1 and not ov['rot']: problems.append('horizontal overflow')
if stats['untappable']: problems.append(f"{stats['untappable']} targets were covered and could not be tapped")
if result and result['shots'] < 3: problems.append('not all shots captured')
if chaos_fit and not chaos_fit['optionsInView']: problems.append('chaos card options do not fit on screen')
if problems:
    print('FAIL: ' + '; '.join(problems)); sys.exit(1)
print('OK')
