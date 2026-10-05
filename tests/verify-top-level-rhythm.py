"""Every top-level block on links must sit on the library's rhythm.

The stack owns the gap between top-level blocks. A page-local
`margin-top` on one of those blocks stacks on top of that gap, so the
join measures gap + margin and that page alone reads wider than the
rest of the site. This measured exactly that: 56px joins where every
other page reads 24px.

Measures the built page in WebKit at Omar's iPhone viewport, because
WebKit is the engine he reviews on.
"""

import asyncio
import sys

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.1.68:4403/"
EXPECTED = 24.0
VIEWPORTS = [(320, "small"), (390, "iphone"), (402, "iphone-max"), (768, "tablet")]

JS = """() => {
  const main = document.querySelector('main');
  if (!main) return {error: 'no <main>'};
  const cs = getComputedStyle(main);
  if (!cs.display.includes('flex'))
    return {error: '<main> is not a flex stack, so nothing owns the rhythm',
            cls: main.className, display: cs.display};

  // A stack child that still carries a vertical margin is the failure
  // mode: its margin adds to the gap the stack already applies.
  const kids = [...main.children].filter((e) => {
    const c = getComputedStyle(e);
    return c.display !== 'none' &&
           c.position !== 'sticky' && c.position !== 'fixed';
  });
  const offenders = [];
  const joins = [];
  for (let i = 1; i < kids.length; i++) {
    const a = kids[i - 1].getBoundingClientRect();
    const b = kids[i].getBoundingClientRect();
    joins.push(Math.round((b.top - a.bottom) * 10) / 10);
  }
  for (const e of kids) {
    const c = getComputedStyle(e);
    const mt = parseFloat(c.marginTop), mb = parseFloat(c.marginBottom);
    if (mt > 0 || mb > 0) {
      offenders.push({
        el: e.tagName.toLowerCase() + '.' + (e.className.split(' ')[0] || '(none)'),
        mt: c.marginTop, mb: c.marginBottom,
      });
    }
  }
  return {cls: main.className, gap: cs.gap, n: kids.length,
          joins: joins, offenders: offenders};
}"""


async def main():
    failures = []
    async with async_playwright() as pw:
        browser = await pw.webkit.launch()
        for width, label in VIEWPORTS:
            ctx = await browser.new_context(
                viewport={"width": width, "height": 874})
            page = await ctx.new_page()
            await page.goto(BASE_URL, wait_until="networkidle", timeout=45000)
            await page.wait_for_timeout(600)
            r = await page.evaluate(JS)

            if "error" in r:
                failures.append(f"  {width}px: {r['error']}")
                print(f"FAIL {width}px ({label}): {r['error']}")
                await ctx.close()
                continue

            bad = [j for j in r["joins"] if abs(j - EXPECTED) > 0.5]
            if bad:
                failures.append(
                    f"  {width}px: joins {bad} != {EXPECTED} "
                    f"(stack gap is {r['gap']})")
            if r["offenders"]:
                failures.append(
                    f"  {width}px: stack children carry their own margin: "
                    f"{r['offenders']}")
            if not bad and not r["offenders"]:
                print(f"PASS {width}px ({label}): all {len(r['joins'])} joins "
                      f"= {EXPECTED}px, no child overrides the gap")
            await ctx.close()
        await browser.close()

    if failures:
        print("\n".join(failures))
        print("FAIL: a page-local margin is stacking on the library's gap")
        sys.exit(1)
    print("PASS: the library's gap is the only thing separating top-level blocks")


asyncio.run(main())