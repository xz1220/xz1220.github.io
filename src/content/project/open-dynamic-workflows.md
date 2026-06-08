---
title: "Open Dynamic Workflows"
description: "An open runtime for Claude Code-style dynamic workflows — run the same agent-orchestration scripts on any coding agent (Codex, Claude, Gemini, Qwen, Kimi)."
publishDate: "2026-06-08"
repo: "https://github.com/xz1220/open-dynamic-workflows"
featured: true
tags: ["agent-orchestration", "claude-code", "typescript", "cli", "multi-agent", "workflows"]
---

Open Dynamic Workflows (ODW) is a TypeScript/Node CLI runtime for portable dynamic workflows: plain JavaScript scripts that fan coding agents out with `agent()`, `parallel()`, and `pipeline()` — outside the host agent's own context. Claude Code can already run such scripts inside its private runtime; ODW makes the same scripts portable and standalone, so they become artifacts you can version, share, and run on any coding-agent CLI.

## Highlights

- **Portable across agents** — run the same workflow script on Codex, Claude Code, Gemini, Qwen, Kimi, or a custom CLI; switch the underlying agent by switching adapters. ODW only shells out to local CLIs, never calling model APIs directly.
- **Claude Code's dialect, unchanged** — `export const meta` plus injected `agent` / `parallel` / `pipeline` / `phase` / `log` / `args` / `budget` globals, with top-level `await` and `return`. A script written for Claude Code runs here as-is.
- **Out of context, at scale** — the plan lives in code, so intermediate work never pollutes the host's context and you can fan out dozens of subagents.
- **Reliable hand-offs** — JSON-Schema structured outputs are validated and retried so multi-stage pipelines compose instead of guessing on free text.
- **Background and observable** — every run is a detached worker backed by a run directory with `status`, `logs --follow`, `result`, `pause`/`stop`, plus a zero-dependency live web dashboard (`odw serve`) and a read-only Tauri desktop "observatory".
- **Zero runtime dependencies** — the engine is async TypeScript (`parallel` is `Promise.all`, no threads); workflow scripts stay plain `.js` and ship `.d.ts` authoring types for editor autocomplete.

## Status

Core runtime is shipped on `main` (v0.3.0): adapter layer, execution bridge, workspace isolation, async scheduler, injected primitives, the loader/transform, the JSON-Schema engine, the background runtime, and the `odw` CLI — with 129 passing tests. The flagship `examples/deep-research.js` (fan-out research → adversarial fact-check → cited report) runs end-to-end. Distribution is a prebuilt binary plus a skill (install via script); the npm package is not yet published. Roadmap (v1.5+) includes rich model/agent routing, git-worktree isolation, nested `workflow()`, token-budget accounting, resume/journaling, and a replay-determinism sandbox. MIT licensed.
