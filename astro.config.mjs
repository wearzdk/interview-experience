import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://mj.mianlingai.com',
	trailingSlash: 'always',
	integrations: [
		sitemap({
			filter: (page) => !/\/\d+\/?$/.test(new URL(page).pathname),
		}),
	],
});
