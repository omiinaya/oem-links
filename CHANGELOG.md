# Changelog

All notable changes to oem/links.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Pages deployment (`.github/workflows/deploy.yml`), publishing on
  every push to `main`. Runs on a self-hosted runner, not GitHub-hosted,
  because the account's Actions minute budget blocks hosted jobs before they
  start.
- Custom domain **[links.oem.ngo](https://links.oem.ngo/)**, on the Cloudflare
  zone `oem.ngo` as a proxied CNAME to `omiinaya.github.io`, with the CNAME
  registered on the Pages site.
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
