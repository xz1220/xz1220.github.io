# PRODUCT.md — Daniel Xing

## What this is

Daniel Xing's personal site and blog: a quiet home for his projects and writing
about AI agents. It is a portfolio and a long-form reading surface, not a
marketing page or an activity dashboard.

## Owner & audience

- Owner: Daniel Xing (邢政), a builder working on AI agents and the infrastructure
  around them. He is based in Shenzhen, China, and occasionally in Shanghai.
- Current work: Open Dynamic Workflows, a practical runtime for portable
  AI-agent workflows.
- Current interests: multi-agent systems, AI products, knowledge work, and
  production-ready agent systems for solo builders.
- Audience: engineers, researchers, builders, and potential collaborators. The
  site should read like a well-kept research notebook.
- Primary language: English, with possible Chinese writing. Native CJK fallbacks
  are required.

## Voice

Restrained, direct, precise, and stable. State what Daniel is building and
exploring. Avoid marketing hooks, invented metrics, emoji flourishes,
self-promotion badges, and subscription calls to action. Every word earns its
place.

## Design direction (committed 2026-08-31)

**Editorial / austere** — a quiet research notebook built for sustained reading.

The reading and structural reference is Lilian Weng's Lil'Log. This project keeps
its own name, content, framework, and visual identity; it adapts the reference's
clarity rather than copying its page pixels or brand.

- Cool near-white paper, near-black ink, quiet grey rules, and one restrained
  blue accent. Dark mode stays cool-neutral.
- Native system sans for display and body; native system mono for code.
- A 720px reading column, 16px body copy, 1.6 line-height, and generous vertical
  rhythm.
- Hairline dividers, cards with at most an 8px radius, and no shadows.
- No decorative project plates, background grids, stock imagery, or animation.
  Figures exist only when they explain the content.
- Links are the primary interaction. Hover and focus states change colour or
  underline treatment without movement.

## Structure

Astro 6 + Tailwind 4, statically built and hosted on GitHub Pages. Content lives
in post, project, and tag collections. Search uses Pagefind; social cards use
Satori.

- Home: compact introduction, latest posts, then selected work.
- Posts, projects, and tags: simple browsable indexes.
- Articles and project details: one long-form reading column with an optional
  collapsed table of contents.
- About: extended biography, contact links, and a small colophon. QR cards may
  be added here later, but never dominate the main reading flow.

The canonical visual rules and tokens live in `design.md` and
`src/styles/tokens.css`.
