# Contributing to GhostRoute

Thank you for helping build a clear, reproducible simulation. Read [RULES](RULES.md), [AGENTS](AGENTS.md), [PRD](docs/PRD.md), [architecture](docs/ARCHITECTURE.md) and the relevant [ADR](docs/adr/README.md) before a significant change. The integration branch contains the implemented simulation; distinguish local evidence from human review and hosted verification.

## Local setup

Clone the implemented integration branch:

```bash
git clone --branch codex-foundation https://github.com/UmarAlMukhtar/GhostRoute.git
cd GhostRoute
```

Use Node 22.13+ (22 line) or Node 24 and pnpm 11.25.0. Run `pnpm install --frozen-lockfile`, `pnpm exec playwright install chromium`, then `pnpm dev`. No secrets are needed. See [README](README.md) for every command and [TESTING](docs/TESTING.md) for browser prerequisites.

## Select and coordinate work

Choose one ready task in [TASKS](docs/TASKS.md). Confirm dependencies are complete and ask the maintainer to assign it before overlapping another contributor's work. Use open GitHub issues alongside task IDs and record ownership with the maintainer; the task catalog is not an assignment claim. Beginner tasks are labeled in that document. Do not create remote issues or change repository settings on behalf of someone else without permission.

Use `codex-<task-id>-<short-description>` for agent branches and `feature/<task>` for human branches. Start from `codex-foundation`, the current integration branch. Keep `main` stable: merge through a PR only after at least one human reviewer approves and CI passes. This is the team workflow; branch protection has not been configured. Until the foundation PR is merged, target contributor PRs at `codex-foundation` to keep each diff focused. After integration, update branches from `main` and target `main`. Check `git status` first, preserve uncommitted work and never rewrite shared history or force-push.

## Code and commits

Prefer small functions and pure routing/simulation modules. Strict TypeScript; do not use `any`, suppressions or unchecked JSON casts to bypass input validation. Use named units (`lengthMeters`), longitude/latitude positions and stable string IDs. Add dependencies only where needed and commit `pnpm-lock.yaml` with package changes. Use existing components and patterns. Do not refactor unrelated code.

Commit messages use `feat:`, `fix:`, `docs:`, `test:` or `chore:` with a concrete action; use `wip:` only for honest handoffs. Update `CHANGELOG.md` with a real timezone timestamp and `AI_USAGE.md` for meaningful AI work, including human review status. Keep the template's milestone commit cadence (roughly 30 minutes when work is ready); do not fabricate checkpoints. Push only when the user/team has authorized it.

## Tests and PRs

Before a PR run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm format:check` and `git diff --check` as applicable. Documentation-only changes need local link/consistency and formatting checks. Report failures or skipped checks honestly. New nontrivial logic needs a focused regression test; routing changes must exercise blocked-edge alternatives and unreachable outcomes. UI changes need keyboard/mobile review and screenshots, without private data. Browser tests must use local geographic fixtures, not public tile services.

Use the preserved [PR template](.github/pull_request_template.md). Explain user-visible behavior, task ID/related issue, checks, screenshots where relevant, risks and data provenance. Keep one coherent task per PR, request review, and resolve feedback. A maintainer owns merging and deployment. Do not claim human review, hosted CI or emergency safety from local test results.

## Community and safety

Follow [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY](SECURITY.md). Never add private participant data, precise personal location history, credentials or fabricated real-world incident/shelter claims. Synthetic data must be labeled in files and UI. OSM attribution and organizer requirements are part of correctness. New contributions follow the scoped [LICENSE](LICENSE); do not import third-party material without compatible permission and attribution.
