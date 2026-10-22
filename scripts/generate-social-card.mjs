// One-off: renders the default share card (public/social-card.png) for pages without a
// cover, in the 「长文书房」 style: warm paper, the site name in 行书, a vermilion rule.
// Fonts come from the Google Fonts CSS API: asked with a legacy User-Agent it answers
// with one static TTF per family, which Satori can parse (it cannot read woff2 or
// variable fonts). Run: node scripts/generate-social-card.mjs
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const PAPER = "#f7f4ec";
const INK = "#1f1d1a";
const MUTED = "#6b665c";
const RULE = "#e3ddd0";
const ACCENT = "#b5402a";

async function font(family) {
	const cssUrl = `https://fonts.googleapis.com/css2?family=${family}`;
	const css = await (await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
	const ttf = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
	if (!ttf) throw new Error(`no TTF in ${cssUrl}`);
	const res = await fetch(ttf);
	if (!res.ok) throw new Error(`font download failed (${res.status}): ${ttf}`);
	return res.arrayBuffer();
}

const div = (style, children) => ({
	type: "div",
	props: { style: { display: "flex", ...style }, ...(children !== undefined ? { children } : {}) },
});
const text = (content, style) => ({
	type: "p",
	props: { style: { margin: 0, ...style }, children: content },
});

const card = div(
	{
		width: 1200,
		height: 630,
		flexDirection: "column",
		justifyContent: "space-between",
		padding: "96px 104px 76px",
		background: PAPER,
		color: INK,
	},
	[
		div({ flexDirection: "column" }, [
			text("邢政的笔记", {
				fontFamily: "Zhi Mang Xing",
				fontSize: 150,
				lineHeight: 1.1,
				letterSpacing: 4,
			}),
			div({ width: 72, height: 4, marginTop: 44, background: ACCENT }),
		]),
		div(
			{
				justifyContent: "space-between",
				alignItems: "flex-end",
				paddingTop: 26,
				borderTop: `1px solid ${RULE}`,
			},
			[text("xz1220.github.io", { fontFamily: "Source Serif 4", fontSize: 30, color: MUTED })],
		),
	],
);

const [xingshu, serif] = await Promise.all([
	font("Zhi+Mang+Xing"),
	font("Source+Serif+4:wght@400"),
]);
const svg = await satori(card, {
	width: 1200,
	height: 630,
	fonts: [
		{ name: "Zhi Mang Xing", data: xingshu, weight: 400, style: "normal" },
		{ name: "Source Serif 4", data: serif, weight: 400, style: "normal" },
	],
});
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
writeFileSync(new URL("../public/social-card.png", import.meta.url), png);
console.log(`wrote public/social-card.png (${png.length} bytes)`);
