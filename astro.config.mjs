// @ts-check

import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
//
// Defaults target the canonical deployment.
//
// IMPORTANT: the canonical host is a custom domain (https://links.oem.ngo),
// which is served from its own root, so `base` is "/". If the custom domain is
// not active yet and the site must be reachable on the GitHub Pages fallback
// URL instead, the fallback is served from https://omiinaya.github.io/oem-links/
// and therefore needs base="/oem-links/". Set SITE_BASE=/oem-links/ to build
// for that path; the build is otherwise identical.
//
// Both values stay overridable, and setup.sh passes SITE_BASE=/ explicitly for
// the self-hosted LAN service.
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://links.oem.ngo',
	base: process.env.SITE_BASE ?? '/',
	output: 'static',
	integrations: [],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
