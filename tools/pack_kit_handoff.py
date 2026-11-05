"""Zip up what ChatGPT needs for the crew kit test batch.

  python3 tools/pack_kit_handoff.py <out.zip>

Run tools/make_kit_template.py and tools/kit_mix.py first if the art changed. The zip holds the request, the art
handoff, the roadmap, the template sheet with its data and guides, and reference pictures made from the game files.
"""
import os, sys, zipfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
TOP = 'Thats-A-Wrap-Crew-Kit-Template/'
files = {
    'docs/project/Crew-Kit-01-Request.md': 'Crew-Kit-01-Request.md',
    'docs/project/Art-Handoff-Nov5.md': 'Art-Handoff-Nov5.md',
    'docs/project/Content-Roadmap.md': 'Content-Roadmap.md',
    'docs/kit/crew-kit-template.png': 'crew-kit-template.png',
    'docs/kit/crew-kit-template.json': 'crew-kit-template.json',
    'docs/kit/lineup-delivered.png': 'reference/lineup-delivered.png',
    'docs/kit/mix-proof.png': 'reference/mix-proof.png',
    'docs/qa/tint-test/recolor-test.png': 'reference/recolor-test-flats.png',
}
for f in sorted(os.listdir(os.path.join(root, 'docs/kit/guides'))):
    files['docs/kit/guides/' + f] = 'guides/' + f
# Theo's parts as fitted in the game: the body the guides are drawn from, with the refitted pelvis
for part in ['head', 'torso', 'pelvis', 'arm-front', 'arm-back', 'leg-front', 'leg-back']:
    files[f'art/crew.theo.{part}@8x.png'] = f'reference/body-example-theo/crew.theo.{part}@8x.png'
README = """That's a Wrap! Crew Kit Template

Start with Art-Handoff-Nov5.md, then Crew-Kit-01-Request.md.

crew-kit-template.png    the mannequin, each slot's canvas and pivot, the head canvas, the key colors
crew-kit-template.json   the same numbers as data
guides/                  one guide per slot at 27 px per unit, transparent
reference/lineup-delivered.png      the eight delivered characters as the game assembles them
reference/mix-proof.png             twelve new people made from delivered parts, recolored in code
reference/recolor-test-flats.png    delivered flats recolored in code
reference/body-example-theo/        Theo's seven parts as fitted in the game (8 px per unit). The pelvis is the
                                    corrected one: as wide as the legs, no dark leg openings
Content-Roadmap.md       the plan behind the asks
"""
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr(TOP + 'README.txt', README)
    for src, dst in files.items():
        z.write(os.path.join(root, src), TOP + dst)
print(out, os.path.getsize(out) // 1024, 'KB,', len(files) + 1, 'files')
