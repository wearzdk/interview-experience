import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { tagToSlug } from './src/lib/tag-slug.ts';

// sitemap 的 lastmod 一律取自面经 frontmatter 的 collectedAt：
// 详情页取自身；公司 / 岗位 / 标签聚合页取其下最新一篇；首页与三个总览页取全站最新一篇。
// 不用构建时间，否则每次构建全部 URL 一起变动，Google 会判定该字段不可信。
const INTERVIEWS_DIR = new URL('./src/content/interviews/', import.meta.url);

function buildLastmodMap() {
	const map = new Map();
	let latest = '';
	const bump = (path, date) => {
		if (!map.has(path) || map.get(path) < date) map.set(path, date);
	};
	for (const file of readdirSync(INTERVIEWS_DIR)) {
		if (!file.endsWith('.md')) continue;
		const source = readFileSync(new URL(file, INTERVIEWS_DIR), 'utf-8');
		const frontmatter = yaml.load(source.slice(4, source.indexOf('\n---', 4)));
		const date = frontmatter.collectedAt;
		// 详情页路由参数是 glob loader 生成的 id，即文件名去扩展名后转小写
		bump(`/interview/${file.slice(0, -3).toLowerCase()}/`, date);
		bump(`/company/${frontmatter.company}/`, date);
		bump(`/position/${frontmatter.position}/`, date);
		for (const tag of frontmatter.tags ?? []) bump(`/tag/${tagToSlug(tag)}/`, date);
		if (date > latest) latest = date;
	}
	for (const path of ['/', '/companies/', '/positions/', '/tags/']) map.set(path, latest);
	return map;
}

const lastmodByPath = buildLastmodMap();
const unmapped = [];

// 新增页面类型却没有对应的 lastmod 口径时，让构建失败而不是静默输出无 lastmod 的条目。
// 校验放在 build:done：sitemap 插件会吞掉 serialize 里抛出的错误并跳过生成整份 sitemap。
const assertLastmodCoverage = {
	name: 'assert-sitemap-lastmod',
	hooks: {
		'astro:build:done': () => {
			if (unmapped.length > 0) {
				throw new Error(`sitemap 中 ${unmapped.length} 个 URL 没有 lastmod 口径：${unmapped.slice(0, 10).join(', ')}`);
			}
		},
	},
};

export default defineConfig({
	site: 'https://mj.mianlingai.com',
	trailingSlash: 'always',
	integrations: [
		sitemap({
			filter: (page) => !/\/\d+\/?$/.test(new URL(page).pathname),
			serialize(item) {
				const path = decodeURIComponent(new URL(item.url).pathname);
				const lastmod = lastmodByPath.get(path);
				if (lastmod) item.lastmod = lastmod;
				else unmapped.push(item.url);
				return item;
			},
		}),
		assertLastmodCoverage,
	],
});
