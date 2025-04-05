# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `pnpm build`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Single test: `pnpm exec playwright test tests/specific-file.test.ts`
- Single test case: `pnpm exec playwright test tests/specific-file.test.ts -g "test name"`
- Database migrations: `pnpm db:migrate`

## Code Style
- Use 2-space indentation with spaces (not tabs)
- 80 character line width
- Single quotes for strings, double quotes for JSX
- Always use semicolons and trailing commas
- Use PascalCase for components/types, camelCase for variables/functions
- Group imports: external libs → React/Next → internal (@) → relative
- 'use client' directive at top when needed
- No explicit `any` types unless absolutely necessary
- Use React functional components with explicit return types
- Follow error handling patterns with try/catch blocks
- Document complex logic with concise comments