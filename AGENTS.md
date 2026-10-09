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

- **The page is its own thing.** One flat list of socials, one `socials`
  heading, and no reference to oem/log anywhere: not in the header, footer,
  layout, page, or `<link>` tags. A test enforces this. Do not add a nav, a
  "read the blog" row, or a feed/sitemap link. The style is shared with the
  blog; the content is not.
- The design system is **oem-ui** (`/root/projects/oem-ui`), vendored with
  `scripts/install.sh --astro` into `src/styles/cli-mono/`, `src/js/` and
  `src/astro/`. Do not hand-edit anything under those three paths; re-run the
  installer. This site's own layer is `src/styles/site.css`, loaded last.
  `src/astro/config.ts` is the one vendored file the installer never
  overwrites, because it carries this site's identity.
- Links live in `src/data/links.ts`. Resist adding conditional logic to
  `.astro` files for per-link behaviour; extend the data shape instead.
- Static output only. If a feature needs a server, it belongs in a different
  project.
- English only.

## Before you commit

```bash
npm test        # node:test content checks on the link data and the chrome
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
grep -c 'class="cm-row' dist/index.html     # expect one row per visible link
grep -o 'list-head"[^>]*>[^<]*' dist/index.html   # expect: socials
grep -c 'cm-header' dist/index.html         # expect 1: the library header
grep -c 'class=""' dist/index.html          # expect 0: no forked chrome left
grep -c 'oem-log' dist/index.html           # expect 0, this page is self-contained
```

Then measure it in WebKit, not just visually — the tap targets are a media
query and a source grep cannot see them:

```bash
/root/.venvs/mau/bin/python tests/verify-header-webkit.py http://127.0.0.1:4321/
```

Then look at it. `astro preview --port 4324` and open
<http://localhost:4324/>. Pay attention to:

- **No source comments leaking into the page.** In an Astro template, `//`
  outside a `<script>` renders as visible text. This has bitten twice.
- **Only one section, headed `socials`.** If it renders `else`, a link has a
  `group` that is not in `GROUP_ORDER`, or the grouping fell through.
- **Every anchor is either `/` or a listed social.** A stray blog URL means
  a cross-reference crept back in; the test suite should have caught it.
- Link row alignment: index, icon, title, description, hostname, arrow all on
  their shared columns.
- The light theme actually toggles and survives a reload (it is restored by an
  inline script before first paint).

## Why there is no nav

`Header.astro` renders the library's `src/astro/Header.astro` with
`links={[]}`, because there is no second page to link to — an empty list emits
no burger and no link row. If a second page is ever genuinely needed, pass the
links then, and re-check that none of them point at the blog.

## Theme key

`oem-links-theme`, declared as `data-cm-theme-key` on `<html>` in
`src/layouts/Layout.astro` and read from the DOM by the library's FOUC guard and
runtime. It must not become `oem-log-theme`; the blog and this site keep
separate preferences on the same origin and would otherwise fight over one key.

## Project layout

```
src/
  astro/         the vendored oem-ui components (do not hand-edit)
  components/    BaseHead, Footer, Header   (thin wrappers over src/astro/)
  data/links.ts  the entire content of the page
  js/            the vendored oem-ui runtime + theme guard
  layouts/       Layout.astro wrapper
  lib/           icon-names.ts (Lucide data) + icons.ts (resolver, build-checked)
                 LinkedIn.astro, XLogo.astro (brand marks, Simple Icons paths)
  pages/         index.astro
  styles/        cli-mono/ (vendored) + site.css (this site's own layer)
tests/           node:test content checks + verify-*-webkit.py harnesses
```

## Adding a page

There is only one page, and that is deliberate. If a second page is genuinely
needed, add it under `src/pages/` and reuse `layouts/Layout.astro`.
