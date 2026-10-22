/*
	Chinese typesetting helpers shared by components (titles, decks) and the markdown
	pipeline (src/plugins/rehype-book.ts).

	Titles and headings use `word-break: keep-all`, so CJK text only breaks where these
	helpers put a <wbr>: after pause and closing punctuation, and after the phrase-final
	particles 的 / 了. That keeps words whole ("人类只是再次提升了 / 编程的抽象层级")
	without a segmenter. Word segmenters (BudouX, Intl.Segmenter) split words such as
	厚黑学 or 面前 and break inside Latin words, which is worse for these titles.
*/

/** Closing and pause marks: a line may break after them. */
const CLOSE = "，。、；：！？）】」』”’》〉";
/** Opening marks: a line never breaks after them. */
const OPEN = "（【「『“‘《〈";
/** 了解, 的确 … : the particle starts a word here, so no break after it. */
const PARTICLE_EXCEPTIONS: Record<string, string> = {
	了: "解结然却不得",
	的: "确士话",
};

const CJK = /[㐀-鿿豈-﫿]/;

export type Token = { text: string; breakAfter: boolean; compress: boolean };

export function hasCJK(text: string): boolean {
	return CJK.test(text);
}

/**
	A Latin phrase of several words next to Chinese ("GPT-6 + Open Design前端设计") stays on
	one line: its spaces become no-break spaces, and a real space at its Chinese edge is
	where the line may break. A single Latin word ("一年半Agent后") never gets a break
	around it; text-autospace supplies its gap.
*/
function latinPhrases(chars: string[]): { glue: Set<number>; edges: Set<number> } {
	const glue = new Set<number>();
	const edges = new Set<number>();
	const printable = (c: string | undefined) => c !== undefined && c >= "!" && c <= "~";
	let i = 0;
	while (i < chars.length) {
		if (!printable(chars[i])) {
			i += 1;
			continue;
		}
		let end = i;
		let j = i;
		while (j < chars.length && (printable(chars[j]) || chars[j] === " ")) {
			if (chars[j] !== " ") end = j;
			j += 1;
		}
		const spaces: number[] = [];
		for (let k = i; k <= end; k++) if (chars[k] === " ") spaces.push(k);
		const before = CJK.test(chars[i - 1] ?? "");
		const after = CJK.test(chars[end + 1] ?? "");
		if (spaces.length > 0 && (before || after)) {
			for (const k of spaces) glue.add(k);
			if (before) edges.add(i - 1);
			if (after) edges.add(end);
		}
		i = j;
	}
	return { glue, edges };
}

/** Split text into characters annotated with break points and 标点挤压 marks. */
export function tokenize(text: string, opts: { breaks: boolean; compress: boolean }): Token[] {
	const chars = Array.from(text);
	const phrases = opts.breaks
		? latinPhrases(chars)
		: { glue: new Set<number>(), edges: new Set<number>() };
	return chars.map((c, i) => {
		const prev = chars[i - 1] ?? "";
		const next = chars[i + 1] ?? "";
		if (phrases.glue.has(i)) return { text: " ", breakAfter: false, compress: false };
		// A <wbr> here would block text-autospace (it stops at element boundaries), leaving
		// "Design前端" tight; a real space gives the same break point plus the gap.
		const edge = phrases.edges.has(i);
		let breakAfter = false;
		if (opts.breaks && next && !/\s/.test(next) && !CLOSE.includes(next)) {
			if (CLOSE.includes(c)) {
				breakAfter = true;
			} else if (
				c in PARTICLE_EXCEPTIONS &&
				CJK.test(prev) &&
				CJK.test(next) &&
				!PARTICLE_EXCEPTIONS[c]?.includes(next)
			) {
				breakAfter = true;
			}
		}
		// 标点挤压: half-width the first of two adjacent full-width marks.
		const compress =
			opts.compress &&
			((CLOSE.includes(c) && (CLOSE.includes(next) || OPEN.includes(next))) ||
				(OPEN.includes(c) && OPEN.includes(prev)));
		return { text: edge ? `${c} ` : c, breakAfter, compress };
	});
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** HTML for a title or deck: escaped, with <wbr> break points and 标点挤压. */
export function typesetHtml(text: string, opts = { breaks: true, compress: true }): string {
	return tokenize(text, opts)
		.map((t) => {
			const ch = t.compress ? `<span class="pc">${escapeHtml(t.text)}</span>` : escapeHtml(t.text);
			return t.breakAfter ? `${ch}<wbr>` : ch;
		})
		.join("");
}

/** Wrap Latin runs ("Agent", "C & Unix") in span.latin so they take the Latin face and spacing. */
export function latinSpansHtml(text: string): string {
	let out = "";
	let last = 0;
	for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9 .\-&]*[A-Za-z0-9]|[A-Za-z]/g)) {
		const start = m.index ?? 0;
		out += `${escapeHtml(text.slice(last, start))}<span class="latin">${escapeHtml(m[0])}</span>`;
		last = start + m[0].length;
	}
	return out + escapeHtml(text.slice(last));
}
