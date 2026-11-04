// 统计每个取值出现的次数。不要写成 reduce 与对象展开：该写法每步都会复制整张表，复杂度为平方级，
// 面经两千多篇时首页每个分页要渲染 6 秒多，整站构建十几分钟。
export function countBy(values: Iterable<string>): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
	return counts;
}
