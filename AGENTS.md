# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project overview

Cherri is a CLI tool for automated cherry-picking of GitHub pull requests. It is written in TypeScript and built with Bun.

## Tech stack

- **Runtime / package manager:** Bun
- **Language:** TypeScript
- **Linting & formatting:** Biome
- **Unused code detection:** Knip
- **Tests:** Bun test runner

## Commands

```bash
bun install          # Install dependencies
bun run build        # Build the CLI to dist/
bun run test         # Run unit tests
bun run biome:check  # Lint, format, and fix issues in src/
bun run biome:lint   # Lint only
bun run biome:format # Format only
bun run knip         # Find unused dependencies, exports, and files
```

## Verification

Before finishing a change, do not only run build and format checks. Also run Knip to catch unused dependencies, exports, and files:

```bash
bun run build
bun run biome:check
bun run knip
bun test
```

All of these commands should pass before committing.

## Code style

- Match existing patterns in the surrounding code.
- Keep changes focused and minimal.
- Use Biome for formatting; do not introduce alternate formatters.
