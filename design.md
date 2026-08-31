# Design — Daniel Xing

A locked design system for the site. It adapts the reading DNA of Lilian Weng's
Lil'Log to Daniel's own content without copying its brand or page pixels.

## Genre

Editorial / austere. The site should feel like a quiet research notebook: direct,
stable, and easy to read for long stretches.

## Macrostructure family

- Home and indexes: **Index-First** — compact introduction followed by browsable
  writing and project entries.
- Articles and project details: **Long Document** — one reading column, inline
  headings, figures and references in the prose flow.
- Intro: compact **H5 Letter** without a CTA.
- Navigation: **N1 Wordmark + text links**, responsive disclosure on narrow screens.
- Footer: **Ft2 Inline rule single line**.

## Theme

- `--color-paper`: `oklch(98.5% 0.004 250)`
- `--color-paper-2`: `oklch(96% 0.006 250)`
- `--color-ink`: `oklch(23% 0.012 255)`
- `--color-ink-2`: `oklch(39% 0.012 255)`
- `--color-muted`: `oklch(48% 0.012 255)`
- `--color-rule`: `oklch(89% 0.006 250)`
- `--color-accent`: `oklch(45% 0.09 245)`
- `--color-focus`: `oklch(42% 0.12 245)`

Dark mode keeps the same cool-neutral hue. Elevated surfaces become slightly
lighter than the page; links gain lightness and lose chroma.

## Typography

- Display and body: native system sans stack with CJK system fallbacks.
- Code: native system mono stack.
- Body: `16px / 1.6`, maximum measure `65ch`.
- Article title: `clamp(2rem, 5vw, 2.25rem)` at `1.2` line-height.
- Article headings: `28 / 24 / 18px`, roman, no decorative italics.
- List title: `24px`; excerpt: `14px / 1.6`; metadata: `13px`.
- Numeric metadata uses tabular figures.

## Spacing

4-point named scale in `src/styles/tokens.css`. The reading column is `720px`
with `24px` desktop gutters and `14–20px` narrow-screen gutters. Paragraph rhythm
uses `20px`; larger page transitions use `40–64px`.

## Motion

- Content is static; no reveals, hover lifts, parallax, or looping animation.
- Theme changes may crossfade colour tokens over `220ms`.
- Search/modal behaviour remains functional and respects reduced motion.
- Focus rings appear instantly.

## Microinteractions stance

- Links change underline thickness or colour only.
- Article/index rows change border or paper tint only; no scaling.
- Theme and search controls expose default, hover, focus, active and disabled states.
- All touch targets are at least `44px`.

## Content and CTA voice

- State what Daniel is building and exploring; no marketing claims or invented metrics.
- Primary actions are typographic links: `Read article →`, `View project →`.
- No subscription CTA until there is a real publishing cadence.

## Per-page allowances

- Home: text-first intro, current work, selected projects, latest writing.
- Writing/archive/tags: simple article index with title, two-line summary and metadata.
- Projects: text entries; no decorative project plates.
- Articles: typography only; figures must explain the content.
- About: extended biography and contact details; QR cards may live here later.

## What pages must share

- `Daniel Xing` wordmark and the same navigation.
- Paper, ink, rule and restrained blue accent tokens.
- System sans typography and 720px reading column.
- Hairline dividers, 8px maximum radius, no shadows.
- Static content presentation and the same focus treatment.

## What pages may differ on

- Home/index pages may use bordered entries; articles use negative space.
- Project entries may expose repository/demo links.
- Long research posts may use a collapsed table of contents, figures, code and math.

## Provenance

Studied from `https://lilianweng.github.io/` as a public reference for Daniel's
own brand on 2026-08-31. Page structure, generated HTML and compiled CSS were
inspected. The source site uses Hugo + PaperMod; this project deliberately keeps
Astro and translates only the structural and reading principles.

## Exports

The canonical implementation is `src/styles/tokens.css`.

### tokens.css

```css
:root {
	--color-paper: oklch(98.5% 0.004 250);
	--color-paper-2: oklch(96% 0.006 250);
	--color-ink: oklch(23% 0.012 255);
	--color-ink-2: oklch(39% 0.012 255);
	--color-muted: oklch(48% 0.012 255);
	--color-rule: oklch(89% 0.006 250);
	--color-accent: oklch(45% 0.09 245);
	--color-focus: oklch(42% 0.12 245);
	--font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	--font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
	--space-md: 1rem;
	--space-lg: 1.5rem;
	--space-xl: 2.5rem;
	--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
	--dur-short: 220ms;
	--radius-card: 0.5rem;
}
```

### Tailwind v4

```css
@theme {
	--color-paper: oklch(98.5% 0.004 250);
	--color-ink: oklch(23% 0.012 255);
	--color-accent: oklch(45% 0.09 245);
	--font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	--spacing-md: 1rem;
	--text-base: 1rem;
	--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG tokens.json

```json
{
	"color": {
		"paper": { "$value": "oklch(98.5% 0.004 250)", "$type": "color" },
		"ink": { "$value": "oklch(23% 0.012 255)", "$type": "color" },
		"accent": { "$value": "oklch(45% 0.09 245)", "$type": "color" }
	},
	"space": { "md": { "$value": "1rem", "$type": "dimension" } }
}
```

### shadcn/ui variables

```css
:root {
	--background: 98.5% 0.004 250;
	--foreground: 23% 0.012 255;
	--primary: 45% 0.09 245;
	--muted: 96% 0.006 250;
	--muted-foreground: 48% 0.012 255;
	--border: 89% 0.006 250;
	--ring: 42% 0.12 245;
	--radius: 0.5rem;
}
```
