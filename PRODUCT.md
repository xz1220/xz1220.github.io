# PRODUCT.md — xz1220.github.io

## What this is

Daniel Xing's personal site: a builder's public notebook. Projects he shipped,
essays he wrote, links to find him. Design IS the product here (brand register:
portfolio / long-form content).

## Owner & audience

- Owner: Daniel Xing (邢政), backend/algorithms background, building AI-agent
  tooling (ODW, AVM), full-time CTO of a startup. Writes in English, may write
  Chinese — CJK fallback fonts are mandatory.
- Audience: engineers, potential collaborators, investors who look him up.
  They judge craft. The site should read like a well-kept engineering document.

## Voice

克制沉默: restrained, quiet, precise, stable. No marketing hooks, no emoji
flourishes, no self-promotion badges ("Editor's Pick"), no subscribe CTAs.
Every word earns its place. Copy states what things are and what they do.

## Design direction (committed 2026-07-18)

**"The drafting table"** — a pre-digital engineering notebook.

References (named, per impeccable/brand.md): engineering graph paper, cyanotype
blueprints, redline markup culture, Bell Labs technical memoranda, drafting
registration marks.

- Light theme = graph-paper notebook: cool near-white, faint grid, ink text,
  one redline-vermilion accent.
- Dark theme = blueprint: deep Prussian blue, pale cyan-paper text, amber
  drafting-lamp accent.
- Type: Source Serif 4 (body/display, technical-manual voice) + Sometype Mono
  (labels/data/nav) + Noto Serif SC (CJK fallback).
- Imagery: every project gets a hand-drafted SVG line-art "plate" (FIG. 01…),
  blueprint-style. No stock photos, no gray placeholder boxes.
- Motion: near none. A single line-draw flourish where it earns its place;
  reduced-motion always respected.

Explicitly avoided (AI-slop lanes): terminal-green phosphor + scanlines
(second-order "terminal-native" trap), IBM Plex/Space Mono (reflex fonts),
Cormorant/Fraunces editorial-serif lane, warm cream backgrounds, tiny uppercase
eyebrows over every section.

## Structure

Astro 6 + Tailwind 4, static build, GitHub Pages via Actions on push to main.
Content collections: post, project, tag. Search via Pagefind. OG images via
satori. No comments/webmentions (unused; may be removed).
