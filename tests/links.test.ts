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
			['internal', 'external', 'email'].includes(link.kind),
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

test('every icon name used in the data is a known icon', () => {
	const known = new Set<string>(ICON_NAMES);
	for (const link of LINKS) {
		assert.ok(
			known.has(link.icon),
			`icon "${link.icon}" on ${link.title} is not in src/lib/icon-names.ts (have: ${ICON_NAMES.join(', ')})`,
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

test('group headings are lowercase so they render as-is', () => {
	for (const group of GROUP_ORDER) {
		assert.equal(group, group.toLowerCase(), `group heading "${group}" should be lowercase`);
		assert.ok(!group.includes('/'), `group heading "${group}" should not contain a slash`);
	}
});
