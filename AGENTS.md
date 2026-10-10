# Agent guide for hackathon projects

## Event requirements

- Read [RULES.md](RULES.md) before working. Build project implementation from scratch at the event; do not import a pre-built project.
- Libraries, APIs, and public datasets are allowed. Document their sources and use.
- Use Codex during development and briefly record its actual contribution in [AI_USAGE.md](AI_USAGE.md).
- Prepare a code repository, short project description, and working demo in [SUBMISSION.md](SUBMISSION.md).

## Use basic coding patterns

- Prefer straightforward, idiomatic code: small functions, clear names, simple data structures, and modules with one clear responsibility.
- Use the project's existing patterns. Add an abstraction only when an actual repeated need makes the code easier to understand.
- Choose the simplest implementation that meets the current requirement. Avoid unnecessary layers, generic frameworks, premature optimization, and speculative features.
- Keep dependencies few and purposeful. Reuse appropriate standard libraries and established libraries instead of reimplementing them.
- Validate inputs, handle errors explicitly, and show useful failure messages. Do not hide failures behind fabricated success or demo data.
- Keep changes focused. Explain the reason for non-obvious decisions in short comments or project documentation.

## Document every meaningful change

- Update [CHANGELOG.md](CHANGELOG.md) in the same commit as each meaningful change. Record the date and time with timezone, what changed, why, the affected files or feature, validation performed, and known limitations.
- Update [README.md](README.md) whenever setup, commands, environment requirements, project behavior, or demo instructions change.
- Update [AI_USAGE.md](AI_USAGE.md) whenever Codex makes a meaningful contribution. Record the task, assistance, human review status, checks, and any corrections. Brief summaries are enough; full chat transcripts are unnecessary.
- Keep claims accurate. Distinguish implemented and verified behavior from planned or incomplete work. Never invent test results, deployment success, AI usage, or commit timestamps.

## Make regular, timely commits

1. Inspect `git status` before editing. Preserve teammates' work and identify files belonging to the current task.
2. Finish a small, coherent change, run appropriate checks, and update its documentation.
3. Review the diff and explicitly stage only the files for that change.
4. **Commit after each completed milestone. While actively building, aim for a commit about every 30 minutes when meaningful changes are ready.** Do not leave the entire night's work for one final commit.
5. Commit completed work before a handoff, a long break, or the end of a work session. If work is incomplete, document its state and use an honest `wip:` message for a useful checkpoint.
6. Use short, descriptive messages, such as `feat: add project search`, `fix: handle empty results`, or `docs: explain local demo setup`.
7. Do not create empty commits to satisfy the clock. Do not backdate commits, squash away the event development record, force-push, or rewrite shared history.
8. Push committed checkpoints to the team's repository regularly, when network access is available and the team has authorized that remote. Resolve conflicts with care.

The 30-minute target is this repository's working convention. It does not replace event rules or organizer instructions.

## Check work and protect credentials

- Use the project's actual install, run, lint, test, and build commands. Add them to the README as soon as they exist; this template does not prescribe a stack.
- Run checks appropriate to the change. For a documentation-only change, check links and consistency. For code changes, verify the changed behavior and any relevant existing tests.
- Report what ran and what passed, failed, or could not be checked. If a command fails, investigate or document the limitation before handoff.
- Keep credentials, API keys, approved QR codes, and private participant data out of commits and logs. Use environment variables and sanitized examples; never put live keys in `.env.example`.

## Before submission

- Complete [SUBMISSION.md](SUBMISSION.md), replacing all participant placeholders.
- Confirm the README gives reproducible setup and demo steps.
- Check that the working demo matches the submitted code and that known limitations are disclosed.
- Update the changelog and AI usage record, commit the final coherent change, and push it.
- Record the final submitted commit SHA in the submission details. Documentation may record that SHA in a subsequent commit; do not claim later implementation changes belong to the earlier demo.
- Follow the organizers' actual submission method and timing. The event wraps up by 10:00 AM IST on 11 October 2026.

## GhostRoute project instructions

### Project and template preservation

GhostRoute models a small Ernakulam road graph and deterministic simulated flood closures. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/TEMPLATE_AUDIT.md` and relevant `docs/adr/` decisions before significant work. Only the tooling smoke scaffold exists in Phase 0. Preserve all organizer-provided requirements, `RULES.md`, submission structure, event links, template preparation records and any future organizer workflows. Inspect purpose/history before altering template files. Never initialize a replacement repository.

**Current explicit user instruction overrides the inherited push guidance:** do not push without explicit approval; do not force-push, rewrite commits, discard uncommitted work, create remote issues or modify repository settings. Local milestone commits are expected. Do not mark submission checkboxes on behalf of participants or invent participant identities.

### Architecture and directories

- `src/app/`: page composition, layout, styles; keep MapLibre client-only when introduced.
- `src/components/`: map/panels and only needed shared UI components.
- `src/lib/geo/`: shared contracts and validated data boundaries.
- `src/lib/routing/`: pure shortest-path code, independent of React and rendering.
- `src/lib/simulation/`: pure flood/blockage logic and selection reducer.
- `data/source/`: frozen source, query, manifest and license; `public/data/ernakulam/`: runtime assets. These are planned until MAP-01.
- `tests/unit/` and `tests/e2e/`: deterministic behavior tests and browser journey.
- `docs/`: requirements, design, evidence, plans and ADRs; `.github/`: additive contributor/CI configuration.

### TypeScript and dependencies

Use strict types, stable string IDs, explicit meters and `[longitude, latitude]`. Parse untrusted input as `unknown`, validate before use and return explicit unreachable/invalid results. Keep immutable graph geometry separate from blocked edge sets. Do not use `any` or type assertions to pretend data is valid. Use Node 22.13+ (22 line) or Node 24, pnpm 11.25.0 and the committed lockfile; no second package manager/config system. Add libraries only to the task that needs them. No backend, auth, database, live feed or paid API in P0.

### Tests, docs and accuracy

Run relevant tests plus lint/types/build for code changes; run browser tests for user flows. New nontrivial logic requires one small meaningful test. The critical routing test must prove a blocked edge produces a valid alternative, and a disconnected case returns unreachable. Tests and CI must not depend on live map tiles or Overpass. Update setup docs, task status, changelog and actual AI usage with each milestone. Use `docs/VERIFICATION.md` for evidence and limitations, not invented results.

Always label floods simulated and destinations synthetic/unverified. Never claim routes are guaranteed safe, shelters are open, or OSM is current ground truth. Preserve OSM attribution and source metadata. Do not erase validation/error handling to simplify code. Avoid personal geolocation collection and secrets.

### Task selection, conflicts and PRs

Choose the highest-priority ready task in `docs/TASKS.md`, confirm ownership and inspect every caller before changing a shared contract. Keep routing, map and simulation tasks in separate owned modules. Coordinate edits to `package.json`, lockfile, shared types and logs; one integrator resolves these. Do not add parallel implementations or speculative abstractions. Keep PRs small and follow the template with actual checks, data provenance and screenshots for UI changes. Read `CONTRIBUTING.md` and `docs/CONTRIBUTOR_GUIDE.md` for onboarding.

### Definition of Done

The task's acceptance criteria pass; changed contracts/callers agree; tests and documentation match actual behavior; no safety/attribution regression; inherited requirements and history remain intact; real checks and limits are recorded; human review is pending until actually performed. Commit the coherent milestone locally. A product feature is not complete merely because the foundation builds; deployment/submission require their own verification and authorization.
