# small-factory

A software factory small enough to understand. All seven components of the
industry reference architecture, built minimally around a ~150-line link
shortener (`tinylinks`), in one repo. Every station is present; none of them
is impressive. That's the point.

## The anatomy

| # | Station | What the big factories have | What this repo has |
|---|---------|-----------------------------|--------------------|
| 1 | Intent intake | Typed task objects from Slack/Jira | An issue template with goal, constraints, and done-means ([`.github/ISSUE_TEMPLATE/factory-task.yml`](.github/ISSUE_TEMPLATE/factory-task.yml)) |
| 2 | Context resolution | Indexed retrieval over the codebase | A rule file the agents read first ([`CLAUDE.md`](CLAUDE.md)) |
| 3 | Planning | Reviewable multi-step missions | The agent posts a plan as a comment; a human `/approve` unblocks it ([`factory-plan.yml`](.github/workflows/factory-plan.yml)) |
| 4 | Execution | Agent fleets | One headless agent run in CI, tool-scoped ([`factory-execute.yml`](.github/workflows/factory-execute.yml)) |
| 5 | Review & policy | Conformance checks, red-team agents | CI + a protected-files policy gate ([`ci.yml`](.github/workflows/ci.yml)) + an independent reviewer agent ([`factory-review.yml`](.github/workflows/factory-review.yml)) |
| 6 | Delivery | Progressive, evidence-backed release | Human approval, merge on green, post-merge smoke check, auto revert PR on failure ([`factory-smoke.yml`](.github/workflows/factory-smoke.yml)) |
| 7 | Observability | Full trace and replay | Every agent run uploads its prompt and transcript as a build artifact |

The app itself is deliberately boring: a browser UI at `GET /`,
`POST /links` creates a short link, `GET /:slug` redirects and counts the
visit, `GET /links/:slug/stats` reports.
Small enough that the context file honestly covers it, real enough that a bad
change to redirects breaks every link ever created.

## Setup

1. Create a GitHub repo from this directory and push it.
2. Add two repository secrets (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY` — powers the planning, execution, and review agents.
   - `FACTORY_GITHUB_TOKEN` — a fine-grained PAT for this repo with
     Contents: read/write and Pull requests: read/write. Needed because pushes
     made with the default `GITHUB_TOKEN` don't trigger other workflows, which
     would silently skip the CI and review stations on factory-authored PRs.
3. Create the label: `gh label create factory --color 5319E7`.
4. Recommended branch protection on `main`: require the CI checks and at least
   one human review before merge. The factory proposes; humans dispose.
5. Verify locally: `npm install && npm test && npm run lint && npm run typecheck`.

## Run a task through the line

1. Open an issue with the **Factory task** template (it applies the `factory`
   label, which wakes the planning station).
2. The plan arrives as a comment. Read it. If it's wrong, edit the issue and
   re-add the label to re-plan.
3. Comment `/approve`. The execution station implements the plan, verifies
   tests/lint/types independently, and opens a PR.
4. CI runs, the policy gate checks that the factory didn't touch its own
   wiring, and the reviewer agent posts its findings on the PR.
5. A human merges. The smoke check runs against the new revision; if it
   fails, a revert PR appears.
6. Every station's prompt and transcript is an artifact on its workflow run.

A good first task: "Links older than 30 days return 410 Gone" (touches the
dangerous path, needs a test, fits one run).

## Swappability

The coding agent is a bought part. This repo uses Claude Code headless
(`claude -p`), but each workflow isolates the agent behind one CLI call with
an explicit prompt and an explicit tool allowlist; swapping in another
agent CLI means changing those lines, not the factory.

## What this is not

No station here is production-grade, and the two that fall shortest — review
and delivery — are exactly the ones worth studying. A second agent's opinion
is not a quality bar, and a smoke check is not progressive delivery. The
miniature's job is to make the anatomy legible, and to show where the real
engineering lives.
