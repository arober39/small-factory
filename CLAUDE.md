# tinylinks — factory context file

This file is the context station of the factory: it grounds every agent run in
this repo's reality. Humans keep it current; an out-of-date context file is how
a factory automates chaos.

## What this project is

A link shortener, kept deliberately small so the factory around it stays legible:

- `GET /` — browser UI for creating links
- `POST /links` — create a short link from `{ url, slug? }`, returns 201
- `GET /:slug` — 302 redirect, counts the visit
- `GET /links/:slug/stats` — stats for a link
- `GET /healthz` — used by the post-merge smoke check

## Where things live

- `src/app.ts` — routes and validation; exports `createApp()` so tests can mount it
- `src/ui.ts` — the browser UI as one inline HTML document, served at `GET /`
- `src/store.ts` — in-memory store; all data access goes through it
- `src/server.ts` — entrypoint only, no logic
- `test/app.test.ts` — endpoint tests (vitest + supertest)
- `scripts/smoke.sh` — post-merge smoke check

## Commands

- `npm test` — vitest, must pass before any commit
- `npm run lint` — eslint
- `npm run typecheck` — tsc in strict mode
- `npm run dev` — local server on :3000

## Conventions

- TypeScript strict mode; no `any` unless unavoidable, and commented when it is.
- The store stays in-memory. No databases, no file persistence, by design.
- Every behavior change ships with a test in `test/app.test.ts`.
- Validation errors return JSON `{ error: string }` with a 4xx status.
- Route handlers stay in `src/app.ts`; data rules stay in `src/store.ts`.
- The browser UI stays a single inline document in `src/ui.ts`: no frontend
  toolchain, no asset pipeline, no client-side state beyond the form.

## What agents must never touch

- `.github/` — the factory does not rewire itself
- `CLAUDE.md` — humans maintain the context station
- The dependency lists in `package.json` — adding a dependency is a human decision

CI enforces the first two on `factory/*` branches; the review station checks the rest.
