// @ts-check

import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
//
// Defaults target GitHub Pages, which is the canonical deployment. A project
// Pages site is served from https://<user>.github.io/<repo>/, so `base` MUST
// match the repo name or every asset and internal link 404s.
//
// Both values stay overridable so the site can still be self-hosted from a
// subpath: setup.sh builds with SITE_BASE=/ so the LAN service keeps serving
// at the root.
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://omiinaya.github.io',
	base: process.env.SITE_BASE ?? '/oem-links/',
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
