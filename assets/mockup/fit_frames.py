"""Measure each mockup and write its true design size into the page.

The frame sizes were guessed before, so previews came out cropped mid-table or
padded with dead space. Measuring and writing the values means the frame is
always exactly as tall as the screen inside it.
"""
from playwright.sync_api import sync_playwright
import pathlib, re

BASE = pathlib.Path("/home/claude/lp3/presstropic_landing-main")
# the width each screen is rendered at — wide enough that its own layout does
# not collapse into a stacked, very tall arrangement
DESIGN_W = {"jobbuddy": 1280, "dispatch": 1280, "paper_stock": 1060, "job_register": 1180}

sizes = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w in DESIGN_W.items():
        # A short viewport, so scrollHeight reports what the content needs rather than
        # stretching to fill the window.
        pg = b.new_page(viewport={"width": w, "height": 200})
        pg.goto("file://" + str((BASE / "assets/mockup" / f"{name}.html").resolve()), wait_until="networkidle")
        pg.wait_for_timeout(600)
        # Ask the browser what the document actually needs, rather than guessing
        # from the furthest child — margins and padding on the last element are
        # easy to miss, and 18px of them is enough to leave a scrollbar.
        h = pg.evaluate("""() => {
            document.documentElement.style.overflow='visible';
            document.body.style.overflow='visible';
            return Math.ceil(document.documentElement.scrollHeight);
        }""")
        sizes[name] = (w, h)
        print(f"  {name:14s} {w} x {h}   aspect {w/h:.2f}")
        pg.close()
    b.close()

html = (BASE / "index.html").read_text()
for name, (w, h) in sizes.items():
    html = re.sub(r'(<iframe class="mock-frame" )data-w="\d+" data-h="\d+"( src="assets/mockup/%s\.html")' % name,
                  r'\1data-w="%d" data-h="%d"\2' % (w, h), html)
(BASE / "index.html").write_text(html)
print("\nwritten into index.html:", all(f'data-h="{h}"' in html for _, (w, h) in sizes.items()))
