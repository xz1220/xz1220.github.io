/*
	作品 (works). Only public, non-fork repositories with at least MIN_STARS stars are
	listed. Stars come from the GitHub API at build time (the deploy workflow passes
	GITHUB_TOKEN and rebuilds daily); if the API is unreachable the last known counts
	below are used. /users/:user/repos only returns public repositories, so private
	work can never appear here.
*/

export const MIN_STARS = 10;
const GITHUB_USER = "xz1220";
const GROUPS = ["Agent 运行时与工具", "写作与资料", "其他"] as const;
type Group = (typeof GROUPS)[number];

export interface Work {
	repo: string;
	name: string;
	group: Group;
	language?: string | undefined;
	status?: { label: string; archived?: boolean } | undefined;
	/** One line for the home page. */
	mini: string;
	/** One or two sentences for the 作品 page. */
	desc: string;
	/** Slug of a post about this work. */
	related?: string | undefined;
	lastKnownStars: number;
}

export interface ListedWork extends Work {
	stars: number;
}

/** Curated Chinese copy for the public repositories. */
const CURATED: Work[] = [
	{
		repo: "open-dynamic-workflows",
		name: "Open Dynamic Workflows",
		group: "Agent 运行时与工具",
		language: "TypeScript",
		status: { label: "进行中" },
		mini: "跨 Coding Agent CLI 的动态工作流运行时",
		desc: "用纯 JavaScript 写动态工作流，通过 agent()、parallel()、pipeline() 调度多个 Coding Agent；同一份脚本可以在 Codex、Claude Code、Gemini、Qwen、Kimi 等 CLI 上运行。",
		lastKnownStars: 111,
	},
	{
		repo: "AVM",
		name: "AVM",
		group: "Agent 运行时与工具",
		language: "Go",
		status: { label: "已归档", archived: true },
		mini: "定义一次 Agent，在多个运行时使用",
		desc: "AI Coding Agent 的本地配置管理器：把指令、技能、MCP 和运行时偏好定义一次，再渲染成不同运行时各自的配置。",
		lastKnownStars: 3,
	},
	{
		repo: "Kempt",
		name: "Kempt",
		group: "Agent 运行时与工具",
		language: "TypeScript",
		mini: "Coding Agent 本地状态体检与可逆清理",
		desc: "Claude Code / Codex 的 Agent 债务扫描与可逆清理：给记忆、技能、MCP、缓存等本地状态做健康评分。只在本地运行，默认只读。",
		lastKnownStars: 2,
	},
	{
		repo: "harness-book",
		name: "harness-book",
		group: "写作与资料",
		language: "Python",
		mini: "从零手写 ReAct loop 讲 harness 工程的开源书",
		desc: "讲解 Agent harness 工程的开源书：从零手写最简 ReAct loop，再让它自举更新自己，演化到完整 harness。",
		lastKnownStars: 1,
	},
	{
		repo: "awesome-dynamic-workflows",
		name: "awesome-dynamic-workflows",
		group: "写作与资料",
		mini: "动态工作流精选合集",
		desc: "动态工作流精选合集，面向兼容 Open Dynamic Workflows 的运行时。",
		lastKnownStars: 1,
	},
	{
		repo: "agent-interview-prep",
		name: "agent-interview-prep",
		group: "写作与资料",
		language: "Shell",
		mini: "Agent 面试题库与源码资料",
		desc: "Agent 面试题库，配优质 Agent 源码资料，以及从题目到资料的映射；题库正文在飞书。",
		lastKnownStars: 1,
	},
	{
		repo: "repotempo",
		name: "repotempo",
		group: "其他",
		language: "Go",
		mini: "GitHub 趋势追踪与每日 Star 历史",
		desc: "独立的 GitHub 趋势追踪：以 Trending 为入口发现项目，记录每日 Star 历史，附自托管看板。",
		related: "gpt-6-open-design-frontend",
		lastKnownStars: 0,
	},
	{
		repo: "DIG-Data-Annotation-Platform",
		name: "DIG-Data-Annotation-Platform",
		group: "其他",
		language: "Go",
		mini: "2020 年的 CV 数据标注平台",
		desc: "2020 年做的计算机视觉数据标注平台，附带容器监控系统。",
		lastKnownStars: 4,
	},
];

interface PublicRepo {
	name: string;
	stars: number;
	description: string | null;
	language: string | null;
}

/** The listed work a project page belongs to, matched by repository URL. */
export function workForRepo(
	works: ListedWork[],
	repoUrl: string | undefined,
): ListedWork | undefined {
	const key = repoUrl?.replace(/\/$/, "").toLowerCase();
	return works.find((w) => `https://github.com/${GITHUB_USER}/${w.repo}`.toLowerCase() === key);
}

let listed: Promise<ListedWork[]> | undefined;

/** Works with at least MIN_STARS stars, grouped in display order. Fetched once per build. */
export function getListedWorks(): Promise<ListedWork[]> {
	listed ??= loadWorks();
	return listed;
}

export function groupWorks(works: ListedWork[]): { group: Group; works: ListedWork[] }[] {
	return GROUPS.map((group) => ({ group, works: works.filter((w) => w.group === group) })).filter(
		(g) => g.works.length > 0,
	);
}

async function loadWorks(): Promise<ListedWork[]> {
	const live = await fetchPublicRepos();
	const curated = new Set(CURATED.map((w) => w.repo.toLowerCase()));
	const works: ListedWork[] = CURATED.flatMap((w) => {
		if (!live) return [{ ...w, stars: w.lastKnownStars }];
		// Missing from the public list: renamed, deleted or made private. Never list it.
		const repo = live.get(w.repo.toLowerCase());
		return repo ? [{ ...w, stars: repo.stars }] : [];
	});
	for (const [key, repo] of live ?? []) {
		if (curated.has(key)) continue;
		const desc = repo.description ?? "";
		works.push({
			repo: repo.name,
			name: repo.name,
			group: "其他",
			language: repo.language ?? undefined,
			mini: desc,
			desc,
			lastKnownStars: repo.stars,
			stars: repo.stars,
		});
	}
	return works
		.filter((w) => w.stars >= MIN_STARS)
		.sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || b.stars - a.stars);
}

async function fetchPublicRepos(): Promise<Map<string, PublicRepo> | undefined> {
	const headers: { Accept: string; "User-Agent": string; Authorization?: string } = {
		Accept: "application/vnd.github+json",
		"User-Agent": `${GITHUB_USER}.github.io build`,
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;
	try {
		const res = await fetch(
			`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`,
			{
				headers,
			},
		);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const repos = (await res.json()) as {
			name: string;
			fork: boolean;
			private: boolean;
			stargazers_count: number;
			description: string | null;
			language: string | null;
		}[];
		return new Map(
			repos
				.filter((r) => !r.fork && !r.private)
				.map((r) => [
					r.name.toLowerCase(),
					{
						name: r.name,
						stars: r.stargazers_count,
						description: r.description,
						language: r.language,
					},
				]),
		);
	} catch (error) {
		console.warn(
			`[works] GitHub API unavailable (${String(error)}); using last known star counts.`,
		);
		return undefined;
	}
}
