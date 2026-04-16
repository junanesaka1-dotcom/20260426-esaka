---
description: Detect code changes under 2.copilotWebRelay/ and update documentation to keep docs aligned with source code
on:
  push:
    branches: [main]
    paths:
      - "2.copilotWebRelay/**"
      - "!2.copilotWebRelay/docs/**"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
  issues: read
tools:
  github:
safe-outputs:
  create-pull-request:
    title-prefix: "docs(copilot-web-relay): "
    labels: [documentation]
    draft: true
---

# Copilot Web Relay Documentation Sync

You are an AI agent responsible for keeping the documentation under `2.copilotWebRelay/docs/` aligned with the source code under `2.copilotWebRelay/`.

## Your Task

When code changes are pushed to `2.copilotWebRelay/`, analyze the current source code and update the documentation to reflect the actual implementation.

## Steps

1. **Read the source code** under `2.copilotWebRelay/`:
   - `backend/src/server.ts` — Express + WebSocket server with Copilot SDK integration
   - `backend/package.json` — Backend dependencies and scripts
   - `backend/tsconfig.json` — TypeScript configuration
   - `frontend/src/App.tsx` — React chat UI component with WebSocket client
   - `frontend/src/App.css` — Chat UI styles (dark theme)
   - `frontend/src/main.tsx` — React entry point
   - `frontend/src/index.css` — Global styles
   - `frontend/vite.config.ts` — Vite configuration with WebSocket proxy
   - `frontend/package.json` — Frontend dependencies and scripts
   - `package.json` — Root monorepo configuration and dev scripts

2. **Read the existing documentation** under `2.copilotWebRelay/docs/` (if any exists).

3. **Compare and identify discrepancies** between the documentation and the actual source code:
   - Changed backend API or WebSocket protocol
   - New or modified Copilot SDK usage (model, session config, event handlers)
   - Changed frontend components or UI behavior
   - Updated dependencies or configuration
   - New features or removed functionality

4. **Update or create documentation files** under `2.copilotWebRelay/docs/`:
   - `2.copilotWebRelay/docs/architecture.md` — System architecture overview (backend, frontend, WebSocket protocol, Copilot SDK integration)
   - `2.copilotWebRelay/docs/api-reference.md` — WebSocket message protocol reference (message types, formats, flow)
   - `2.copilotWebRelay/docs/setup.md` — Development environment setup, dependencies, and how to run the application
   - `2.copilotWebRelay/docs/frontend.md` — Frontend component documentation (React components, state management, Markdown rendering)

5. **Create a pull request** with the documentation updates using `create-pull-request` safe output.
   - Title: `docs(copilot-web-relay): sync documentation with latest code changes`
   - Body should summarize what documentation was updated and why.

## Guidelines

- Write documentation in Japanese (日本語) to match the existing project documentation style.
- Be precise and factual — only document what the code actually does, not what it should do.
- Include code examples where helpful (e.g., WebSocket message examples, startup commands).
- If there are no discrepancies and documentation is up to date, use `noop` to signal no changes needed.
- Do NOT modify any source code — only update documentation files.
- Keep documentation concise and well-structured with clear headings.
