// Postbuild: self-host the webfonts so the site never depends on Google Fonts
// (unreachable from mainland China, where most readers are).
//
// 1. Collect every code point used in dist/**/*.html and the built CSS.
// 2. Fetch the Google Fonts stylesheet linked by the pages (<link data-webfonts>).
// 3. Keep only the @font-face slices whose unicode-range covers a used character,
//    download them to dist/fonts/files/, and write dist/fonts/fonts.css. It also gets a
//    "CJK Quotes" face (the Noto Serif SC slice holding “ ” ‘ ’), which gives
//    Chinese text full-width curly quotes; see --serif in src/styles/global.css.
// 4. Point every page at /fonts/fonts.css and drop the Google preconnects.
//
// Any failure exits non-zero, so a deploy never ships pages that still load Google.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const FILES = join(DIST, "fonts", "files");
// Google picks the font format from the User-Agent; a current Chrome gets woff2.
const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const QUOTES = [0x2018, 0x2019, 0x201c, 0x201d];

const FACE = /(?:\/\*[^*]*\*\/\s*)?@font-face\s*\{[^}]*\}/g;
const WEBFONT_LINK = /<link\b[^>]*\bdata-webfonts\b[^>]*>/g;
const PRECONNECT = /<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com\/?"[^>]*>/g;

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
	);
	return nested.flat();
}

async function fetchOk(url, as) {
	const res = await fetch(url, { headers: { "User-Agent": UA } });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
	return as === "text" ? res.text() : Buffer.from(await res.arrayBuffer());
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

async function main() {
	const files = await walk(DIST);
	const pages = files.filter((f) => f.endsWith(".html"));
	const styles = files.filter((f) => f.endsWith(".css"));
	const texts = new Map(
		await Promise.all([...pages, ...styles].map(async (f) => [f, await readFile(f, "utf8")])),
	);

	const used = new Set();
	for (const text of texts.values()) for (const ch of text) used.add(ch.codePointAt(0));
	const sorted = [...used].sort((a, b) => a - b);

	const urls = new Set();
	for (const page of pages) {
		for (const tag of texts.get(page).match(WEBFONT_LINK) ?? []) {
			const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
			// Astro escapes & in attributes as &#38;
			if (href) urls.add(href.replace(/&(?:amp|#38|#x26);/gi, "&"));
		}
	}
	if (urls.size !== 1)
		throw new Error(`expected one <link data-webfonts> stylesheet, found ${urls.size}`);
	const [cssUrl] = urls;

	const css = await fetchOk(cssUrl, "text");
	const downloads = new Map();
	const quoteFaces = [];
	let kept = 0;
	let dropped = 0;
	const local = (url) => {
		const name = url.replace("https://fonts.gstatic.com/s/", "").replaceAll("/", "-");
		downloads.set(url, name);
		return `files/${name}`;
	};
	const localized = css.replace(FACE, (face) => {
		const range = /unicode-range:\s*([^;]+);/.exec(face)?.[1];
		const ranges = range ? parseRanges(range) : undefined;
		if (ranges && !covers(sorted, ranges)) {
			dropped += 1;
			return "";
		}
		kept += 1;
		const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(face)?.[1];
		if (!url) throw new Error(`@font-face without a gstatic url:\n${face}`);
		const src = local(url);
		const family = /font-family:\s*'([^']+)'/.exec(face)?.[1];
		// Each quote face claims only the quote marks its own slice contains.
		const quotes =
			family === "Noto Serif SC" && ranges ? QUOTES.filter((q) => covers([q], ranges)) : [];
		if (quotes.length > 0) {
			const weight = /font-weight:\s*([^;]+);/.exec(face)?.[1] ?? "400";
			const range = quotes.map((q) => `U+${q.toString(16).toUpperCase()}`).join(", ");
			quoteFaces.push(
				`@font-face {\n  font-family: 'CJK Quotes';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url(${src}) format('woff2');\n  unicode-range: ${range};\n}`,
			);
		}
		return face.replace(url, src);
	});
	if (quoteFaces.length === 0) throw new Error("no Noto Serif SC slice covers the curly quotes");

	await mkdir(FILES, { recursive: true });
	const queue = [...downloads];
	await Promise.all(
		Array.from({ length: 8 }, async () => {
			for (let item = queue.shift(); item; item = queue.shift()) {
				const [url, name] = item;
				await writeFile(join(FILES, name), await fetchOk(url, "buffer"));
			}
		}),
	);
	const header = `/* Generated by scripts/localize-fonts.mjs from ${cssUrl} */\n`;
	await writeFile(
		join(DIST, "fonts", "fonts.css"),
		`${header}${quoteFaces.join("\n")}\n${localized.replace(/\n{3,}/g, "\n\n")}`,
	);

	let rewritten = 0;
	for (const page of pages) {
		const before = texts.get(page);
		const after = before
			.replace(PRECONNECT, "")
			.replace(WEBFONT_LINK, '<link href="/fonts/fonts.css" rel="stylesheet">');
		if (/fonts\.(googleapis|gstatic)\.com/.test(after))
			throw new Error(`${page} still references Google Fonts`);
		if (after !== before) {
			await writeFile(page, after);
			rewritten += 1;
		}
	}
	console.log(
		`localize-fonts: ${rewritten} pages, ${kept} faces kept, ${dropped} dropped, ${downloads.size} files, ${quoteFaces.length} quote faces`,
	);
}

main().catch((error) => {
	console.error(`localize-fonts failed: ${error.message}`);
	process.exit(1);
});
