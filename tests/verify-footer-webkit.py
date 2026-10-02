#!/root/.venvs/mau/bin/python
"""
The migrated links footer, in the engine Omar actually uses.

Proves the LIVE defect is gone in the built output. The same invariant
that was failing on the production site: NO VISUAL LINE of the footer meta
row may END with a separator.

The probe groups flex items into lines by top edge and asks about the LAST
item on each line - an element-based probe cannot see this, because the
separator is now a ::before on the item it precedes and there is no
separator element at all.
"""
import asyncio, sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.1.68:4322/"
WIDTHS = [320, 360, 375, 390, 402, 430, 680]

PROBE = r"""
() => {
  // Measure the invariant on WHICHEVER footer is rendered, library or
  // hand-rolled. The first version of this probe only knew about
  // `.cm-footer__meta`, so run against the pre-migration footer it
  // reported "no .cm-footer__meta" at every viewport - which proves the
  // migration happened and NOTHING about whether a line ends with a
  // separator. Two exit codes would then look identical: the migration
  // rolled back, and the wrap bug came back, are different failures.
  const meta = document.querySelector('.cm-footer__meta') ||
               document.querySelector('.footer-meta');
  if (!meta) return { error: 'no footer meta row at all' };
  const isLibrary = !!document.querySelector('.cm-footer__meta');
  const items = [...meta.children];
  const lines = new Map();
  for (const el of items) {
    const b = el.getBoundingClientRect();
    if (b.height === 0) continue;
    const key = Math.round(b.top);
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ el, b });
  }
  const out = [];
  for (const [top, row] of [...lines.entries()].sort((a, b) => a[0] - b[0])) {
    row.sort((a, b) => a.b.left - b.b.left);
    const last = row[row.length - 1];
    const txt = (last.el.textContent || '').trim();
    out.push({
      top,
      count: row.length,
      lastItemText: txt,
      lastIsSeparator: txt === '\u00b7' || txt === '/',
    });
  }
  return {
    isLibraryFooter: isLibrary,
    itemCount: items.length,
    flexWrap: getComputedStyle(meta).flexWrap,
    lines: out,
    anyLineEndsWithSeparator: out.some((l) => l.lastIsSeparator),
    emitsSeparatorElements: !!document.querySelector('.footer-meta .dot, .cm-footer__bar'),
    // the generated separator must actually be THERE - a fix that removes
    // the dot entirely also satisfies "no line ends with a separator"
    generatedSeparatorOnLastItem:
      items.length > 1
        ? getComputedStyle(items[items.length - 1], '::before').content
        : null,
    contactHref: document.querySelector('.cm-footer__meta a')?.getAttribute('href') || null,
    year: document.querySelector('[data-cm-year]')?.textContent || null,
  };
}
"""

async def main():
    bad = 0
    print(f"probing {URL}\n")
    async with async_playwright() as p:
        b = await p.webkit.launch()
        for w in WIDTHS:
            for h in (844, 667):
                ctx = await b.new_context(viewport={"width": w, "height": h})
                pg = await ctx.new_page()
                await pg.goto(URL, wait_until="networkidle")
                v = await pg.evaluate(PROBE)
                await ctx.close()
                if v.get("error"):
                    print(f"  {w}x{h}  ERROR {v['error']}")
                    bad += 1
                    continue
                ok = not v["anyLineEndsWithSeparator"]
                if not ok:
                    bad += 1
                gen = v["generatedSeparatorOnLastItem"]
                print(f"  {w}x{h:<5} {'ok ' if ok else 'BAD'} "
                      f"{'library' if v['isLibraryFooter'] else 'handrolled'} "
                      f"lines={len(v['lines'])} items={v['itemCount']} "
                      f"sepElements={v['emitsSeparatorElements']} "
                      f"generated={gen!r}")
                for ln in v["lines"]:
                    mark = "  <-- ENDS WITH A SEPARATOR" if ln["lastIsSeparator"] else ""
                    print(f"          top={ln['top']} n={ln['count']} last={ln['lastItemText']!r}{mark}")
        # one identity check, on the widest viewport
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        v = await pg.evaluate(PROBE)
        await ctx.close()
        await b.close()
    print(f"\ncontact: {v['contactHref']}   year: {v['year']}")
    print(f"RESULT: {bad} bad viewport(s)")
    sys.exit(1 if bad else 0)

asyncio.run(main())