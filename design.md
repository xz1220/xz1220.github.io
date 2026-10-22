# Design — 邢政的笔记

The locked design system for the site: 「长文书房 The Book」, committed 2026-10-22.
It replaces the Lil'Log-inspired system of 2026-08-31. The site reads like a
well-typeset modern Chinese non-fiction book: a contents page for a home, essays as
chapters, sources in the margin. Do not drift back to a generic blog template, and do
not turn it into 中国风 / ink-wash decoration either. The book feel comes from type
and layout, not ornaments.

## Genre

Editorial / bookish. Chinese-first: most writing is long-form Chinese. English pages
(the Open Dynamic Workflows project page, any English post) use the same system with
Latin typography.

## Macrostructure

- **Spread** (home, 目录, 作品, 关于, tags, 404): a narrow pinned 扉页 (title page) on
  the left — 290px, title + one-line byline only (the home title already carries the
  name, so it has no byline), nothing else — a 1px gutter rule, and
  the page itself on the right. Below 1100px the spread stacks.
- **Home = 目录**: posts grouped into 卷 (parts) with large vermilion numerals, dot
  leaders to the reading time, the deck and the date. Then 附录 · 作品, one line per work.
- **Chapter** (posts, project pages): a 632px text column plus a 240px margin for
  sidenotes and figure captions (Tufte-style). Kicker (卷 · name · number), title,
  deck, meta line, 本篇 TOC in the margin, optional frontispiece, prose, then 首发于知乎 →,
  上一篇 / 下一篇 and 回到目录. Below 1000px sidenotes become inline note blocks.
- **Running head**: wordmark `邢政的笔记` (行书), 目录 / 作品 / 关于, and the 日 / 夜
  toggle. At 420px and below the nav moves to its own row. No search, no language
  toggle until there is an English edition.

## Theme

Warm paper and ink, one vermilion accent for numerals, sidenote markers and hover.

| token | 日 (light) | 夜读 (dark) |
| --- | --- | --- |
| `--paper` | `#f7f4ec` | `#1a1814` |
| `--paper-2` | `#efeadf` | `#24211b` |
| `--ink` | `#1f1d1a` | `#e8e1d3` |
| `--ink-2` | `#3d3a34` | `#cfc7b7` |
| `--muted` | `#6b665c` | `#a29a8a` |
| `--rule` | `#e3ddd0` | `#36322b` |
| `--dots` | `#b4ac9c` | `#645d50` |
| `--accent` | `#b5402a` | `#e07a5f` |

Dark mode follows the system; the 日 / 夜 toggle stores an explicit choice in
`localStorage.theme` and is applied before first paint (`src/layouts/Base.astro`).
Images are never inverted.

## Typography

- Serif for reading: `"CJK Quotes", "Source Serif 4", "Noto Serif SC", serif`. Latin runs
  get Source Serif 4, CJK gets Noto Serif SC. Small UI labels use Noto Sans SC.
- **行书 for titles only**: the wordmark, the 扉页 titles and the section titles (目录,
  附录 · 作品) use 志莽行书 (Zhi Mang Xing, OFL) via `--xingshu`, with
  `font-synthesis: none` because it has one weight. Article titles, headings and body
  text stay serif — that is the reading face the owner wants. Zhi Mang Xing covers the
  6,763 GB2312 characters; anything rarer falls back to Noto Serif SC. An English
  edition would set "Daniel's Notes" in a calligraphic Latin face (not chosen yet).
- "CJK Quotes" makes “ ” ‘ ’ in Chinese text full-width. English runs (`lang="en"`,
  `.latin`) use `--serif-latin`, without it, so they keep proportional quotes.
- Chinese body 18px / 1.9 (17px on phones); English prose 19px / 1.7.
- **CJK is never italic.** Captions, decks and emphasis stay roman; English quotes may
  be italic.
- Titles and headings use `word-break: keep-all` + `text-wrap: balance` with explicit
  break points from `src/utils/typeset.ts`: after pause/closing punctuation and the
  particles 的 / 了, and at the Chinese edge of multi-word Latin phrases. Never split a
  word ("抽 / 象层级"). Word segmenters (BudouX, Intl.Segmenter) were tried and rejected:
  they split words like 厚黑学 and Latin words.
- 标点挤压: the first of two adjacent full-width marks is half-width (`.pc`, `halt`).
- `text-autospace: normal` spaces Chinese and Latin; don't add manual spaces for it.
- Dates are ISO `YYYY-MM-DD`, tabular figures.

## Webfonts

Never link Google Fonts from production pages; Google is unreachable from mainland
China. `scripts/localize-fonts.mjs` runs after `astro build`: it keeps only the
`unicode-range` slices the built pages use, self-hosts them under `/fonts/`, adds the
CJK Quotes face and rewrites the links. It fails the build rather than ship Google
links. Dev mode links Google directly.

## Content conventions

- Post frontmatter: `part: agent | career` picks the 卷 (卷一 Agent 工程 / 卷二 创业与职场).
  Chinese posts are numbered 01, 02 … by publish date across the whole 目录; English
  posts (`lang: en-…`) go to 附 English, lettered A, B ….
- `frontispiece: true` shows `coverImage` as the 卷首图 with `coverCredit`. Only use it
  for real artwork. `coverInBody` hides a body image that repeats the cover.
- Citations are GFM footnotes (`[^n]` + `[^n]: label`); they render as sidenotes.
  Ordinary links stay inline links.
- A figure is an image followed by an italic-only line; it becomes `图 n` with a
  roman caption in the margin.
- 作品 lists only public, non-fork repositories with at least 10 stars
  (`src/data/works.ts`), with live star counts from the GitHub API at build time.
  Private repositories must never appear anywhere on the site.

## What pages must share

- The running head, footer, tokens and focus treatment.
- Serif type, vermilion numerals, hairline rules, no shadows, no rounded cards.
- Static presentation: no reveals, parallax or looping animation. Hover only changes
  colour or underline.

## Implementation map

- `src/styles/global.css` — the whole stylesheet (tokens, spread, 目录, chapter, sidenotes).
- `src/layouts/Base.astro` — head, theme script, running head, footer.
- `src/layouts/BlogPost.astro` — the chapter page.
- `src/components/book/*` — running head, footer, title page, 目录, works list.
- `src/plugins/rehype-book.ts` — figures, sidenotes, chapter heads, quotes, 标点挤压.
- `src/utils/typeset.ts` — break points and 标点挤压 for titles and headings.
- `src/data/post.ts` (`getContents`) and `src/data/works.ts` — 目录 and 作品 data.
