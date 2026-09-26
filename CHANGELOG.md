# Changelog

All notable changes to oem/links.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- The page is now its own thing. Removed every cross-reference to oem/log:
  the header nav, the `oem/log` and `RSS Feed` link rows, the blog's
  `notes`/`about` nav entries, and the inherited `rel="sitemap"` and RSS
  `<link>` tags, which pointed at files this site never generates (both 404'd).
- One section instead of three: `elsewhere`/`writing`/`yours` collapsed to a
  single `socials` heading, and links need no `group` field to land in it.
- Socials are now GitHub, Mastodon, Matrix and email. Matrix is new.
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
- Content test suite (`npm test`, 11 checks) validating the link data, a
  build-time assertion that the icon name list and icon import map agree, and
  guards that fail the build if a blog backlink or a dead feed/sitemap link is
  reintroduced.
- Light/dark theme with a dedicated `oem-links-theme` storage key, so the
  preference does not collide with the blog's.
- `AGENTS.md` / `README.md` agent docs, `scripts/setup.sh` (systemd, verified
  serving on the LAN) and `scripts/serve-dist.sh` (no-root deploy proof),
  GitHub Actions CI on a self-hosted runner.
