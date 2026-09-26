// Every link on the page lives here. Edit this file, commit, done.
//
// This is a plain link page: one flat list of socials, no sections beyond
// that, and nothing that points anywhere except the links you list here.
// Do not add blog/cross-site navigation here, in the header, or in the
// layout — the page is its own thing.
//
// icon: any PascalCase name exported by @lucide/astro
//   https://lucide.dev/icons  ·  find the exact name before using it
// kind:
//   'profile' → a social/profile page, opens in a new tab
//   'email'   → mailto:, stays in this tab

export interface LinkItem {
	/** Text shown as the link title. */
	title: string;
	/** One line under the title. Keep it concrete, not marketing. */
	description: string;
	/** Absolute URL, or a mailto: for the email kind. */
	href: string;
	/** PascalCase icon name from @lucide/astro. */
	icon: string;
	kind: 'profile' | 'email';
	/**
	 * Section heading. The page has one section ('socials'); this defaults to
	 * it so links stay in the right bucket even if the field is omitted.
	 * Anything else lands in a stray bucket and renders as 'else', which the
	 * test suite rejects.
	 */
	group?: string;
	/** Set false to hide without deleting. */
	visible: boolean;
	/** Show this one first, before everything else. */
	featured?: boolean;
}

/**
 * Display order for the one and only section. The page deliberately has a
 * single section; links render in the order they are declared.
 */
export const GROUP_ORDER = ['socials'] as const;

export const LINKS: LinkItem[] = [
	{
		title: 'X',
		description: 'Short-form posts and threads',
		href: 'https://x.com/omiinaya',
		icon: 'X',
		kind: 'profile',
		visible: true,
	},
	{
		title: 'GitHub',
		description: 'Code, experiments, and things I am building',
		href: 'https://github.com/omiinaya',
		icon: 'Code',
		kind: 'profile',
		visible: true,
	},
	{
		title: 'LinkedIn',
		description: 'Professional profile and work history',
		href: 'https://www.linkedin.com/in/omiinaya',
		icon: 'LinkedIn',
		kind: 'profile',
		visible: true,
	},
	{
		title: 'Email',
		description: 'Say hi, or tell me what to build next',
		href: 'mailto:omar@mrxlab.net',
		icon: 'Mail',
		kind: 'email',
		visible: true,
	},
];
