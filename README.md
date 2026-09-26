# oem/links

A self-hosted link page, built in the same CLI-mono house style as
[oem/log](https://omiinaya.github.io/oem-log/). Static Astro output, no
tracking, no runtime.

Live: **[links.oem.ngo](https://links.oem.ngo/)** (public, MIT, deployed by
GitHub Pages on every push to `main`). The `omiinaya.github.io/oem-links/` URL
also resolves and serves the same build.

The page is deliberately **its own thing**: a short `socials` list of accounts
plus a `personal` section, and the chrome (header, footer, `<head>`, layout)
never references oem/log or any other site. The blog appears only as a row in
the `personal` section, because a link you chose to share is content, not a
backlink. A stray `notes`/`about` nav entry or a `<link rel="sitemap">` pointing
at the blog is a test failure (see **Tests**).

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
  kind: 'profile',            // 'profile' (new tab) | 'email' (mailto:)
  visible: true,              // false hides it without deleting
  featured: true,             // optional, sorts to the top
}
```

There are two sections, and a link without a `group` lands in the first one
(`socials`). That default is right for accounts and wrong for anything else, so
give anything personal `group: 'personal'`. Any group must be in `GROUP_ORDER`,
or the link renders under an `else` heading and the test suite fails. Both
sections must contain at least one visible link, or you get a bare heading.

Rules the test suite enforces:

- `title`, `description` and `href` are non-empty
- `kind` is one of the two values above
- `email` kind must use `mailto:`
- every other `href` is absolute (`https://…`) or site-relative (`/…`)
- `icon` is a known icon name
- no duplicate titles
- at least one link is visible
- exactly one section, and it is `socials`
- **no oem-log / cross-site reference in the header, footer, BaseHead, layout
  or page** — the page must not backlink to the blog
- no `rel="sitemap"` or RSS `<link>`, since this site generates neither

`kind` controls link attributes: `profile` gets `rel="noopener"` and opens in
a new tab, `email` gets neither and stays in the current tab.

Links render in declaration order, with `featured` first. Hidden links keep
their place, so toggling `visible` never reshuffles the page.

## Adding an icon

There are two kinds, and the test suite checks they agree with the data.

**A Lucide icon** (the default) is two steps, in this order:

1. Add the PascalCase name to `ICON_NAMES` in `src/lib/icon-names.ts`
2. Import the component and add it to the `ICONS` map in `src/lib/icons.ts`

Find exact names at <https://lucide.dev/icons>.

**A brand mark** (LinkedIn, X) is a `.astro` component in `src/lib/` exporting
a default SVG that fills with `currentColor` and takes a `size` prop. Add it to
`BRAND_ICONS` in `src/lib/icons.ts`. Brand names are deliberately **not** in
`icon-names.ts`; the build throws if a name ends up in both.

Lucide removed its brand icons upstream over trademark and consistency, so
there is no `Github`, `Linkedin`, `Twitter` or `Youtube` to import. That is why
the GitHub row uses generic `Code` brackets while LinkedIn and X get their real
marks inlined from [Simple Icons](https://simpleicons.org) (CC0-1.0), the
upstream source of those paths. An icon name that does not exist renders as a
blank slot rather than crashing the build, so rely on `npm test` to catch typos.

## Design system

`src/styles/global.css`, `BaseHead.astro`, `Footer.astro`, the favicons, and
the two Atkinson font files started as **byte-identical copies** of the blog's
versions. They are the house style; change them here and the blog does not
follow, and vice versa. When the blog's design system changes, copy the files
over again rather than hand-editing the divergence.

Two components have since diverged on purpose, because this page is its own
thing rather than a satellite of the blog:

- `Header.astro` has **no nav**. There is no second page to link to, so the
  nav and its `internal-links` CSS were removed, along with `HeaderLink.astro`.
  Its theme key is `oem-links-theme` (not the blog's `oem-log-theme`) so the
  two sites keep separate light/dark preferences.
- `BaseHead.astro` drops the blog's `rel="sitemap"` and RSS `<link>` tags.
  They pointed at files this site never generates and both 404'd.

In an Astro template, `//` outside a `<script>` renders as visible page text.
Comments that are not inside a script or style block must be HTML comments.

## Environment variables

Both are optional and read in `astro.config.mjs`. The defaults target the
custom domain, which is the canonical deployment:

| Variable | Default | Use |
| --- | --- | --- |
| `SITE_URL` | `https://links.oem.ngo` | canonical/OG origin |
| `SITE_BASE` | `/` | path prefix; leave `/` for a domain root |

The canonical host is a real hostname served from its own root, so `base` is
`/` and no path prefix is involved. A wrong `SITE_BASE` still builds cleanly
and then 404s every asset in production, so CI asserts the output is
root-relative.

`scripts/setup.sh` passes `SITE_BASE=/` and a local `SITE_URL` when it builds
for the self-hosted LAN service.

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

### Self-hosting on a box (worked example, verified on a Proxmox host)

```bash
./scripts/setup.sh                  # build, install the unit, bind 0.0.0.0:8080
PORT=8090 ./scripts/setup.sh        # different port
```

`setup.sh` is idempotent: re-running it rebuilds, rewrites the unit, and
`systemctl enable --now` leaves a healthy service untouched. It installs
`oem-links.service` (system scope), which runs `scripts/serve.py` as `nobody`
out of the repo's `dist/`.

Run it from the repo's **real** path, not a convenience symlink under `/root`:
the unit sets `ProtectHome=true`, so a `WorkingDirectory` under `/root` is
unreadable and the service dies on start.

`scripts/serve.py` is a dependency-free static server on purpose. It replaces
the `npx --yes serve` this used to run, which meant an unpinned package
download from the npm registry on every service start.

## License

See [LICENSE](LICENSE). The Atkinson fonts in `src/assets/fonts/` and the
brand marks in `src/lib/*.astro` carry their own upstream licences.
