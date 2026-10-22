import type { Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

/** Adds `readingTime` (e.g. "22 min read") and `readingMinutes` (22) to the frontmatter. */
export function remarkReadingTime() {
	// @ts-expect-error:next-line
	return (tree: Root, { data }) => {
		// Footnote definitions are sidenotes (sources), not reading text.
		const body = {
			...tree,
			children: tree.children.filter((n) => n.type !== "footnoteDefinition"),
		};
		const readingTime = getReadingTime(mdastToString(body));
		data.astro.frontmatter.readingTime = readingTime.text;
		data.astro.frontmatter.readingMinutes = Math.max(
			1,
			Math.ceil(Number(readingTime.minutes.toFixed(2))),
		);
	};
}
