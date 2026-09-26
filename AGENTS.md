# AGENTS.md

Working notes for AI agents and humans maintaining this repo. Read this before
editing, then read `README.md` for the link-data format.

## What this is

A self-hosted link page in the same CLI-mono style as the
[oem/log blog](https://omiinaya.github.io/oem-log/). Astro 7, static output, no
tracking, no runtime, no database. The entire content of the page is one file:
`src/data/links.ts`.

**Private repo.** Do not flip it public without the owner asking.

## Ground rules

- The design system files are byte-identical copies of the blog's. Do not
  "improve" them here in a way that drifts from the blog. If the blog's
  styling changes, re-copy the files.
- Links live in `src/data/links.ts`. Resist adding conditional logic to
  `.astro` files for per-link behaviour; extend the data shape instead.
- Static output only. If a feature needs a server, it belongs in a different
  project.
- English only.

## Before you commit

```bash
npm test        # 8 content checks on the link data
npm run build   # static build; also asserts icon name/import agreement
```

Both must pass. The build assertion in `src/lib/icons.ts` throws if
`icon-names.ts` and the icon import map disagree, which is what catches a
half-finished icon addition.

## Verifying a change actually rendered

A clean build does not mean the page is right. After changing a template,
check the output:

```bash
npm run build
grep -c 'class="link-row"' dist/index.html   # expect one per visible link
grep -o 'class="link-title"[^>]*>[^<]*' dist/index.html
```

Then look at it. `astro preview --port 4324` and open
<http://localhost:4324/>. Pay attention to:

- **No source comments leaking into the page.** In an Astro template, `//`
  outside a `<script>` renders as visible text. This has bitten twice.
- Link row alignment: index, icon, title, description, hostname, arrow all on
  their shared columns.
- The light theme actually toggles and survives a reload (it is restored by an
  inline script before first paint).

## Theme key

`oem-links-theme`, defined as `THEME_KEY` in `src/consts.ts` and injected into
the header's inline script via `define:vars`. It must not become
`oem-log-theme`; the blog and this site keep separate preferences on the same
origin and would otherwise fight over one key.

## Project layout

```
src/
  components/    BaseHead, Footer, Header, HeaderLink   (style, mostly copied)
  data/links.ts  the entire content of the page
  layouts/       Layout.astro wrapper
  lib/           icon-names.ts (data) + icons.ts (resolver, build-checked)
  pages/         index.astro
  styles/        global.css (byte-identical to the blog's)
tests/           node:test content checks
```

## Adding a page

There is only one page, and that is deliberate. If a second page is genuinely
needed, add it under `src/pages/` and reuse `layouts/Layout.astro`.
