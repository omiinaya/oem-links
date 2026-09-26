# Changelog

All notable changes to oem/links.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial private release: a static Astro link page in the oem/log CLI-mono
  house style.
- `src/data/links.ts` as the single content file, with grouping, visibility
  toggles and per-link `kind` driving link attributes.
- Content test suite (`npm test`, 8 checks) validating the link data, and a
  build-time assertion that the icon name list and icon import map agree.
- Light/dark theme with a dedicated `oem-links-theme` storage key, so the
  preference does not collide with the blog's.
- `AGENTS.md` / `README.md` agent docs, `scripts/setup.sh` (systemd + reverse
  proxy) and `scripts/serve-dist.sh` (no-root deploy proof), GitHub Actions CI.
