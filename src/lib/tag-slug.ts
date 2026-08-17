// 部分技术标签含 URL 保留字符（如 "#"），无法直接用作路由 slug（浏览器会把 # 当 fragment 分隔符截断路径）。
// 这里维护一份显式的 tag -> slug 映射，页面展示仍用原始 tag 文案，路由/链接一律用 slug。
const TAG_SLUG_OVERRIDES: Record<string, string> = {
	'C#': 'c-sharp',
};

export function tagToSlug(tag: string): string {
	return TAG_SLUG_OVERRIDES[tag] ?? tag;
}

export function slugToTag(slug: string, tags: string[]): string | undefined {
	return tags.find((tag) => tagToSlug(tag) === slug);
}
