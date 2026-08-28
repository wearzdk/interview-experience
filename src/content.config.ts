import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const currentMonth = new Date().toISOString().slice(0, 7);

const interviews = defineCollection({
	loader: glob({ base: './src/content/interviews', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		company: z.string(),
		position: z.string(),
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
		tags: z.array(z.string()).default([]),
		summary: z.string().optional(),
	}),
});

export const collections = { interviews };
