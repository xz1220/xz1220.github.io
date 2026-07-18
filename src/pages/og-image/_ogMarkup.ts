import { siteConfig } from "@/site.config";

/*
	Blueprint-style OG card: deep prussian blue, faint grid, amber accent, Roboto Mono.
	Builds raw satori vnodes (no satori-html) so the grid children stay real elements.
*/

const BG = "#12233a";
const GRID = "#1d3a5c";
const LINE = "#3d6491";
const INK = "#e8eef4";
const MUTED = "#9db4c9";
const AMBER = "#d9a13b";

const CELL = 42;

type VNode = {
	type: string;
	props: Record<string, unknown> & { children?: unknown };
};

const div = (style: Record<string, string | number>, children?: unknown): VNode => ({
	type: "div",
	props: { style: { display: "flex", ...style }, ...(children !== undefined ? { children } : {}) },
});

const text = (
	content: string,
	style: Record<string, string | number>,
	type: "p" | "h1" = "p",
): VNode => ({
	type,
	props: { style: { margin: 0, ...style }, children: content },
});

const crosshair = (x: number, y: number): VNode =>
	div({ position: "absolute", left: x - 9, top: y - 9, width: 19, height: 19 }, [
		div({ position: "absolute", left: 9, top: 0, width: 1, height: 19, background: MUTED }),
		div({ position: "absolute", left: 0, top: 9, width: 19, height: 1, background: MUTED }),
	]);

export const ogMarkup = (title: string, pubDate: string): VNode => {
	const gridLines: VNode[] = [];
	for (let x = CELL; x < 1200; x += CELL) {
		gridLines.push(
			div({ position: "absolute", left: x, top: 0, width: 1, height: 630, background: GRID }),
		);
	}
	for (let y = CELL; y < 630; y += CELL) {
		gridLines.push(
			div({ position: "absolute", left: 0, top: y, width: 1200, height: 1, background: GRID }),
		);
	}

	return div(
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
						text(pubDate, { fontSize: 24, color: MUTED }),
					]),
					div({ display: "flex", flexDirection: "column" }, [
						div({ width: 72, height: 4, background: AMBER, marginBottom: 28 }),
						text(title, { fontSize: 56, lineHeight: 1.25, color: INK, fontWeight: 700 }, "h1"),
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
							text(siteConfig.title, { fontSize: 24, fontWeight: 700, color: INK }),
							text("projects & writing", { fontSize: 20, color: MUTED }),
						],
					),
				],
			),
		],
	);
};
