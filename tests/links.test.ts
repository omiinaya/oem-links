// Content checks for the link data. Run with `npm test`.
//
// A typo in src/data/links.ts should fail here, not silently render a blank
// icon or a dead row on the live page.
//
// Note: this test deliberately does NOT import src/lib/icons.ts, because that
// file pulls in @lucide/astro and Node cannot type-strip .ts files inside
// node_modules. Drift between the two is caught by the build-time assertion in
// src/lib/icons.ts plus the readFile check below.

import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { ICON_NAMES } from '../src/lib/icon-names.ts';
import { GROUP_ORDER, LINKS } from '../src/data/links.ts';

test('every link has a title, description, href and valid kind', () => {
	for (const link of LINKS) {
		assert.ok(link.title?.trim(), `blank title on ${link.href}`);
		assert.ok(link.description?.trim(), `blank description on ${link.title}`);
		assert.ok(link.href?.trim(), `blank href on ${link.title}`);
		assert.ok(
			['profile', 'email'].includes(link.kind),
			`bad kind "${link.kind}" on ${link.title}`,
		);
	}
});

test('hrefs are absolute or site-relative, and email links use mailto:', () => {
	for (const link of LINKS) {
		if (link.kind === 'email') {
			assert.ok(link.href.startsWith('mailto:'), `${link.title} is kind=email but not mailto:`);
			continue;
		}
		const isAbsolute = /^https?:\/\//.test(link.href);
		const isRelative = link.href.startsWith('/');
		assert.ok(
			isAbsolute || isRelative,
			`${link.title} href "${link.href}" is neither absolute nor site-relative`,
		);
	}
});

test('every icon name used in the data is a known icon', async () => {
	// Brand marks (LinkedIn, X) are .astro components in src/lib/, not Lucide
	// names, and they cannot be imported here for the same node_modules reason
	// as @lucide/astro. Derive their names from the filename instead.
	const known = new Set<string>(ICON_NAMES);
	for (const [file, name] of [
		['LinkedIn.astro', 'LinkedIn'],
		['XLogo.astro', 'X'],
	] as const) {
		try {
			await readFile(new URL(`../src/lib/${file}`, import.meta.url), 'utf8');
			known.add(name);
		} catch {
			// Brand mark not present; only a problem if the data uses it.
		}
	}
	for (const link of LINKS) {
		assert.ok(
			known.has(link.icon),
			`icon "${link.icon}" on ${link.title} is not known (have: ${[...known].join(', ')})`,
		);
	}
});

test('every declared icon is actually imported in icons.ts', async () => {
	const src = await readFile(new URL('../src/lib/icons.ts', import.meta.url), 'utf8');
	for (const name of ICON_NAMES) {
		assert.ok(
			new RegExp(`\\b${name}\\b`).test(src),
			`icon "${name}" is in icon-names.ts but not referenced in src/lib/icons.ts`,
		);
	}
});

test('no duplicate titles', () => {
	const seen = new Set<string>();
	for (const link of LINKS) {
		assert.ok(!seen.has(link.title), `duplicate link title "${link.title}"`);
		seen.add(link.title);
	}
});

test('at least one link is visible', () => {
	assert.ok(LINKS.some((l) => l.visible), 'every link is hidden, the page would be empty');
});

test('GROUP_ORDER has no duplicates', () => {
	assert.equal(
		new Set(GROUP_ORDER).size,
		GROUP_ORDER.length,
		'GROUP_ORDER contains a duplicate heading',
	);
});

test('the page has exactly one section, and it is socials', () => {
	assert.deepEqual(
		[...GROUP_ORDER],
		['socials'],
		'the page is a single flat list of socials; it should have exactly one section',
	);
	const known = new Set<string>(GROUP_ORDER);
	for (const link of LINKS) {
		// A group that is not in GROUP_ORDER renders under an 'else' heading,
		// which is the bug this caught: links were falling through to 'else'
		// instead of 'socials' because they carried no group at all.
		assert.ok(
			link.group === undefined || known.has(link.group),
			`${link.title} has group "${link.group}" which is not in GROUP_ORDER, `
				+ 'so it would render under an "else" heading',
		);
	}
});

test('every visible link lands in the socials section, not a stray bucket', () => {
	// Mirrors the grouping logic in src/pages/index.astro: an ungrouped link
	// defaults into the single section, so nothing should ever be 'else'.
	const SECTION = GROUP_ORDER[0];
	for (const link of LINKS.filter((l) => l.visible)) {
		const bucket = link.group ?? SECTION;
		assert.equal(bucket, 'socials', `${link.title} would render under "${bucket}", not "socials"`);
	}
});

test('no placeholder or unfinished hrefs', () => {
	// A guessed social URL is worse than no row at all: it renders fine and
	// silently points at a stranger. Placeholders must never reach the page.
	const placeholder = /REPLACE_ME|TODO|CHANGEME|example\.(com|org)|your-?handle|\bxxx\b/i;
	for (const link of LINKS) {
		assert.ok(
			!placeholder.test(link.href),
			`${link.title} has a placeholder href "${link.href}"; `
				+ 'either paste the real URL or set visible: false until you have it',
		);
	}
});

test('visible social links point at the expected platforms', () => {
	// Guards against a copy/paste swapping one platform's URL for another's.
	const platform = (href: string): string | null => {
		if (href.includes('github.com')) return 'github';
		if (href.includes('linkedin.com')) return 'linkedin';
		if (href.includes('x.com') || href.includes('twitter.com')) return 'x';
		return null;
	};
	const pairs: Record<string, string> = {
		GitHub: 'github',
		LinkedIn: 'linkedin',
		X: 'x',
	};
	for (const link of LINKS.filter((l) => l.visible && pairs[l.title])) {
		assert.equal(
			platform(link.href),
			pairs[link.title],
			`${link.title} points at ${link.href}, which is a different platform`,
		);
	}
});

test('the page is self-contained: no blog/cross-site references', async () => {
	// The user asked for links to be its own thing: nothing on this page may
	// point back at oem/log or any other site, apart from the listed links.
	const srcDir = new URL('../src/', import.meta.url);
	const offenders: string[] = [];
	for (const rel of [
		'components/Header.astro',
		'components/Footer.astro',
		'components/BaseHead.astro',
		'layouts/Layout.astro',
		'pages/index.astro',
	]) {
		const text = await readFile(new URL(rel, srcDir), 'utf8');
		if (/oem-log|omiinaya\.github\.io/.test(text)) offenders.push(rel);
	}
	assert.deepEqual(
		offenders,
		[],
		`these files still reference the blog: ${offenders.join(', ')}. `
			+ 'This page must not link back to oem/log.',
	);
});

test('the footer and header do not advertise a feed or sitemap', async () => {
	// The blog's <link rel=sitemap> and RSS alternate pointed at files this
	// site never generates. Keep them from coming back.
	const baseHead = await readFile(
		new URL('../src/components/BaseHead.astro', import.meta.url),
		'utf8',
	);
	assert.ok(!/rel="sitemap"/.test(baseHead), 'do not advertise a sitemap this site does not generate');
	assert.ok(!/application\/rss\+xml/.test(baseHead), 'do not advertise an RSS feed this site does not generate');
});
