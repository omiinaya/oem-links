// @ts-check

import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
//
// Defaults target the canonical deployment, the custom domain
// https://links.oem.ngo. Because that is a real hostname served from its own
// root, `base` is "/" and no path prefix is involved.
//
// Both values stay overridable: setup.sh passes SITE_BASE=/ explicitly for the
// self-hosted LAN service, and SITE_BASE can be set to "/<subpath>/" to host
// the site under a subdirectory of some other domain.
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
