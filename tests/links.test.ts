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

test('the page has exactly the expected sections, in order', () => {
	assert.deepEqual(
		[...GROUP_ORDER],
		['socials', 'personal'],
		'the page is a short socials list plus a personal section, in that order',
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

test('every section renders at least one visible link', () => {
	// An empty section renders a bare heading with nothing under it.
	for (const group of GROUP_ORDER) {
		const inGroup = LINKS.filter((l) => l.visible && (l.group ?? 'socials') === group);
		assert.ok(
			inGroup.length > 0,
			`section "${group}" has no visible links, so it would render as a bare heading`,
		);
	}
});

test('personal links are explicitly grouped, and socials are not', () => {
	// An ungrouped link silently joins socials, which is right for accounts
	// and wrong for anything else. Anything personal must say so.
	for (const link of LINKS.filter((l) => l.group === 'personal')) {
		assert.ok(
			link.title.length > 0 && link.href,
			`personal link ${link.title} is incomplete`,
		);
	}
	for (const link of LINKS.filter((l) => l.title === 'Blog')) {
		assert.equal(
			link.group,
			'personal',
			'the blog belongs in the personal section, not among the socials',
		);
	}
});

test('every visible link lands in a declared section, never a stray bucket', () => {
	// Mirrors the grouping logic in src/pages/index.astro: an ungrouped link
	// defaults into the first section, so nothing should ever be 'else'.
	const DEFAULT = GROUP_ORDER[0];
	const known = new Set<string>(GROUP_ORDER);
	for (const link of LINKS.filter((l) => l.visible)) {
		const bucket = link.group ?? DEFAULT;
		assert.ok(
			known.has(bucket),
			`${link.title} would render under "${bucket}", which is not a declared section`,
		);
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

test('the page chrome does not cross-link to the blog', async () => {
	// Deliberately scoped to CHROME (header, footer, head, layout, page shell).
	// The blog may appear in src/data/links.ts, because a link the user chose to
	// share is content, not a backlink. What must never come back is the header
	// nav, the footer, or a <link> tag quietly pointing at oem/log.
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
		if (/oem-log|log\.oem\.ngo/.test(text)) offenders.push(rel);
	}
	assert.deepEqual(
		offenders,
		[],
		`these files still reference the blog: ${offenders.join(', ')}. `
			+ 'Chrome must not cross-link to oem/log; put shared links in src/data/links.ts.',
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

test('every class the page styles is in its markup, and vice versa', async () => {
	// A class renamed during the oem-ui migration left `.hero .kicker`
	// styling an element that had become `.cm-kicker`. The rule shipped,
	// matched nothing, and the 1rem gap silently became 0. Nothing failed:
	// the page still built and rendered, just tighter than designed. Both
	// a build and a visual pass accept that, which is why it needs a test.
	//
	// The check is bidirectional because the bug has two directions and
	// only one of them is visible from a single side:
	//
	//   selector -> no markup   dead CSS, the rule does nothing
	//   markup   -> no selector the element renders unstyled, which is
	//                          the direction that actually bit us
	//
	// Not every class needs both: the library's own .cm-* classes are
	// styled by the imported sheet, not by this file, and `.bar` lives in
	// Footer.astro. Those are declared here explicitly rather than ignored
	// by prefix, so a genuinely orphaned selector still fails.
	const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
	const styleBlock = page.slice(page.lastIndexOf('<style>'));

	const declared = new Set<string>();
	for (const sel of styleBlock.matchAll(
		/([.#][\w-]+(?:\s*[,>+~]\s*[.#][\w-]+)*)\s*\{/g,
	)) {
		for (const part of sel[1]!.split(/[,>+~]/)) {
			const t = part.trim();
			if (t.startsWith('.') || t.startsWith('#')) declared.add(t.slice(1));
		}
	}

	const used = new Set<string>();
	for (const cls of page.matchAll(/class="([^"]+)"/g)) {
		for (const c of cls[1]!.split(/\s+/)) if (c) used.add(c);
	}

	// Classes this file's scoped style is allowed to mention without
	// owning: the shared library's surface, and one class in Footer.astro.
	const ownedElsewhere = new Set(['bar', 'head', 'kicker', 'status', 'status__label', 'status__value']);

	// Style block references a class this page never renders: dead CSS.
	const orphans = [...declared]
		.filter((c) => !used.has(c) && !ownedElsewhere.has(c))
		.sort();

	// Page renders a project class its own style block never mentions.
	// Library (.cm-*) classes are styled by the imported sheet instead.
	const unstyled = [...used]
		.filter((c) => !declared.has(c) && !c.startsWith('cm-'))
		.sort();

	assert.deepEqual(
		orphans,
		[],
		`selectors in index.astro's scoped style match no element in that file: `
			+ `${orphans.join(', ')}. A class was probably renamed without its `
			+ 'selector, so the rule is dead CSS and the spacing it controlled is gone.',
	);
	assert.deepEqual(
		unstyled,
		[],
		`index.astro renders these project classes but never styles them: `
			+ `${unstyled.join(', ')}. Either the selector was left behind under `
			+ 'an old name, or the class does nothing.',
	);
});

test('the page uses library components, not parallel implementations', async () => {
	// oem-links used to carry 18 project classes that were near-identical to
	// library components: .hero, .status, .link-row, .link-idx, .link-title
	// and so on. Every one of them was a second implementation of something
	// the design system already owned, so a fix to the library never
	// reached the page. Assert the shared surface is actually used, so the
	// two cannot drift apart again.
	const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

	for (const cls of [
		'cm-head', 'cm-kicker', 'cm-head__sub',
		'cm-status', 'cm-status__label', 'cm-status__value',
		'cm-list-head', 'cm-rows', 'cm-row', 'cm-row__idx', 'cm-row__icon',
		'cm-row__body', 'cm-row__title', 'cm-row__desc', 'cm-row__meta', 'cm-row__sym',
	]) {
		assert.ok(
			new RegExp(`class="[^"]*\\b${cls}\\b`).test(page),
			`index.astro should use the library's .${cls}`,
		);
	}

	// The superseded project classes must not creep back.
	for (const old of [
		'hero', 'hero-title', 'hero-desc', 'status', 'lbl', 'val',
		'list-head', 'link-list', 'link-row', 'link-idx', 'link-icon',
		'link-body', 'link-title', 'link-desc', 'link-host', 'link-sym',
	]) {
		const inAClass = new RegExp(
			`class="[^"]*(?:^|\\s)${old}(?:\\s|")`,
		).test(page);
		assert.ok(
			!inAClass,
			`index.astro reintroduced the project class .${old}; use the cm-* component instead`,
		);
	}
});

test('the page does not carry its own theme runtime', async () => {
	// oem-links used to ship ~40 lines of inline theme script, byte-identical
	// to the blog's copy, differing only in the storage key. The library
	// runtime owns the theme now, and the project only declares its key.
	const header = await readFile(
		new URL('../src/components/Header.astro', import.meta.url),
		'utf8',
	);
	assert.ok(
		!/<script/.test(header),
		'Header.astro must not contain a script: the oem-ui runtime owns the theme toggle',
	);
	assert.ok(
		!header.includes('localStorage'),
		'Header.astro must not touch localStorage; that is the runtime\'s job',
	);
});

test('the layout declares the project theme key and loads the runtime', async () => {
	const layout = await readFile(
		new URL('../src/layouts/Layout.astro', import.meta.url),
		'utf8',
	);
	assert.match(
		layout,
		/data-cm-theme-key="oem-links-theme"/,
		'<html> must declare this project\'s storage key',
	);
	assert.match(
		layout,
		/data-cm-theme-legacy="cm-theme"/,
		'and the keys it used before, so a returning visitor keeps their theme',
	);
	assert.match(
		layout,
		/import\s+['"]\.\.\/js\/cli-mono\.js['"]/,
		'the runtime must be imported so it is bundled; a raw src is emitted verbatim and never ships',
	);
});

test('the FOUC guard is the library\'s, it is first in head, and it reads the DOM for keys', async () => {
	const head = await readFile(
		new URL('../src/components/BaseHead.astro', import.meta.url),
		'utf8',
	);

	// The guard is now the shared library file, inlined via ?raw. Assert the
	// IMPORT, because a source-level assertion cannot see whether the
	// snippet actually reached dist/ - and an <script src> here would run
	// after the stylesheets, which is the bug this exists to prevent.
	assert.match(
		head,
		/import themeGuard from '\.\.\/js\/cli-mono-theme-guard\.js\?raw'/,
		'BaseHead must import the library guard with ?raw; hand-rolling it is what caused the flash',
	);
	assert.ok(
		head.indexOf('set:html={themeGuard}') !== -1,
		'BaseHead must emit the guard',
	);
	assert.ok(
		head.indexOf('set:html={themeGuard}') < head.indexOf('<meta charset'),
		'the guard must precede <meta charset>, or a light-theme visitor sees a dark flash',
	);

	// The regression this replaced: a project-local generator took the key
	// list as a BUILD-TIME argument. The guard runs before the runtime
	// bundle exists, so a list assembled at build time cannot see a theme
	// saved under a legacy key, and that returning light-theme visitor gets
	// a black flash. The shared file must read the keys from the DOM, and
	// this project declares BOTH of them on <html>.
	assert.ok(
		!/\bthemeInitSnippet\b/.test(head.replace(/\/\*[\s\S]*?\*\//g, '')),
		'BaseHead must not generate the guard locally; use the library file',
	);
	const guard = await readFile(
		new URL('../src/js/cli-mono-theme-guard.js', import.meta.url),
		'utf8',
	);
	assert.match(
		guard,
		/data-cm-theme-key/,
		'the guard must read the project key from <html>, not bake it in',
	);
	assert.match(
		guard,
		/data-cm-theme-legacy/,
		'the guard must read the legacy keys from <html> too, or a returning visitor flashes black',
	);
	assert.doesNotMatch(
		guard.replace(/\/\*[\s\S]*?\*\//g, ''),
		/localStorage\.setItem/,
		'the guard must never write to storage; that is the runtime\'s job, after the paint',
	);
});
