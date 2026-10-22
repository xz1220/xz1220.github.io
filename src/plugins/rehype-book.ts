/*
	Markdown → 「长文书房」 article markup. Runs after rehypeHeadingIds and
	rehype-unwrap-images (see astro.config.ts). In order:

	1. figures   an image followed by an italic-only paragraph becomes
	             <figure class="fig"> with a numbered, non-italic caption (图 n)
	2. sidenotes GFM footnotes become sidenotes: <sup class="sn-ref"> in the text and
	             <span class="sidenote"> at the end of the citing block
	3. headings  h2 → chapter heads (第一节 …), h3 → sub-heads, with phrase breaks
	4. quotes    quotes without Chinese become English pull-quotes
	5. 标点挤压  for Chinese documents (see src/utils/typeset.ts)
*/
import { join } from "node:path";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { imageSize } from "../utils/imageSize";
import { hasCJK, type Token, tokenize } from "../utils/typeset";

interface Frontmatter {
	lang?: string;
	frontispiece?: boolean;
	coverInBody?: string;
}

interface MarkdownFile {
	data: { astro?: { frontmatter?: Record<string, unknown> } };
}

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
/** Article column width and the tallest a figure may get on it (px). */
const COLUMN = 632;
const MAX_FIGURE_HEIGHT = 680;

export function rehypeBook() {
	return (tree: Root, file: MarkdownFile) => {
		const fm = (file.data.astro?.frontmatter ?? {}) as Frontmatter;
		const zh = fm.lang ? fm.lang.startsWith("zh") : hasCJK(textOf(tree));
		figures(tree, fm, zh);
		sidenotes(tree);
		headings(tree, zh);
		quotes(tree);
		if (zh) compressPunctuation(tree);
	};
}

// ------------------------------------------------------------------ helpers
function isElement(node: unknown, tagName?: string): node is Element {
	const n = node as Element | undefined;
	return n?.type === "element" && (tagName === undefined || n.tagName === tagName);
}

function isBlank(node: RootContent | ElementContent | undefined): boolean {
	return node?.type === "text" && node.value.trim() === "";
}

function textOf(node: Root | RootContent | ElementContent): string {
	if (node.type === "text") return node.value;
	if ("children" in node) return node.children.map((c) => textOf(c as ElementContent)).join("");
	return "";
}

function el(tagName: string, className: string | undefined, children: ElementContent[]): Element {
	return {
		type: "element",
		tagName,
		properties: className ? { className: [className] } : {},
		children,
	};
}

function txt(value: string): Text {
	return { type: "text", value };
}

/** Text → text runs, <wbr> and span.pc, following the typeset tokens. */
function typesetNodes(tokens: Token[]): ElementContent[] {
	const out: ElementContent[] = [];
	let run = "";
	for (const t of tokens) {
		if (t.compress) {
			if (run) out.push(txt(run));
			run = "";
			out.push(el("span", "pc", [txt(t.text)]));
		} else {
			run += t.text;
		}
		if (t.breakAfter) {
			if (run) out.push(txt(run));
			run = "";
			out.push(el("wbr", undefined, []));
		}
	}
	if (run) out.push(txt(run));
	return out;
}

// ------------------------------------------------------------------ 1. figures
function figures(tree: Root, fm: Frontmatter, zh: boolean) {
	const kids = tree.children;
	const out: RootContent[] = [];
	let n = 0;
	for (let i = 0; i < kids.length; i++) {
		const node = kids[i];
		if (!node || !isElement(node, "img")) {
			if (node) out.push(node);
			continue;
		}
		let j = i + 1;
		while (isBlank(kids[j])) j++;
		const next = kids[j];
		let caption: ElementContent[] | undefined;
		if (isElement(next, "p")) {
			const inner = next.children.filter((c) => !isBlank(c));
			const em = inner[0];
			if (inner.length === 1 && isElement(em, "em")) {
				caption = em.children;
				i = j;
			}
		}
		const src = String(node.properties.src ?? "");
		if (fm.frontispiece && fm.coverInBody && src === fm.coverInBody) continue;

		n += 1;
		const alt = String(node.properties.alt ?? "");
		node.properties.loading = "lazy";
		node.properties.decoding = "async";
		const size = src.startsWith("/") ? imageSize(join(process.cwd(), "public", src)) : undefined;
		if (size) {
			node.properties.width = size.width;
			node.properties.height = size.height;
			// Tall images are capped so they never run past MAX_FIGURE_HEIGHT on the column.
			const capped = Math.round((MAX_FIGURE_HEIGHT * size.width) / size.height);
			if (capped < COLUMN) node.properties.style = `width: min(100%, ${capped}px)`;
		}
		const label = el("span", "fig-no", [txt(zh ? `图 ${n}` : `Fig. ${n}`)]);
		const figcaption = el("figcaption", undefined, [
			label,
			txt(zh ? "　" : " "),
			...(caption ?? [txt(alt)]),
		]);
		out.push(el("figure", "fig", [figcaption, node]));
	}
	tree.children = out;
}

