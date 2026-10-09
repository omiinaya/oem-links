# Changelog

All notable changes to oem/links.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **The header is the library's now.** `src/components/Header.astro` was the
  last hand-rolled fork on this site: its own sticky bar, its own brand markup
  and ~105 lines of scoped CSS, rendering `class=""` with no `.cm-*` class at
  all, so none of the rules oem-ui owns could reach it. It is now a thin
  wrapper over `src/astro/Header.astro`, carrying only this site's decisions
  (the brand label from `astro/config.ts`, `links={[]}` because a link page has
  nowhere to navigate, and the GitHub glyph via `extraLinks`).

  MEASURED in WebKit at 375x667 / 390x844 / 1280x900, against the live site and
  against a local build of HEAD (which agreed exactly — the fork had not
  drifted):

  | | before (hand-rolled) | after (library) |
  | --- | --- | --- |
  | header | `class=""`, no `.cm-*` | `.cm-header` |
  | theme toggle, coarse pointer | 32x32, `min-height: auto` | **44x44**, `min-height: 44px` |
  | theme toggle, fine pointer | 32x32 | 32x32 (unchanged) |
  | GitHub link, coarse pointer | 18x18, sized by its inline SVG | **44x44** |
  | header height | 50.59px @375, 61px @1280 | 62.59px @375, 61px @1280 |

  The tap target is the point: `.cm-icon-btn` is floored at `var(--tap)` (44px)
  by the library under `@media (pointer: coarse)`, and a hand-rolled
  `.theme-toggle { width: 32px }` sits outside that media query, so the fix was
  unreachable from this side. `.cm-header` also carries the scroll shadow. The
  scoped `backdrop-filter: blur(8px)` was inert over an already-opaque
  `rgb(10,10,10)` `--header-bg` and is gone (the library removed its own blur
  because it makes the header a containing block for the mobile drawer).

  The runtime wiring is unchanged: both the old and the library button carry
  `data-cm-theme-toggle`, and a click still flips `data-theme` and writes
  `oem-links-theme` (verified in WebKit, no page errors).

### Added
- `tests/verify-header-webkit.py` — measures the BUILT page in WebKit: the bar
  is `.cm-header`, both controls are >= `--tap` on a coarse pointer, the GitHub
  mark renders, no superseded fork class appears, and no burger or link row is
  emitted for an empty `links`. Exits non-zero on failure; proven to fail
  against a build of the old fork.
- A `the header renders the library component` contract in
  `tests/links.test.ts`: the library component is imported, the brand comes
  from the site config, the GitHub mark rides `extraLinks`, and the fork
  classes / a local `<style>` / the inert blur cannot return. Proven by
  mutation — restoring the old fork fails it (22 pass / 1 fail).
- A **personal** section below `socials`, holding the blog. The single-section
  assumption is gone: `GROUP_ORDER` is now `['socials', 'personal']`, and the
  blog row carries `group: 'personal'`.
- Three tests replaced the "exactly one section" rule: sections are asserted in
  order, every section must hold at least one visible link (a bare heading is a
  bug), and the blog must stay in `personal`. The stray-bucket test no longer
  assumes every link is socials.
- GitHub Pages deployment (`.github/workflows/deploy.yml`), publishing on
  every push to `main`. Runs on a self-hosted runner, not GitHub-hosted,
  because the account's Actions minute budget blocks hosted jobs before they
  start.
- Custom domain **[links.oem.ngo](https://links.oem.ngo/)**, on the Cloudflare
  zone `oem.ngo` as a proxied CNAME to `omiinaya.github.io`, with the CNAME
  registered on the Pages site.
  Note: Cloudflare did not publish the DNS record for roughly 25 minutes after
  creating it, and registering the Pages CNAME before the record resolved made
  GitHub 301 the `omiinaya.github.io` URL to an unresolvable host, which took
  the site offline. Confirm the domain resolves before registering the CNAME.
- `LICENSE` (MIT), with the bundled third-party licences called out: the
  Atkinson fonts (SIL OFL 1.1) and the brand marks (Simple Icons, CC0-1.0).
- An "everything to find me" copy pass: the page is a personal page, so hero,
  meta description and both row descriptions are first-person singular.

### Fixed
- The GitHub Pages `base` prefix is asserted in CI. A wrong prefix builds
  cleanly and then 404s every asset in production, a failure mode the existing
  checks could not see.

### Changed
- **The repository is now public.**
- `SITE_URL` and `SITE_BASE` now default to the canonical deployment
  (`https://links.oem.ngo` and `/`) instead of a private LAN hostname. Both stay
  overridable, and `setup.sh` builds the self-hosted copy with `SITE_BASE=/`
  and a local `SITE_URL` so it keeps serving from a domain root.
- Social order is now X, GitHub, LinkedIn, email.
- README no longer names the internal project path; it states the symlink rule
  instead.
- The page is now its own thing. Removed every cross-reference to oem/log:
  the header nav, the `oem/log` and `RSS Feed` link rows, the blog's
  `notes`/`about` nav entries, and the inherited `rel="sitemap"` and RSS
  `<link>` tags, which pointed at files this site never generates (both 404'd).
- One section instead of three: `elsewhere`/`writing`/`yours` collapsed to a
  single `socials` heading, and links need no `group` field to land in it.
- Socials are now GitHub, LinkedIn, X and email.
- Real brand marks for LinkedIn and X, inlined as `LinkedIn.astro` and
  `XLogo.astro` from Simple Icons (CC0-1.0) paths, because Lucide removed its
  brand icons upstream. Lucide 1.48.0 and lucide.dev both have no
  `github`/`twitter`/`linkedin` at all, and `icons/github.ts` 404s in the
  upstream repo, so this is not a stale install.
- `kind` is now `'profile' | 'email'`; the old `'internal'` kind is gone, and
  every profile link opens in a new tab. The header's GitHub icon no longer
  forces a new tab, and the footer's blog-specific "posts publish from origin"
  line now reads "zero trackers · zero cookies".
- Dropped `HeaderLink.astro` and the now-dead `internal-links` CSS.

### Added
- Initial private release: a static Astro link page in the oem/log CLI-mono
  house style.
- `src/data/links.ts` as the single content file, with visibility toggles and
  per-link `kind` driving link attributes.
- Content test suite (`npm test`, 13 checks) validating the link data, a
  build-time assertion that the icon name list and icon import map agree, and
  guards that fail the build if a blog backlink, a dead feed/sitemap link, a
  placeholder URL, or a mismatched platform URL is reintroduced.
- Light/dark theme with a dedicated `oem-links-theme` storage key, so the
  preference does not collide with the blog's.
- `AGENTS.md` / `README.md` agent docs, `scripts/setup.sh` (systemd, verified
  serving on the LAN) and `scripts/serve-dist.sh` (no-root deploy proof),
  GitHub Actions CI on a self-hosted runner.
