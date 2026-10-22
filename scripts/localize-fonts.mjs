// Postbuild: self-host the webfonts so the site never depends on Google Fonts
// (unreachable from mainland China, where most readers are), and size them per page so
// a reader downloads only the glyphs on the page in front of them.
//
// The families come from the <link data-webfonts> stylesheet in src/layouts/Base.astro,
// which dev mode loads as is. Each family gets one of three treatments:
//
// - Noto Serif SC, the reading face: every page gets its own subset holding exactly the
//   characters on that page (Google Fonts `text=` API), declared in an inline <style>
//   and preloaded. The same file backs the "CJK Quotes" face, which gives Chinese text
//   full-width curly quotes (see --serif in src/styles/global.css).
// - Zhi Mang Xing, the 行书 for titles: one site-wide subset of the characters in the
//   title elements, preloaded on every page with font-display: block, so a title never
//   flashes in the serif before the brush face arrives (the file is a few KB).
// - Any other family (Source Serif 4): Google's unicode-range slices, keeping only the
//   slices that cover a character on the site, in /fonts/fonts.css.
//
// Any failure exits non-zero, so a deploy never ships pages that still load Google.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const FILES = join(DIST, "fonts", "files");
// Google picks the font format from the User-Agent; a current Chrome gets woff2.
const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const SERIF = "Noto Serif SC";
const XINGSHU = "Zhi Mang Xing";
const QUOTES = [0x2018, 0x2019, 0x201c, 0x201d];
// Characters per `text=` request; keeps each URL under ~7 KB.
const CHUNK = 700;

const FACE = /(?:\/\*[^*]*\*\/\s*)?@font-face\s*\{[^}]*\}/g;
const WEBFONT_LINK = /<link\b[^>]*\bdata-webfonts\b[^>]*>/g;
const PRECONNECT = /<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com\/?"[^>]*>/g;
// The elements set in 行书 (--xingshu in global.css): wordmark, 扉页 titles, section titles.
const TITLE_ELEMENT =
	/<(a|h1|h2)\b[^>]*\bclass="(?:[^"]*\s)?(?:mark|book-title|section-title)(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/\1>/g;

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
	);
	return nested.flat();
}

