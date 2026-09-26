// Resolves an icon name from the link data to a renderable component.
//
// Imports must be explicit: Vite needs static import specifiers, so this map is
// the one place to touch when adding an icon. The test suite checks that every
// name in src/lib/icon-names.ts is actually imported here and vice versa, and
// that src/data/links.ts only uses known names.
//
// Lucide ships no brand icons (they were removed upstream over trademark and
// consistency), so a platform that needs its real mark uses a .astro
// component instead: 'LinkedIn' and 'X'. Those are intentionally NOT in
// icon-names.ts, which only lists @lucide/astro names. The GitHub row still
// uses the generic Code brackets, as does the header octocat inlined raw.
import {
	Activity,
	ArrowUpRight,
	BookOpen,
	Box,
	Code,
	Cpu,
	Flame,
	FolderGit2,
	Globe,
	Hash,
	KeyRound,
	Mail,
	MessageCircle,
	Play,
	Radio,
	Rss,
	Server,
	Shield,
	Sparkles,
	Terminal,
	Zap,
} from '@lucide/astro';
import LinkedIn from './LinkedIn.astro';
import XLogo from './XLogo.astro';
import { ICON_NAMES, type IconName } from './icon-names';

const BRAND_ICONS: Record<string, unknown> = {
	LinkedIn,
	X: XLogo,
};

const ICONS: Record<string, unknown> = {
	Activity,
	ArrowUpRight,
	BookOpen,
	Box,
	Code,
	Cpu,
	Flame,
	FolderGit2,
	Globe,
	Hash,
	KeyRound,
	Mail,
	MessageCircle,
	Play,
	Radio,
	Rss,
	Server,
	Shield,
	Sparkles,
	Terminal,
	Zap,
};

// Fail the build if the name list and this map drift apart.
const declared = new Set<string>(ICON_NAMES);
const mapped = new Set(Object.keys(ICONS));
for (const name of declared) {
	if (!mapped.has(name)) throw new Error(`icon "${name}" is in icon-names.ts but not imported in icons.ts`);
}
for (const name of mapped) {
	if (!declared.has(name)) throw new Error(`icon "${name}" is imported in icons.ts but missing from icon-names.ts`);
}

// A brand name must not also be a Lucide name, or the Lucide entry would win
// in getIcon and the real mark would silently never render.
for (const name of Object.keys(BRAND_ICONS)) {
	if (declared.has(name)) {
		throw new Error(`"${name}" is both a brand icon and a Lucide icon; remove it from icon-names.ts`);
	}
}

export function getIcon(name: string): any {
	return BRAND_ICONS[name] ?? ICONS[name] ?? null;
}

/** Every icon name the link data may use: Lucide names plus brand marks. */
export const ALL_ICON_NAMES = [...ICON_NAMES, ...Object.keys(BRAND_ICONS)];

export type { IconName };
