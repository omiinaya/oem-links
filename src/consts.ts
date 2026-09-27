// Global site data. Lives here so it can be imported anywhere.

export const SITE_TITLE = 'oem/links';
export const SITE_DESCRIPTION =
	'Everywhere to find me, in one place. Built in-house, no tracking, no runtime.';

export const AUTHOR_HANDLE = 'omiinaya';
export const AUTHOR_EMAIL = 'omar@mrxlab.net';
export const AUTHOR_GITHUB = 'https://github.com/omiinaya';

// Theme persistence key. Distinct from the blog's so the two sites
// don't fight over one preference.
export const THEME_KEY = 'oem-links-theme';

// Theme keys this site used before the oem-ui runtime owned the toggle.
// A returning visitor's saved preference lives under one of these, so the
// runtime reads it and folds it into THEME_KEY on first load.
export const LEGACY_THEME_KEYS = ['cm-theme'];
