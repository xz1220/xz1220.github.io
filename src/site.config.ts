import type { AstroExpressiveCodeOptions } from "astro-expressive-code";
import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
	// Used in astro.config.ts as `site`, so canonical URLs, the sitemap and RSS are absolute.
	url: "https://xz1220.github.io/",
	// Site name: page titles, the wordmark, RSS and the webmanifest.
	title: "danielxing 的笔记",
	// Person behind the site: meta author, JSON-LD and the title-page byline.
	author: "Daniel Xing",
	// Default meta description and webmanifest description.
	description: "Daniel Xing 的笔记：做 AI Agent 的一手经验，以及在大厂和创业路上的记录。",
	// Default <html lang>; English posts set `lang` in their frontmatter.
	lang: "zh-CN",
	ogLocale: "zh_CN",
	// Dates are shown as ISO YYYY-MM-DD (see src/utils/date.ts); this formatter is only
	// used for the generated social cards.
	date: {
		locale: "zh-CN",
		options: {
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	},
};

// Running-head navigation.
export const menuLinks: { path: string; title: string }[] = [
	{
		path: "/",
		title: "目录",
	},
	{
		path: "/projects/",
		title: "作品",
	},
	{
		path: "/about/",
		title: "关于",
	},
];

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	styleOverrides: {
		borderRadius: "3px",
		codeFontFamily:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		codeFontSize: "0.875rem",
		codeLineHeight: "1.7142857rem",
		codePaddingInline: "1rem",
		frames: {
			frameBoxShadowCssValue: "none",
		},
		uiLineHeight: "inherit",
	},
	themeCssSelector(theme, { styleVariants }) {
		// If one dark and one light theme are available
		// generate theme CSS selectors compatible with cactus-theme dark mode switch
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme;
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
		}
		// return default selector
		return `[data-theme="${theme.name}"]`;
	},
	// One quiet neutral theme for each colour mode.
	themes: ["github-dark", "github-light"],
	useThemedScrollbars: false,
};
