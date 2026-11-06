"""Zip up what ChatGPT needs for the next crew kit batch.

  python3 tools/pack_kit_handoff.py <out.zip>

Run tools/make_kit_template.py and tools/kit_person.py (lineup, sheet) first if the kit changed. The zip holds the
Kit 01 validation, the Kit 02 request, the art handoff, the roadmap, template A2 with its data and guides, the
fitted Kit 01 pieces to draw against, and reference pictures made from the game files.
"""
import os, sys, zipfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
TOP = 'Thats-A-Wrap-Crew-Kit-A2/'
files = {
    'docs/project/Art-Handoff-Nov5.md': 'Art-Handoff-Nov5.md',
    'docs/project/Crew-Kit-01-Validation.md': 'Crew-Kit-01-Validation.md',
    'docs/project/Crew-Kit-02-Request.md': 'Crew-Kit-02-Request.md',
    'docs/project/Content-Roadmap.md': 'Content-Roadmap.md',
    'docs/kit/crew-kit-template.png': 'crew-kit-template.png',
    'docs/kit/crew-kit-template.json': 'crew-kit-template.json',
    'docs/kit/lineup-12.png': 'reference/lineup-12.png',
    'docs/kit/before-after.png': 'reference/before-after.png',
    'docs/kit/head-layers.png': 'reference/head-layers.png',
    'docs/kit/recolor-sheet.png': 'reference/recolor-sheet.png',
    'docs/kit/lineup-delivered.png': 'reference/lineup-delivered.png',
    'docs/qa/kit01/shoot-tablet.webp': 'reference/in-game-shoot.webp',
    'docs/qa/kit01/hire-cards.webp': 'reference/in-game-hire-cards.webp',
}
for f in sorted(os.listdir(os.path.join(root, 'docs/kit/guides'))):
    files['docs/kit/guides/' + f] = 'guides/' + f
for f in sorted(os.listdir(os.path.join(root, 'art/_kit'))):
    files['art/_kit/' + f] = 'kit01-fitted/' + f
README = """That's a Wrap! Crew Kit A2

Start with Art-Handoff-Nov5.md, then Crew-Kit-01-Validation.md, then Crew-Kit-02-Request.md.

crew-kit-template.png    template A2: the mannequin, each slot's canvas and pivot, the shoe zone, the key colors
crew-kit-template.json   the same numbers as data
guides/                  one guide per slot at 27 px per unit, transparent
kit01-fitted/            the 15 Kit 01 pieces as the game uses them (8 px per unit, A2 canvases) and their catalog.
                         The tee and shorts are the body to draw new pieces against. kit.head.a is the skull every
                         new face and hair has to fit
reference/lineup-12.png          twelve people built from Kit 01, next to Ro and Theo
reference/before-after.png       Kit 01 as delivered on template A, and after the A2 fit
reference/head-layers.png        every head layer combination on both heads
reference/recolor-sheet.png      every piece across the skin, hair and clothing palettes
reference/lineup-delivered.png   the eight hand-designed characters as the game assembles them
reference/in-game-*.webp         kit crew in the game: on set, and on the hire cards
Content-Roadmap.md       the plan behind the asks
"""
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr(TOP + 'README.txt', README)
    for src, dst in files.items():
        z.write(os.path.join(root, src), TOP + dst)
print(out, os.path.getsize(out) // 1024, 'KB,', len(files) + 1, 'files')
