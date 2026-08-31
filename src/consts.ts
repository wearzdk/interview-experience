export const SITE_TITLE = '面灵面经 - 互联网大厂真实面试题与面经聚合';
export const SITE_DESCRIPTION = '面灵面经聚合来自牛客、脉脉等平台的互联网大厂真实面经，覆盖字节、阿里、腾讯、美团等公司的 Java、后端、前端、AI、算法等岗位面试真题与解析，助你高效备战大厂面试。';

/** 小程序名称，同时用于微信「搜一搜」引导文案 */
export const MINIPROGRAM_NAME = '面灵面经';

/** 主站地址；各处 CTA 统一从这里拼 utm，campaign 用投放位置命名 */
export const MAIN_SITE = 'https://www.mianlingai.com/';

export function mainSiteUrl(campaign: string): string {
	return mainSitePath('', campaign);
}

/** 主站子页面地址（path 不带前导斜杠，例如 `jobs/`） */
export function mainSitePath(path: string, campaign: string): string {
	return `${MAIN_SITE}${path}?utm_source=mianjing&utm_medium=referral&utm_campaign=${campaign}`;
}

/** 主站秋招岗位列表 */
export const JOBS_PATH = 'jobs/';
