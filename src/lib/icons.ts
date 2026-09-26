// Resolves an icon name from the link data to a real @lucide/astro component.
//
// Imports must be explicit: Vite needs static import specifiers, so this map is
// the one place to touch when adding an icon. The test suite checks that every
// name in src/lib/icon-names.ts is actually imported here and vice versa, and
// that src/data/links.ts only uses known names.
//
// Brand icons (GitHub, YouTube, ...) were dropped from Lucide, so GitHub rows
// use Code and YouTube rows use Play.
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
import { ICON_NAMES, type IconName } from './icon-names';

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

export function getIcon(name: string): any {
	return ICONS[name] ?? null;
}

export type { IconName };
