# Template audit

Audited 10 October 2026, IST, before project edits. Baseline: `6a6217d` (`Initial commit`), branch `main`, tracking `origin/main`. Remote: `git@github.com:UmarAlMukhtar/GhostRoute.git`. The official clone was clean.

## Repository discovery

The supplied working directory contained an empty `.git` directory, no commits, no remote and no working files. It was not the official checkout. The official repository was cloned by SSH into `repository/` beneath it; that clone is the project root for all commands and changes. The outer shell was left untouched. No replacement repository was initialized. Work proceeds on `codex-foundation`; no push is authorized.

## Complete inherited inventory

All eight tracked files appeared together in the initial commit. Their content and the README identify them as the event documentation template; no separate upstream template history or machine evaluation configuration was present.

| File                               | Purpose                                                             | Preservation decision                                                                                |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `README.md`                        | Event details, rules links, template usage and project placeholders | Retain event and usage sections; fill project section and append project documentation               |
| `RULES.md`                         | Participation and event rules                                       | Preserve byte-for-byte                                                                               |
| `AGENTS.md`                        | Coding, verification, documentation, commit and submission guidance | Preserve inherited instructions; append GhostRoute rules and explicit no-push override for this task |
| `AI_USAGE.md`                      | Participant AI log and separate template preparation record         | Fill participant log; retain template preparation record                                             |
| `CHANGELOG.md`                     | Timestamped participant changes and template setup record           | Add real milestone entries; retain template setup record                                             |
| `SUBMISSION.md`                    | Required submission fields and checklist                            | Fill known project/setup facts, retain checklist and unknown participant/final-demo fields           |
| `.gitignore`                       | Secret, build and cache exclusions                                  | Keep all original rules; append tooling outputs                                                      |
| `.github/pull_request_template.md` | Validation and documentation checklist                              | Retain original sections; append issues, screenshots and project review checks                       |

There were no package manifests, lockfiles, application files, license, workflows, tests, tool configuration, submodules, contributor guide or nested agent instructions. `git ls-tree -r HEAD`, the full tracked file listing, all eight file contents, status, branches, remotes and commit log were inspected. No scaffold exists to extend.

## Explicit organizer requirements versus conventions

`RULES.md` documents: solo or teams of up to four; open theme; start implementation from scratch at the event; libraries/APIs/public datasets allowed; use Codex and document usage; submit repository, short description and working demo; comply with registration, entry and respectful conduct requirements. Kick-off is 10 October 2026 at 18:30 IST; wrap-up by 11 October at 10:00 IST. Venue submission instructions may add details not recorded here.

`AGENTS.md` additionally requests simple code, truthful validation, secret protection, change/AI logs and meaningful milestone commits, approximately every 30 minutes. The template explicitly says this cadence is workflow guidance, not eligibility criteria. Preserve history; do not invent backdated checkpoints. Its normal push guidance is superseded in this session by the user's explicit prohibition on pushing without approval.

No mandatory stack, hosted service, API usage, judging rubric, hidden evaluation mechanism or CI workflow is documented. The user's eight-hour implementation budget is a project plan, not the event's full duration. Attendance and eligibility are not independently verified by this audit.

## Safe foundation and trade-offs

Use a new minimal Next.js App Router scaffold at the official clone root, with strict TypeScript, Tailwind, pnpm, ESLint, Prettier, Vitest and Playwright. No generator may overwrite template documents. Add one CI workflow because none exists. Defer MapLibre, Turf and shadcn components until feature tasks require them; document their planned roles. No backend, auth or database is needed.

Scope reaches root documentation/configuration, `docs/`, `.github/`, a static `src/app/` tooling smoke page and `tests/`. There are no existing callers, exports, fixtures or users whose application behavior could regress. Main risks are losing event instructions, misrepresenting a scaffold as a finished demo, or accidentally relicensing inherited text.

## Licensing decision (recorded before adding LICENSE)

Recommend and adopt MIT for newly authored GhostRoute code and documentation to support open contributions. No existing license was found. This does **not** establish a license for the organizer's inherited text: preserve its provenance and ask the organizers to clarify redistribution terms before advertising the whole repository as uniformly MIT. `LICENSE` will explicitly scope the new grant. OSM-derived data remains under its own ODbL obligations; Contributor Covenant text has its own attribution/license. Do not relicense these under MIT.

## Validation and remaining work

See `docs/VERIFICATION.md` for executed checks and the post-change preservation review. Organizer rules were read from this checkout; no undocumented organizer requirement was inferred. Unknown participant identities, final submitted SHA, working product demo, template text licensing and venue-specific submission procedure remain human-owned inputs.

## Framework-generated instruction protection

The dev-server smoke check revealed that Next.js 16.4 appends its own rules block to `AGENTS.md` by default. The generated block was removed (it was not inherited), and the documented `agentRules: false` option was set in `next.config.ts` to keep organizer/project instructions under deliberate review. Repeated dev startup was checked for absence of generated instructions and preservation of inherited content; `AGENTS.md` stayed byte-identical across the HTTP smoke request.
