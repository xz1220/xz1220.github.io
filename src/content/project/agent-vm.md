---
title: "AVM"
description: "An earlier experiment in defining an AI coding-agent setup once and using it across multiple runtimes."
publishDate: "2026-05-24"
repo: "https://github.com/xz1220/AVM"
featured: false
tags: ["cli", "ai-agents", "go", "typescript", "devtools", "tui"]
---

AVM (`avm`) is a local config manager for AI coding agents. You build a reusable **Agent** — instructions, skills, MCP servers, and runtime preferences — and AVM renders it into runtime-specific managed config for whichever tool you launch, keeping your hand-edited files out of its way.

It ships as two paired binaries: `avm`, a non-interactive Go CLI built for scripts and CI (every command takes flags or stdin and can emit `--json`), and `avm-ui`, a full-screen TypeScript TUI that shells out to `avm` over a documented JSON contract for interactive editing and browsing.

## Highlights

- Define an Agent once and apply it across runtimes; each driver reports every field as `native`, `rendered_as_instructions`, `ignored`, or `unsupported`.
- Capabilities (skills and MCP servers) are auto-discovered from installed runtimes and content-addressed, so you can bootstrap and import what you already have.
- Share or reinstall an Agent and its capabilities as a portable `.avm.zip` Package, with conflict handling on install.
- Per-(Agent, runtime) isolation boundaries keep managed config under `~/.avm` — AVM never writes runtime-managed paths directly or copies secrets into portable profiles.
- One-command install script sets up both binaries, initializes `~/.avm`, and adds shell integration for bash, zsh, or fish.

## Status

AVM is an earlier experiment and is no longer a current focus. The project remains available as a reference. It is built in Go plus a TypeScript/Ink TUI and released under the PolyForm Noncommercial License 1.0.0.
