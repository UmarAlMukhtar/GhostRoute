# Join GhostRoute

## First 15 minutes

1. Read the status and setup in [README](../README.md). This is currently a foundation, not a working navigation demo.
2. Read [RULES](../RULES.md), [CONTRIBUTING](../CONTRIBUTING.md) and [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md). Keep event requirements and the four-person team limit distinct from open-source participation after the event.
3. Install the pinned toolchain/dependencies, run `pnpm dev` and confirm the smoke page. Run `pnpm test`; then install Chromium and run `pnpm test:e2e` when browser work is relevant.
4. Read the [PRD](PRD.md), [architecture](ARCHITECTURE.md) and the ADR for your module. Ask about missing requirements, not permission already granted by an assigned task.
5. Select a ready [task](TASKS.md), confirm ownership with the maintainer and create a branch. Do not self-assign an overlapping shared-file change without coordination.

## First contribution

Good starting tasks include UI-02 (legend), MAP-03 (provenance), A11Y-01 (keyboard review), DOC-01 (onboarding), DOC-02 (presenter notes) and, after animation exists, UI-03 (reduced motion). Observe each task's dependencies. Domain-critical routing/flood validation is not a beginner-only task.

Use exact paths and acceptance criteria from the task. For behavior, add one focused failing test before implementing it. Keep a small diff and let one integrator own contract/package/lockfile edits. Discuss incompatible contract changes before coding. Run relevant checks, review the diff and record actual work/checks in CHANGELOG and AI_USAGE. Follow the PR template; human review remains pending until a person reviews it.

## Working together

No remote issues or labels were created by this foundation. Task IDs are stable coordination references; maintainer assignment can later map them to GitHub issues. Avoid broad formatting/refactoring in feature PRs. Rebase/merge only in ways that preserve shared history; never force-push or discard teammate work. Local milestone commits are expected; obtain explicit push/deploy authorization for this session.

If blocked, record the exact input/error, smallest reproduction, relevant task and what is still working. For data problems retain the failing input as a sanitized fixture when licensing permits. Do not invent missing roads, shelter status or successful results to continue the demo.

## Completion and help

A task is done when its acceptance checks pass and docs describe actual behavior. The larger MVP still needs every P0 task and two rehearsals. Report security issues through [SECURITY](../SECURITY.md); contact the repository owner through their published GitHub contact or at the event for task/review coordination. No unverified response-time or private-channel guarantee is made.
