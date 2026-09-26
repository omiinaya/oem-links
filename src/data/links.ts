// Every link on the page lives here. Edit this file, commit, done.
//
// icon: any PascalCase name exported by @lucide/astro
//   https://lucide.dev/icons  ·  find the exact name before using it
// kind:
//   'internal' → opens in a new tab, but a same-domain route
//   'external' → third party, gets rel="noopener"
//   'email'    → mailto:

export interface LinkItem {
	/** Text shown as the link title. */
	title: string;
	/** One line under the title. Keep it concrete, not marketing. */
	description: string;
	/** Absolute URL, or a site-relative path like '/blog/'. */
	href: string;
	/** PascalCase icon name from @lucide/astro. */
	icon: string;
	kind: 'internal' | 'external' | 'email';
	/** Optional group heading. Links render in the order they're declared. */
	group?: string;
	/** Set false to hide without deleting. */
	visible: boolean;
	/** Show this one first, before everything else. */
	featured?: boolean;
}

/** Display order, one entry per group heading. */
export const GROUP_ORDER = ['elsewhere', 'writing', 'yours'] as const;

export const LINKS: LinkItem[] = [
	{
		title: 'oem/log',
		description: 'The dev blog: field notes, gotchas, and reusable tricks',
		href: 'https://omiinaya.github.io/oem-log/',
		icon: 'Terminal',
		kind: 'internal',
		group: 'elsewhere',
		visible: true,
		featured: true,
	},
	{
		title: 'GitHub',
		description: 'Code, experiments, and things we are building',
		href: 'https://github.com/omiinaya',
		icon: 'Code',
		kind: 'external',
		group: 'elsewhere',
		visible: true,
	},
	{
		title: 'MRXLAB',
		description: 'Projects, research, and infrastructure',
		href: 'https://mrxlab.net/',
		icon: 'Globe',
		kind: 'external',
		group: 'elsewhere',
		visible: true,
	},
	{
		title: 'RSS Feed',
		description: 'Stay up to date when new notes drop',
		href: 'https://omiinaya.github.io/oem-log/rss.xml',
		icon: 'Rss',
		kind: 'external',
		group: 'writing',
		visible: true,
	},
	{
		title: 'Mastodon',
		description: 'Short-form notes and build-in-progress',
		href: 'https://infosec.exchange/@sullen',
		icon: 'MessageCircle',
		kind: 'external',
		group: 'yours',
		visible: false,
	},
	{
		title: 'Email',
		description: 'Say hi, or tell us what to build next',
		href: 'mailto:omar@mrxlab.net',
		icon: 'Mail',
		kind: 'email',
		group: 'yours',
		visible: false,
	},
];
