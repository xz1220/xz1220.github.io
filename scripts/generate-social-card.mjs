// One-off: renders the default OG fallback card (public/social-card.png) in the same
// blueprint style as src/pages/og-image/_ogMarkup.ts. Run: node scripts/generate-social-card.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const BG = "#12233a";
const GRID = "#1d3a5c";
const LINE = "#3d6491";
const INK = "#e8eef4";
const MUTED = "#9db4c9";
const AMBER = "#d9a13b";
const CELL = 42;

const div = (style, children) => ({
	type: "div",
	props: { style: { display: "flex", ...style }, ...(children !== undefined ? { children } : {}) },
});
const text = (content, style, type = "p") => ({
	type,
	props: { style: { margin: 0, ...style }, children: content },
});
const crosshair = (x, y) =>
	div({ position: "absolute", left: x - 9, top: y - 9, width: 19, height: 19 }, [
		div({ position: "absolute", left: 9, top: 0, width: 1, height: 19, background: MUTED }),
		div({ position: "absolute", left: 0, top: 9, width: 19, height: 1, background: MUTED }),
	]);

const gridLines = [];
for (let x = CELL; x < 1200; x += CELL)
	gridLines.push(
		div({ position: "absolute", left: x, top: 0, width: 1, height: 630, background: GRID }),
	);
for (let y = CELL; y < 630; y += CELL)
	gridLines.push(
		div({ position: "absolute", left: 0, top: y, width: 1200, height: 1, background: GRID }),
	);

const markup = div(
	{
		width: 1200,
		height: 630,
		position: "relative",
		background: BG,
		fontFamily: "Roboto Mono",
		flexDirection: "column",
	},
	[
		...gridLines,
		crosshair(CELL * 2, CELL * 2),
		crosshair(1200 - CELL * 2, CELL * 2),
		crosshair(CELL * 2, 630 - CELL * 2),
		crosshair(1200 - CELL * 2, 630 - CELL * 2),
		div(
			{
				position: "absolute",
				left: 84,
				top: 72,
				width: 1032,
				height: 486,
				flexDirection: "column",
				justifyContent: "space-between",
			},
			[
				div({ display: "flex", justifyContent: "space-between", width: "100%" }, [
					text("xz1220.github.io", { fontSize: 24, color: MUTED }),
					text("est. 2026", { fontSize: 24, color: MUTED }),
				]),
				div({ display: "flex", flexDirection: "column" }, [
					div({ width: 72, height: 4, background: AMBER, marginBottom: 28 }),
					text(
						"Daniel Xing",
						{ fontSize: 64, lineHeight: 1.25, color: INK, fontWeight: 700 },
						"h1",
					),
				]),
				div(
					{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						borderTop: `1px solid ${LINE}`,
						paddingTop: 24,
					},
					[
						text("projects & writing", { fontSize: 24, fontWeight: 700, color: INK }),
						text("tools for AI agents", { fontSize: 20, color: MUTED }),
					],
				),
			],
		),
	],
);

const roboto = readFileSync(new URL("../src/assets/roboto-mono-regular.ttf", import.meta.url));
const robotoBold = readFileSync(new URL("../src/assets/roboto-mono-700.ttf", import.meta.url));

const svg = await satori(markup, {
	width: 1200,
	height: 630,
	fonts: [
		{ data: roboto, name: "Roboto Mono", style: "normal", weight: 400 },
		{ data: robotoBold, name: "Roboto Mono", style: "normal", weight: 700 },
	],
});

const png = new Resvg(svg).render().asPng();
writeFileSync(new URL("../public/social-card.png", import.meta.url), png);
console.log("wrote public/social-card.png", png.length, "bytes");
