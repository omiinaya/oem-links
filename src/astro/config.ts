/**
 * oem-links site config — the ONE place that sets this site's identity.
 *
 * Installed by `oem-ui/scripts/install.sh --astro`, which deliberately does
 * NOT overwrite this file: the components beside it are vendored and
 * re-synced, but these values are OURS. An installer that rewrote them
 * would republish the library's placeholder identity over a live site on
 * the next routine sync.
 *
 * The values are restated from src/consts.ts rather than imported: config.ts
 * is loaded by every component that renders an identity, and importing the
 * consts tree would drag it into each of them. So the two are asserted
 * EQUAL by tests/links.test.ts instead of being left to drift.
 */
export const SITE = {
	title: 'oem/links',
	description:
		'Everywhere to find me, in one place. Built in-house, no tracking, no runtime.',
	author: 'omiinaya',
	email: 'omar@mrxlab.net',
	github: 'https://github.com/omiinaya',
	url: 'https://links.oem.ngo',
} as const;