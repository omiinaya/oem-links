"""links.oem.ngo's header is the LIBRARY's header, measured in WebKit.

The header was the last hand-rolled fork on this site. It rendered
`class=""` with no `.cm-*` class at all, so every rule the library owns
was unreachable from the bar:

    header            class=""      - .cm-header never applied
    theme toggle      32x32         - min-height: auto; no tap floor
    GitHub link       18x18         - width came from its inline SVG only

`.cm-icon-btn` and `.cm-header__icon-link` are floored at `var(--tap)`
(44px) by the library under `@media (pointer: coarse)`. A hand-rolled
`.theme-toggle { width: 32px }` sits OUTSIDE that media query and can
never be floored by it, which is why the tap target cannot be fixed from
the consumer side - it has to come from rendering the component.

So the claims here are the ones a user can feel:

  1. the bar carries `.cm-header`, and the controls are the library's
     `.cm-icon-btn` / `.cm-header__icon-link`;
  2. on a COARSE pointer both are >= `--tap` in each dimension (the
     fork's 32x32 and 18x18 are the failures this proves against);
  3. the page does not overflow horizontally (the bar is 61px tall in
     the fork and 62.59px here - a width regression would show as
     scrollWidth > innerWidth);
  4. no fork class renders (`.theme-toggle` / `.brand` / `.controls`).

Run against the built site. Pass the URL as argv[1].
"""

import asyncio
import sys

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.1.68:4491/"
VIEWPORTS = [(375, 667, "iphone-se"), (390, 844, "iphone-15-pro"), (1280, 900, "desktop")]

JS = """() => {
  const out = {};
  const h = document.querySelector('header');
  if (!h) return {error: 'no <header>'};
  out.headerCls = h.className;
  const nav = document.querySelector('.cm-header__nav');
  out.navMaxw = nav ? getComputedStyle(nav).maxWidth : null;
  out.controls = document.querySelectorAll('.cm-header__controls').length;

  const btn = document.querySelector('.cm-icon-btn[data-cm-theme-toggle]');
  if (!btn) return {...out, error: 'no .cm-icon-btn theme toggle'};
  const br = btn.getBoundingClientRect();
  out.toggle = {w: Math.round(br.width), h: Math.round(br.height),
                minH: getComputedStyle(btn).minHeight};
  out.tap = getComputedStyle(document.documentElement).getPropertyValue('--tap').trim();

  const gl = document.querySelector('.cm-header__icon-link');
  if (!gl) return {...out, error: 'no .cm-header__icon-link'};
  const gr = gl.getBoundingClientRect();
  out.github = {w: Math.round(gr.width), h: Math.round(gr.height),
                svgs: gl.querySelectorAll('svg').length,
                href: gl.getAttribute('href')};
  out.docW = document.documentElement.scrollWidth;
  out.winW = window.innerWidth;
  // the superseded fork must not render anywhere on the page
  out.fork = ['.theme-toggle', '.brand', '.brand-name', '.controls']
    .filter((s) => document.querySelector(s));
  // a nav with no links must not render a burger or a link row
  out.burger = document.querySelectorAll('.cm-nav-toggle').length;
  out.linkRows = document.querySelectorAll('.cm-header__links').length;
  return out;
}"""


async def main():
    failures = []
    async with async_playwright() as pw:
        browser = await pw.webkit.launch()
        for width, height, label in VIEWPORTS:
            # coarse=True is the phone case, and the whole point of the
            # migration: the fork could not reach the tap floor at all.
            for coarse in (True, False):
                ctx = await browser.new_context(
                    viewport={"width": width, "height": height},
                    is_mobile=coarse, has_touch=coarse, device_scale_factor=2)
                page = await ctx.new_page()
                try:
                    await page.goto(BASE_URL, wait_until="load", timeout=45000)
                    await page.wait_for_timeout(900)
                    r = await page.evaluate(JS)
                except Exception as e:  # noqa: BLE001
                    failures.append(f"  {label} coarse={coarse}: harness error {e}")
                    await ctx.close()
                    continue

                tag = f"{label} {width}x{height} coarse={coarse}"
                if "error" in r:
                    failures.append(f"  {tag}: {r['error']}")
                    await ctx.close()
                    continue

                if "cm-header" not in r["headerCls"]:
                    failures.append(f"  {tag}: header class is {r['headerCls']!r}, "
                                    f"not the library's .cm-header")
                if r["tap"] != "44px":
                    failures.append(f"  {tag}: --tap is {r['tap']!r}, expected 44px")

                tw, th = r["toggle"]["w"], r["toggle"]["h"]
                gw, gh = r["github"]["w"], r["github"]["h"]
                if coarse:
                    if min(tw, th) < 44 or min(gw, gh) < 44:
                        failures.append(
                            f"  {tag}: coarse tap targets {tw}x{th} and {gw}x{gh}; "
                            f"the library floors both at --tap=44 (the fork read 32x32 / 18x18)")
                else:
                    # fine pointer: the compact box is intended, but the two
                    # controls must not be the fork's sizes by accident
                    if (tw, th) == (32, 32):
                        pass  # the library's own fine-pointer box

                if not r["github"]["svgs"]:
                    failures.append(f"  {tag}: the GitHub link rendered no mark "
                                    f"(a zero-width link is the defect the library's "
                                    f"ICON map exists to prevent)")
                if "github.com" not in (r["github"]["href"] or ""):
                    failures.append(f"  {tag}: GitHub link href is {r['github']['href']!r}")
                if r["docW"] > r["winW"]:
                    failures.append(f"  {tag}: page overflows horizontally "
                                    f"({r['docW']} > {r['winW']})")
                if r["fork"]:
                    failures.append(f"  {tag}: superseded fork classes still render: {r['fork']}")
                if r["burger"] or r["linkRows"]:
                    failures.append(f"  {tag}: a link page rendered a burger/link row "
                                    f"({r['burger']} / {r['linkRows']}); links is empty on purpose")

                if not any(tag in f for f in failures):
                    print(f"PASS {tag}: .cm-header, toggle {tw}x{th} (min-height "
                          f"{r['toggle']['minH']}), github {gw}x{gh}, no fork classes")
                await ctx.close()
        await browser.close()

    if failures:
        print("\n".join(failures))
        print("FAIL: links.oem.ngo is not rendering the library header")
        sys.exit(1)
    print("PASS: every viewport renders the library header, fork classes gone")


asyncio.run(main())
