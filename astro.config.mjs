import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://mj.mianlingai.com',
	integrations: [sitemap()],
});
