import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const interviews = defineCollection({
	loader: glob({ base: './src/content/interviews', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		company: z.string(),
		position: z.string(),
		round: z.string().optional(),
		date: z.string(),
		result: z.string().optional(),
		base: z.string().optional(),
		source: z.string().default('牛客网'),
		tags: z.array(z.string()).default([]),
		summary: z.string().optional(),
	}),
});

export const collections = { interviews };
