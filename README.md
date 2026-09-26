# oem/links

A self-hosted link page, built in the same CLI-mono house style as
[oem/log](https://omiinaya.github.io/oem-log/). Static Astro output, no
tracking, no runtime.

## Stack

- **Astro 7** (`output: 'static'`), TypeScript strict
- **@lucide/astro** for row icons
- **Atkinson** (body) + a mono stack, served locally from `src/assets/fonts/`
- Node `>=22.12.0` (uses native TypeScript type-stripping for tests)

## Commands

```bash
npm install
npm run dev        # dev server
npm test           # content checks on the link data
npm run build      # static build into dist/
npm run preview    # serve dist/
```

`npm test` and `npm run build` are independent. Run both before pushing.

## Adding or editing a link

Everything on the page lives in **`src/data/links.ts`**. No component edits.

```ts
{
  title: 'Somewhere',
  description: 'One concrete line, not marketing',
  href: 'https://example.com/',
  icon: 'Globe',              // PascalCase name from src/lib/icon-names.ts
  kind: 'external',           // 'internal' | 'external' | 'email'
  group: 'elsewhere',         // a heading from GROUP_ORDER
  visible: true,              // false hides it without deleting
  featured: true,             // optional, sorts to the top of its group
}
```

Rules the test suite enforces:

- `title`, `description` and `href` are non-empty
- `kind` is one of the three values above
- `email` kind must use `mailto:`
- every other `href` is absolute (`https://…`) or site-relative (`/…`)
- `icon` is a known icon name
- no duplicate titles
- at least one link is visible
- group headings are lowercase

`kind` controls link attributes: `external` gets `rel="noopener"`,
`internal` gets `rel="me"`, `email` gets neither and does not open a tab.

Links render in `GROUP_ORDER` sequence, then anything ungrouped under `else`.
Hidden links keep their place, so toggling `visible` never reshuffles the page.

## Adding an icon

Two steps, in this order — the test and the build both check they agree:

1. Add the PascalCase name to `ICON_NAMES` in `src/lib/icon-names.ts`
2. Import the component and add it to the map in `src/lib/icons.ts`

Find exact names at <https://lucide.dev/icons>. Note that Lucide dropped its
brand icons, so there is no `Github`, `Youtube`, or `Globe2`; those rows use
`Code`, `Play`, and `Globe`. An icon name that does not exist renders as a
blank slot rather than crashing the build, so rely on `npm test` to catch typos.

## Design system

`src/styles/global.css`, `BaseHead.astro`, `Footer.astro`, `HeaderLink.astro`,
the favicons, and the two Atkinson font files are **byte-identical copies** of
the blog's versions. They are the house style; change them here and the blog
does not follow, and vice versa. When the blog's design system changes, copy
the files over again rather than hand-editing the divergence.

`Header.astro` is the one component that intentionally diverges:

- the theme key is `oem-links-theme` (not the blog's `oem-log-theme`) so the
  two sites keep separate light/dark preferences
- the nav points at the blog's `notes`/`about` routes, not local ones

In an Astro template, `//` outside a `<script>` renders as visible page text.
Comments that are not inside a script or style block must be HTML comments.

## Environment variables

Both are optional and read in `astro.config.mjs`:

| Variable | Default | Use |
| --- | --- | --- |
| `SITE_URL` | `https://links.mrxlab.net` | canonical/OG URLs |
| `SITE_BASE` | `/` | set to `/links/` for subpath hosting |

## Tests

`tests/links.test.ts` is a plain `node:test` suite, no test framework
dependency. It imports `src/data/links.ts` and `src/lib/icon-names.ts` but
deliberately **not** `src/lib/icons.ts`: that file pulls in `@lucide/astro`,
and Node cannot type-strip `.ts` files inside `node_modules`
(`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). The icon name list and the
icon import map are cross-checked instead by reading `icons.ts` as text, plus
a build-time assertion in `icons.ts` itself.

## Deploying

Output is a plain static `dist/`. Any static host works.

### Self-hosting on a box (worked example, verified on the PVE host)

```bash
./scripts/setup.sh                  # build, install the unit, bind 0.0.0.0:8080
PORT=8090 ./scripts/setup.sh        # different port
```

`setup.sh` is idempotent: re-running it rebuilds, rewrites the unit, and
`systemctl enable --now` leaves a healthy service untouched. It installs
`oem-links.service` (system scope), which runs `scripts/serve.py` as `nobody`
out of the repo's `dist/`.

Run it from the **real** path (`/mnt/pve/mrx-thunder/projects/links`), not the
`/root/projects/links` symlink: the unit sets `ProtectHome=true`, so a
`WorkingDirectory` under `/root` is unreadable and the service dies on start.

`scripts/serve.py` is a dependency-free static server on purpose. It replaces
the `npx --yes serve` this used to run, which meant an unpinned package
download from the npm registry on every service start.
