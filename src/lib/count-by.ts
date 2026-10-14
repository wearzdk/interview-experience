// 统计每个取值出现的次数。别写成 reduce + 对象展开：那样每步都复制整张表，是平方级的，
// 面经两千多篇时首页每个分页要渲染 6 秒多，整站构建十几分钟。
export function countBy(values: Iterable<string>): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
	return counts;
}
