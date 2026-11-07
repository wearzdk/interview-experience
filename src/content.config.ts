import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const currentMonth = new Date().toISOString().slice(0, 7);

// 公司、岗位、标签直接作为路由参数（/company/[company]、/position/[position]、/tag/[tag]），
// 取值里出现 "/" 会把路由切成多段，构建期只报一句 "Missing parameter"，很难定位到具体文件。
// 在这里当场拦下，报错信息直接指出字段与取值。
const routeSafe = (label: string) =>
	z.string().refine((v) => !v.includes('/'), `${label} 不能包含 "/"，否则路由会断裂`);

const interviews = defineCollection({
	loader: glob({ base: './src/content/interviews', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		company: routeSafe('company'),
		position: routeSafe('position'),
		round: z.string().optional(),
		// 面试月份 YYYY-MM。必须是真实月份：它既是全站列表的排序键，又直接拼进
		// 详情页 JSON-LD 的 datePublished，写错会让条目错排到榜首、并产出非法结构化数据。
		date: z
			.string()
			.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date 必须形如 YYYY-MM，月份在 01-12 之间')
			.refine((v) => v <= currentMonth, {
				message: `date 不能晚于当前月份（${currentMonth}）`,
			}),
		result: z.string().optional(),
		base: z.string().optional(),
		source: z.string().default('牛客网'),
		tags: z.array(routeSafe('tags')).default([]),
		summary: z.string().optional(),
	}),
});

export const collections = { interviews };
