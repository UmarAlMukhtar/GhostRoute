# Project submission

Submission preparation for the DevDay Exchange Community Hackathon: Kochi. This file records the project information; it is **not** proof that an organizer submission has been sent. Use the method announced by the organizers.

## Project

- **Project name:** GhostRoute
- **Short description:** GhostRoute shows how illustrative floods, landslides, fires, and roadblocks change shortest paths through a frozen OpenStreetMap-derived Kochi–Ernakulam road network. Choose endpoints or follow a guided demo; the app shows the original route, a recalculated route, or an explicit unavailable result. Browser-local incident reports are clearly unverified.
- **Code repository URL:** https://github.com/UmarAlMukhtar/GhostRoute
- **Final submitted implementation commit SHA:** **Pending final merge and submission.** Record the exact `main` commit used by the demonstrated deployment here before sending the organizer form. Current loader changes are in [PR #12](https://github.com/UmarAlMukhtar/GhostRoute/pull/12), not yet merged into `main`.
- **Working demo URL or local demo steps:** [Public GhostRoute demo](https://ghostroute-weld.vercel.app) · [Guided demo](https://ghostroute-weld.vercel.app/demo). For a local fallback, run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm start`; open `http://localhost:3000/demo`. The public site reflects its deployed `main` commit and may lag this branch until PR #12 is merged and deployment is checked.
- **Demo access requirements:** Public demo requires a WebGL-capable browser, no login. Local fallback requires Node 22.13+ (22 line) or Node 24, pnpm 11.25.0; no credentials required.

## Participants

Three participant names are recorded in the project narrative. Handles and individual contributions await the participants' confirmation; do not submit this table as complete until they are filled in.

| Participant name | GitHub handle         | Actual contribution   |
| ---------------- | --------------------- | --------------------- |
| Umar Al Mukhtar  | Awaiting confirmation | Awaiting confirmation |
| Sanjay KP        | Awaiting confirmation | Awaiting confirmation |
| Alphons N J      | Awaiting confirmation | Awaiting confirmation |

## Run and demonstrate

- **Prerequisites and versions:** See [README](README.md) and pinned `package.json`.
- **Install command:** `pnpm install --frozen-lockfile`
- **Required environment variable names:** None; `.env.example` contains no secrets.
- **Start command:** `pnpm dev` (development) or `pnpm build` then `pnpm start` (production).
- **Demo walkthrough:** Open `/demo` and advance through the Ernakulam overview, Hospital Road baseline, illustrative flood detour, expanding flood, unavailable route, and restored baseline. Then use Navigation to choose endpoints and Simulation to add or remove illustrative hazards. [Presenter script](docs/PITCH_SCRIPT.md)
- **Checks performed and results:** [VERIFICATION.md](docs/VERIFICATION.md) records actual unit, browser, build, data, and hosted checks with their dates and limits. PR #12's candidate passed 184 unit tests and 54 production browser cases in an isolated copy; its public production behavior must be checked after merge. Human rehearsal remains unconfirmed.
- **Known limitations or incomplete features:** This is a simulation, not an emergency navigation service. Hazards and browser-local reports are unverified; reports are not shared across users. Destinations are not verified shelters, and routes are not certified safe. The frozen OSM data can be incomplete or stale; 2D hazard intersections ignore depth and elevation. Map graphics require WebGL, and optional street tiles need network access. Physical-phone performance and human geographic review remain unverified.
- **Libraries, APIs, and public datasets used:** Next.js, React, TypeScript, Tailwind CSS, MapLibre GL JS, Turf, Lucide, Vitest, and Playwright; exact versions are pinned in [`package.json`](package.json) and the lockfile. A frozen OpenStreetMap-derived Kochi–Ernakulam road graph and local place index are bundled; source, licensing, and attribution are documented in [DATA_STRATEGY.md](docs/DATA_STRATEGY.md) and [ATTRIBUTION.md](public/data/ernakulam/ATTRIBUTION.md). Optional street tiles come from OpenStreetMap.
- **AI usage record:** [AI_USAGE.md](AI_USAGE.md)
- **Development change log:** [CHANGELOG.md](CHANGELOG.md)

## Submission checklist

- [ ] The project implementation started from scratch at the event.
- [ ] I participated solo or with no more than 4 team members in total.
- [ ] Codex was used during development and its usage is documented.
- [ ] The code repository URL, short description, and working demo are provided.
- [ ] README setup and demo instructions match the submitted code.
- [ ] Actual checks and known limitations are documented.
- [ ] Meaningful changes are documented and committed throughout development.
- [ ] The final implementation is committed and pushed, and its SHA is recorded above.
- [ ] No credentials or private data are included in the repository or demo instructions.
- [ ] The organizers' announced submission method and timing have been followed.

Event reference: [DevDay Exchange Community: Kochi on Luma](https://luma.com/z10nz8gp). The event wraps up by **10:00 AM IST on 11 October 2026**.
