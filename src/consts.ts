// Global site data. Lives here so it can be imported anywhere.

export const SITE_TITLE = 'oem/links';
export const SITE_DESCRIPTION =
	'Everywhere to find me, in one place. Built in-house, no tracking, no runtime.';

export const AUTHOR_HANDLE = 'omiinaya';
export const AUTHOR_EMAIL = 'omar@mrxlab.net';
export const AUTHOR_GITHUB = 'https://github.com/omiinaya';

// Theme persistence key. Declared ONCE on <html> in src/layouts/Layout.astro
// as data-cm-theme-key / data-cm-theme-legacy, which is the contract both the
// FOUC guard and the oem-ui runtime read. It used to be an exported constant
// here, consumed by a project-local guard generator - but a guard that takes
// its key list as a build-time argument cannot see a theme saved under a
// legacy key, because it is evaluated before the runtime bundle exists. That
// is the black flash the guard exists to prevent, so the key moved to the DOM
// and the second copy of the guard was deleted.
