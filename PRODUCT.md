# PRODUCT.md — danielxing 的笔记

## What this is

Daniel Xing's personal site: long-form notes on building AI agents, and on work in a
big tech company and at a startup. It is a reading surface and a small record of work,
not a marketing page or an activity dashboard.

## Owner & audience

- Owner: Daniel Xing (邢政), an engineer building AI agents and the infrastructure
  around them. He spent late 2024 to mid 2026 on agent architecture for an AI creation
  platform at a big tech company, then left to start a company. Current open-source
  work: Open Dynamic Workflows.
- Readers: mostly Chinese-speaking engineers and builders, many arriving from Zhihu,
  plus collaborators. Write and design Chinese-first; English pages are the exception.
- Name and byline: the site is 「danielxing 的笔记」; the byline is "Daniel Xing". Do not
  use the old "KK" persona or put a career timeline on the home page.

## Voice

Plain, first-hand and specific. Say what happened and what was learned. No marketing
hooks, invented metrics, emoji, badges or subscription prompts. Keep the career story
short: three sentences on the about page are enough.

## Design direction (committed 2026-10-22)

「长文书房 The Book」 — see `design.md`. The home page is a 目录 (contents page), articles
are chapters with sidenotes, and Chinese typography is done properly: no italic CJK,
phrase-aware line breaks, 标点挤压, self-hosted subset webfonts.

## Structure

Astro 6, plain CSS, statically built and hosted on GitHub Pages.

- `/` — 目录 + 附录 · 作品. `/posts/` repeats the full 目录.
- `/posts/<slug>/` — chapters. Citations are footnotes rendered as sidenotes.
- `/projects/` — 作品: public repositories with ≥10 stars only, live star counts.
  `/projects/<slug>/` exists for listed works that have a page in `src/content/project`.
- `/about/` — short bio, contact, colophon.
- `/tags/…` — kept for old links, not in the navigation.
- RSS, sitemap, robots.txt, canonical URLs, Open Graph and BlogPosting JSON-LD (with
  `isBasedOn` for posts first published on Zhihu) stay intact.
