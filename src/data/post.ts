import { type CollectionEntry, getCollection } from "astro:content";
import { siteConfig } from "@/site.config";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"post">[]> {
	return await getCollection("post", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** Get tag metadata by tag name */
export async function getTagMeta(tag: string): Promise<CollectionEntry<"tag"> | undefined> {
	const tagEntries = await getCollection("tag", (entry) => {
		return entry.id === tag;
	});
	return tagEntries[0];
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
	return Object.groupBy(posts, (post) => post.data.publishDate.getFullYear().toString());
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"post">[]) {
	return posts.flatMap((post) => [...post.data.tags]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"post">[]) {
	return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}

// ------------------------------------------------------------------ 目录 (contents)
/** The 卷 (parts) of the 目录, in order. A post picks one with `part` in its frontmatter. */
export const PARTS = [
	{ key: "agent", no: "卷一", name: "Agent 工程" },
	{ key: "career", no: "卷二", name: "创业与职场" },
] as const;

export interface ContentsEntry {
	post: CollectionEntry<"post">;
	/** "01", "02" … for Chinese posts; "A", "B" … for English ones. */
	no: string;
	english: boolean;
}

export interface ContentsPart {
	no: string;
	name: string;
	english: boolean;
	entries: ContentsEntry[];
}

export function isEnglish(post: CollectionEntry<"post">): boolean {
	return (post.data.lang ?? siteConfig.lang).startsWith("en");
}

/**
 * The 目录: Chinese posts are numbered 01, 02 … by publish date and grouped into their
 * 卷; English posts follow as 附 English, lettered A, B …. `order` is reading order,
 * used for 上一篇 / 下一篇.
 */
export async function getContents(): Promise<{ parts: ContentsPart[]; order: ContentsEntry[] }> {
	const posts = await getAllPosts();
	const byDate = (a: CollectionEntry<"post">, b: CollectionEntry<"post">) =>
		a.data.publishDate.getTime() - b.data.publishDate.getTime();
	const zh = posts
		.filter((post) => !isEnglish(post))
		.sort(byDate)
		.map((post, i) => ({ post, no: String(i + 1).padStart(2, "0"), english: false }));
	const en = posts
		.filter(isEnglish)
		.sort(byDate)
		.map((post, i) => ({ post, no: String.fromCharCode(65 + i), english: true }));
	const parts: ContentsPart[] = PARTS.map((part) => ({
		no: part.no,
		name: part.name,
		english: false,
		entries: zh.filter((entry) => entry.post.data.part === part.key),
	})).filter((part) => part.entries.length > 0);
	if (en.length > 0) parts.push({ no: "附", name: "English", english: true, entries: en });
	return { parts, order: parts.flatMap((part) => part.entries) };
}

export function formatReadTime(minutes: number, english: boolean): string {
	return english ? `${minutes} min` : `${minutes} 分钟`;
}