// ------------------------------------------------------------------ 2. sidenotes
function sidenotes(tree: Root) {
	const definitions = new Map<string, ElementContent[]>();
	tree.children = tree.children.filter((node) => {
		if (!isElement(node, "section") || !("dataFootnotes" in node.properties)) return true;
		for (const li of findAll(node, "li")) {
			definitions.set(String(li.properties.id ?? ""), noteContent(li));
		}
		return false;
	});
	if (definitions.size === 0) return;

	let count = 0;
	// Pre-order, so notes are numbered in reading order.
	const walk = (parent: Element | Root) => {
		if (parent.type === "element" && parent.children.some(isFootnoteRef)) attach(parent);
		for (const child of parent.children) {
			if (isElement(child) && !isElement(child, "sup")) walk(child);
		}
	};
	const attach = (parent: Element) => {
		const children: ElementContent[] = [];
		const notes: Element[] = [];
		let marker: Element | undefined;
		for (const child of parent.children) {
			if (!isFootnoteRef(child)) {
				marker = undefined;
				children.push(child);
				continue;
			}
			const ref = findAll(child, "a")[0];
			const target = String(ref?.properties.href ?? "").replace(/^#/, "");
			count += 1;
			const anchor: Element = {
				type: "element",
				tagName: "a",
				properties: { href: `#sn${count}`, id: `snref${count}` },
				children: [txt(String(count))],
			};
			// Adjacent references share one marker: ⁴,⁵
			if (marker) {
				marker.children.push(txt(","), anchor);
			} else {
				marker = el("sup", "sn-ref", [anchor]);
				children.push(marker);
			}
			const note = el("span", "sidenote", [
				el("span", "sn-no", [txt(String(count))]),
				...structuredClone(definitions.get(target) ?? []),
			]);
			note.properties.id = `sn${count}`;
			notes.push(note);
		}
		// Notes go at the end of the citing block, before any nested list.
		const nested = children.findIndex((c) => isElement(c, "ul") || isElement(c, "ol"));
		if (nested === -1) children.push(...notes);
		else children.splice(nested, 0, ...notes);
		parent.children = children;
	};
	walk(tree);
}

function isFootnoteRef(node: RootContent | ElementContent): node is Element {
	return (
		isElement(node, "sup") && findAll(node, "a").some((a) => "dataFootnoteRef" in a.properties)
	);
}

function findAll(node: Element, tagName: string): Element[] {
	const found: Element[] = [];
	for (const child of node.children) {
		if (!isElement(child)) continue;
		if (child.tagName === tagName) found.push(child);
		found.push(...findAll(child, tagName));
	}
	return found;
}

/** A footnote definition's inline content, without its ↩ back-link or wrapping <p>. */
function noteContent(li: Element): ElementContent[] {
	const inline = li.children.flatMap((c) => (isElement(c, "p") ? c.children : [c]));
	const kept = inline.filter((c) => !(isElement(c, "a") && "dataFootnoteBackref" in c.properties));
	while (kept.length && isBlank(kept[kept.length - 1])) kept.pop();
	const last = kept[kept.length - 1];
	if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
	while (kept.length && isBlank(kept[0])) kept.shift();
	return kept;
}

// ------------------------------------------------------------------ 3. headings
function headings(tree: Root, zh: boolean) {
	let h2 = 0;
	for (const node of tree.children) {
		if (!isElement(node)) continue;
		if (node.tagName === "h2") {
			h2 += 1;
			node.properties.className = ["ch"];
			if (zh) {
				const first = node.children[0];
				if (first?.type === "text")
					first.value = first.value.replace(/^[一二三四五六七八九十]+、\s*/, "");
				typesetChildren(node);
				const label = h2 <= 10 ? `第${CN_NUM[h2 - 1]}节` : `第 ${h2} 节`;
				node.children.unshift(el("span", "ch-no", [txt(label)]));
			}
		} else if (node.tagName === "h3") {
			node.properties.className = ["sub-h"];
			if (zh) typesetChildren(node);
		}
	}
}

function typesetChildren(node: Element) {
	node.children = node.children.flatMap((c) =>
		c.type === "text" ? typesetNodes(tokenize(c.value, { breaks: true, compress: true })) : [c],
	);
}

// ------------------------------------------------------------------ 4. quotes
function quotes(tree: Root) {
	for (const node of tree.children) {
		if (isElement(node, "blockquote") && !hasCJK(textOf(node))) {
			node.properties.className = ["quote-en"];
			node.properties.lang = "en";
		}
	}
}

// ------------------------------------------------------------------ 5. 标点挤压
const NO_COMPRESS = new Set(["pre", "code", "h2", "h3", "script", "style"]);

function compressPunctuation(node: Root | Element) {
	node.children = (node.children as ElementContent[]).flatMap((c) => {
		if (c.type === "text") {
			const tokens = tokenize(c.value, { breaks: false, compress: true });
			return tokens.some((t) => t.compress) ? typesetNodes(tokens) : [c];
		}
		if (isElement(c) && !NO_COMPRESS.has(c.tagName)) compressPunctuation(c);
		return [c];
	}) as typeof node.children;
}
