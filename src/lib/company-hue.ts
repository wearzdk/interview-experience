// 面经条目左侧标记的配色：由公司名派生一个稳定色相，
// 只在蓝—青—紫这段品牌邻域里取值，避免列表出现跳脱主色的彩虹块。
const HUES = [212, 220, 228, 236, 250, 262, 196, 204];

export function companyHue(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	}
	return HUES[hash % HUES.length];
}

// 公司名首字作为标记文案；英文名取首字母大写。
export function companyInitial(name: string): string {
	const first = [...name][0] ?? "?";
	return /[a-z]/.test(first) ? first.toUpperCase() : first;
}
