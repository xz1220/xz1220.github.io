import fs from "node:fs";
// Rehype plugins
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import robotsTxt from "astro-robots-txt";
import webmanifest from "astro-webmanifest";
import rehypeExternalLinks from "rehype-external-links";
import rehypeUnwrapImages from "rehype-unwrap-images";
// Remark plugins
import remarkDirective from "remark-directive"; /* Handle ::: directives as nodes */
import { rehypeBook } from "./src/plugins/rehype-book";
import { remarkAdmonitions } from "./src/plugins/remark-admonitions"; /* Add admonitions */
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	integrations: [
		expressiveCode(expressiveCodeOptions),
		sitemap(),
		mdx(),
		robotsTxt(),
		webmanifest({
			// See: https://github.com/alextim/astro-lib/blob/main/packages/astro-webmanifest/README.md
			name: siteConfig.title,
			short_name: "danielxing",
			description: siteConfig.description,
			lang: siteConfig.lang,
			icon: "public/icon.svg", // the source for generating favicon & icons
			icons: [
				{
					src: "icons/apple-touch-icon.png", // used in src/components/BaseHead.astro L:26
					sizes: "180x180",
					type: "image/png",
				},
				{
					src: "icons/icon-192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "icons/icon-512.png",
					sizes: "512x512",
					type: "image/png",
				},
			],
			start_url: "/",
			// Warm paper from the book design (src/styles/global.css --paper).
			background_color: "#f7f4ec",
			theme_color: "#f7f4ec",
			display: "standalone",
			config: {
				insertFaviconLinks: false,
				insertThemeColorMeta: false,
				insertManifestLink: false,
			},
		}),
	],
	markdown: {
		rehypePlugins: [
			rehypeHeadingIds,
			rehypeUnwrapImages,
			// Figures, sidenotes, chapter heads and 标点挤压; needs heading ids and unwrapped images.
			rehypeBook,
			[
				rehypeExternalLinks,
				{
					rel: ["noreferrer", "noopener"],
					target: "_blank",
				},
			],
		],
		remarkPlugins: [remarkReadingTime, remarkDirective, remarkAdmonitions],
		remarkRehype: {
			footnoteLabelProperties: {
				className: [""],
			},
		},
	},
	vite: {
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
		plugins: [rawFonts([".ttf", ".woff"])],
	},
});

function rawFonts(ext: string[]) {
	return {
		name: "vite-plugin-raw-fonts",
		// @ts-expect-error:next-line
		transform(_, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = fs.readFileSync(id);
				return {
					code: `export default ${JSON.stringify(buffer)}`,
					map: null,
				};
			}
		},
	};
}