async function fetchOk(url, as) {
	const res = await fetch(url, { headers: { "User-Agent": UA } });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.slice(0, 160)}`);
	return as === "text" ? res.text() : Buffer.from(await res.arrayBuffer());
}

/** Run tasks with at most `limit` in flight. */
async function pool(items, limit, task) {
	const queue = [...items];
	await Promise.all(
		Array.from({ length: limit }, async () => {
			for (let item = queue.shift(); item !== undefined; item = queue.shift()) await task(item);
		}),
	);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(text) {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
		if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
		return String.fromCodePoint(
			e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1)),
		);
	});
}

/** Text a reader sees: the body without scripts and styles, tags stripped, entities decoded. */
function visibleText(html) {
	const body = /<body\b[\s\S]*<\/body>/.exec(html)?.[0] ?? html;
	return decode(body.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, ""));
}

function parseRanges(value) {
	return value.split(",").map((part) => {
		const p = part.trim().toUpperCase().replace(/^U\+/, "");
		if (p.includes("?"))
			return [
				Number.parseInt(p.replaceAll("?", "0"), 16),
				Number.parseInt(p.replaceAll("?", "F"), 16),
			];
		const [lo, hi = lo] = p.split("-");
		return [Number.parseInt(lo, 16), Number.parseInt(hi, 16)];
	});
}

function covers(sorted, ranges) {
	return ranges.some(([lo, hi]) => {
		let a = 0;
		let b = sorted.length;
		while (a < b) {
			const mid = (a + b) >> 1;
			if (sorted[mid] < lo) a = mid + 1;
			else b = mid;
		}
		return a < sorted.length && sorted[a] <= hi;
	});
}

/** Sorted code points → a compact unicode-range value. */
function toRanges(sorted) {
	const out = [];
	for (let i = 0; i < sorted.length; i++) {
		let j = i;
		while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
		const hex = (cp) => cp.toString(16).toUpperCase();
		out.push(j > i ? `U+${hex(sorted[i])}-${hex(sorted[j])}` : `U+${hex(sorted[i])}`);
		i = j;
	}
	return out.join(", ");
}

const field = (face, name) => new RegExp(`${name}:\\s*([^;]+);`).exec(face)?.[1].trim();

async function main() {
	const files = await walk(DIST);
	const pages = files.filter((f) => f.endsWith(".html"));
	const html = new Map(await Promise.all(pages.map(async (f) => [f, await readFile(f, "utf8")])));
	const css = (
		await Promise.all(files.filter((f) => f.endsWith(".css")).map((f) => readFile(f, "utf8")))
	).join("\n");

	// Generated text: CSS content strings (e.g. "·") and attributes shown via attr().
	const generated = [...css.matchAll(/content:\s*"([^"]*)"/g)].map((m) => m[1]).join("");
	const attrNames = [...new Set([...css.matchAll(/attr\(([\w-]+)\)/g)].map((m) => m[1]))];

	// The webfonts stylesheet: one URL, one family= parameter per family.
	const links = new Set();
	for (const text of html.values())
		for (const tag of text.match(WEBFONT_LINK) ?? []) {
			// Astro escapes & in attributes as &#38;
			const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
			if (href) links.add(href.replace(/&(?:amp|#38|#x26);/gi, "&"));
		}
	if (links.size !== 1)
		throw new Error(`expected one <link data-webfonts> stylesheet, found ${links.size}`);
	const specs = new URL([...links][0]).searchParams.getAll("family");
	const specOf = (name) => specs.find((s) => s.split(":")[0] === name);
	const serifSpec = specOf(SERIF);
	const xingshuSpec = specOf(XINGSHU);
	const sliceSpecs = specs.filter((s) => s !== serifSpec && s !== xingshuSpec);
	if (!serifSpec || !xingshuSpec)
		throw new Error(`the webfonts link must load ${SERIF} and ${XINGSHU}`);
	const googleCss = (params) => `https://fonts.googleapis.com/css2?${params}`;
	const family = (spec) => `family=${spec.replaceAll(" ", "+")}`;
	const text = (cps) => `text=${encodeURIComponent(String.fromCodePoint(...cps))}`;

	// Font files are named by content, so an unchanged subset keeps its URL (and cache).
	const saved = new Map();
	await mkdir(FILES, { recursive: true });
	async function save(url, slug) {
		if (!saved.has(url)) {
			const data = await fetchOk(url, "buffer");
			const name = `${slug}-${createHash("sha256").update(data).digest("hex").slice(0, 16)}.woff2`;
			await writeFile(join(FILES, name), data);
			saved.set(url, { path: `/fonts/files/${name}`, bytes: data.length });
		}
		return saved.get(url);
	}
	const faceOf = ({ name, weight, style, display, src, range }) =>
		`@font-face{font-family:'${name}';font-style:${style};font-weight:${weight};font-display:${display};src:url(${src}) format('woff2')${range ? `;unicode-range:${range}` : ""}}`;

	// 1. Per-page Noto Serif SC subsets (and their CJK Quotes faces).
	const pageFaces = new Map();
	const pagePreloads = new Map();
	const allUsed = new Set();
	const chunkCss = new Map();
	await pool(pages, 6, async (page) => {
		const source = html.get(page);
		const seen = visibleText(source) + generated;
		const attrs = attrNames.flatMap((n) =>
			[...source.matchAll(new RegExp(`\\b${n}="([^"]*)"`, "g"))].map((m) => decode(m[1])),
		);
		const cps = new Set();
		for (const ch of seen + attrs.join("")) cps.add(ch.codePointAt(0));
		for (const cp of cps) allUsed.add(cp);
		// Latin is set in Source Serif 4; the serif subset carries everything else.
		const wide = [...cps].filter((cp) => cp > 0x7f).sort((a, b) => a - b);
		const faces = [];
		const preloads = [];
		for (let i = 0; i < wide.length; i += CHUNK) {
			const chunk = wide.slice(i, i + CHUNK);
			const url = googleCss(`${family(serifSpec)}&${text(chunk)}&display=swap`);
			if (!chunkCss.has(url)) chunkCss.set(url, await fetchOk(url, "text"));
			const range = toRanges(chunk);
			const quotes = QUOTES.filter((q) => chunk.includes(q));
			for (const face of chunkCss.get(url).match(FACE) ?? []) {
				const gstatic = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(face)?.[1];
				if (!gstatic) throw new Error(`${SERIF} subset without a gstatic url:\n${face}`);
				const file = await save(gstatic, "notoserifsc");
				if (!preloads.includes(file.path)) preloads.push(file.path);
				const weight = field(face, "font-weight") ?? "400";
				const style = field(face, "font-style") ?? "normal";
				faces.push(faceOf({ name: SERIF, weight, style, display: "swap", src: file.path, range }));
				if (quotes.length > 0)
					faces.push(
						faceOf({
							name: "CJK Quotes",
							weight,
							style,
							display: "swap",
							src: file.path,
							range: toRanges(quotes),
						}),
					);
			}
		}
		pageFaces.set(page, faces.join(""));
		pagePreloads.set(page, preloads);
	});

	// 2. One site-wide 行书 subset for the title elements.
	const titleChars = new Set();
	for (const source of html.values())
		for (const m of source.matchAll(TITLE_ELEMENT))
			for (const ch of decode(m[2].replace(/<[^>]+>/g, "")))
				if (/\S/.test(ch)) titleChars.add(ch.codePointAt(0));
	const titleCps = [...titleChars].sort((a, b) => a - b);
	if (titleCps.length === 0) throw new Error("found no title elements to set in 行书");
	const xingshuFaces =
		(await fetchOk(googleCss(`${family(xingshuSpec)}&${text(titleCps)}`), "text")).match(FACE) ??
		[];
	if (xingshuFaces.length === 0) throw new Error(`no ${XINGSHU} face returned`);
	const xingshuBlocks = [];
	let xingshuFile;
	for (const face of xingshuFaces) {
		const gstatic = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(face)?.[1];
		if (!gstatic) throw new Error(`${XINGSHU} subset without a gstatic url:\n${face}`);
		xingshuFile = await save(gstatic, "zhimangxing");
		xingshuBlocks.push(
			faceOf({
				name: XINGSHU,
				weight: field(face, "font-weight") ?? "400",
				style: field(face, "font-style") ?? "normal",
				display: "block",
				src: xingshuFile.path,
			}),
		);
	}

	// 3. Unicode-range slices for the remaining families, kept only where they cover a used character.
	const used = [...allUsed].sort((a, b) => a - b);
	let kept = 0;
	let dropped = 0;
	const latinPreloads = new Set();
	const sliceBlocks = [];
	if (sliceSpecs.length > 0) {
		const sliceCss = await fetchOk(
			googleCss(`${sliceSpecs.map(family).join("&")}&display=swap`),
			"text",
		);
		for (const face of sliceCss.match(FACE) ?? []) {
			const range = field(face, "unicode-range");
			if (range && !covers(used, parseRanges(range))) {
				dropped += 1;
				continue;
			}
			kept += 1;
			const gstatic = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(face)?.[1];
			if (!gstatic) throw new Error(`@font-face without a gstatic url:\n${face}`);
			const name = field(face, "font-family")?.replace(/['"]/g, "") ?? "font";
			const file = await save(gstatic, name.toLowerCase().replace(/[^a-z0-9]+/g, ""));
			// Basic Latin in the upright style is on every page; preload it with the rest.
			if (field(face, "font-style") === "normal" && range && covers([0x61], parseRanges(range)))
				latinPreloads.add(file.path);
			sliceBlocks.push(face.replace(gstatic, file.path).replace(/^\/\*[^*]*\*\/\s*/, ""));
		}
	}
	await writeFile(
		join(DIST, "fonts", "fonts.css"),
		`/* Generated by scripts/localize-fonts.mjs: ${XINGSHU} title subset and slices for ${sliceSpecs.join(", ")}. */\n${[...xingshuBlocks, ...sliceBlocks].join("\n")}\n`,
	);

	// 4. Point every page at its own fonts: preloads, the shared stylesheet, the inline serif faces.
	const preloadTag = (href) =>
		`<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
	const serifBytes = [];
	for (const page of pages) {
		const preloads = [xingshuFile.path, ...latinPreloads, ...pagePreloads.get(page)];
		const head = `${preloads.map(preloadTag).join("")}<link href="/fonts/fonts.css" rel="stylesheet"><style>${pageFaces.get(page)}</style>`;
		const after = html.get(page).replace(PRECONNECT, "").replace(WEBFONT_LINK, head);
		if (/fonts\.(googleapis|gstatic)\.com/.test(after))
			throw new Error(`${page} still references Google Fonts`);
		await writeFile(page, after);
		serifBytes.push(
			pagePreloads
				.get(page)
				.reduce((sum, p) => sum + [...saved.values()].find((f) => f.path === p).bytes, 0),
		);
	}
	serifBytes.sort((a, b) => a - b);
	const kb = (n) => `${Math.round(n / 1024)} KB`;
	console.log(
		`localize-fonts: ${pages.length} pages; ${SERIF} per page ${kb(serifBytes[0])}–${kb(serifBytes.at(-1))} (median ${kb(serifBytes[serifBytes.length >> 1])}); ${XINGSHU} ${titleCps.length} chars ${kb(xingshuFile.bytes)}; slices kept ${kept}, dropped ${dropped}; ${saved.size} files`,
	);
}

main().catch((error) => {
	console.error(`localize-fonts failed: ${error.message}`);
	process.exit(1);
});
