// The set of icon names this site is allowed to use.
//
// Kept separate from src/lib/icons.ts so tests can read it without importing
// @lucide/astro (Node cannot type-strip .ts files inside node_modules).
//
// Adding an icon is two steps:
//   1. add the PascalCase name here
//   2. import the component and add it to the map in src/lib/icons.ts
// src/lib/icons.ts fails the build if (1) and (2) ever disagree.

export const ICON_NAMES = [
	'Activity',
	'ArrowUpRight',
	'BookOpen',
	'Box',
	'Code',
	'Cpu',
	'Flame',
	'FolderGit2',
	'Globe',
	'KeyRound',
	'Mail',
	'MessageCircle',
	'Play',
	'Radio',
	'Rss',
	'Server',
	'Shield',
	'Sparkles',
	'Terminal',
	'Zap',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
