# Project submission

Complete this file during the hackathon and use it to prepare your submission through the method announced by the organizers. Do not submit your project to the template repository.

## Project

- **Project name:** GhostRoute
- **Short description:** An interactive Ernakulam road-network simulation: illustrative floods block real OSM road segments and Dijkstra automatically finds an alternative route or reports unavailable. Includes a guided three-minute Demo Mode.
- **Code repository URL:** https://github.com/UmarAlMukhtar/GhostRoute
- **Final submitted implementation commit SHA:** TODO
- **Working demo URL or local demo steps:** No public deployment yet. Run `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm start`; open `http://localhost:3000` and choose **Demo Mode**. See [demo plan](docs/DEMO_PLAN.md) and [deployment runbook](docs/DEPLOYMENT.md).
- **Demo access requirements:** Local Node 22.13+ (22 line) or Node 24, pnpm 11.25.0; no credentials required.

## Participants

Participate solo or in a team of up to 4. Remove unused rows.

| Participant name | GitHub handle | Contribution |
| ---------------- | ------------- | ------------ |
| Umar Al Mukhtar  | TODO          | TODO         |
| Sanjay KP        | TODO          | TODO         |
| Alphons N J      | TODO          | TODO         |

## Run and demonstrate

- **Prerequisites and versions:** See [README](README.md) and pinned `package.json`.
- **Install command:** `pnpm install --frozen-lockfile`
- **Required environment variable names:** None; `.env.example` contains no secrets.
- **Start command:** `pnpm dev` (development) or `pnpm build` then `pnpm start` (production).
- **Demo walkthrough:** Advance Demo Mode through the real baseline, Hospital flood detour, expanding flood, unavailable destination and reset. Manual controls remain available. See [pitch](docs/PITCH_SCRIPT.md).
- **Checks performed and results:** See [verification record](docs/VERIFICATION.md); local automated checks and rendered browser evidence are recorded separately from hosted verification and human rehearsal.
- **Known limitations or incomplete features:** Simulation only; no verified live hazards or safe-route certification. Small frozen dataset, conservative 2D intersections, unverified destination access and WebGL dependency. Participant handles/contributions, final submitted SHA, publishing and venue submission confirmations require team review.
- **Libraries, APIs, and public datasets used:** [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind](https://tailwindcss.com/), [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/); exact versions in package/lockfile. MapLibre GL JS, Turf and a frozen OpenStreetMap-derived Ernakulam graph are bundled. OSM attribution/licensing is in [DATA_STRATEGY](docs/DATA_STRATEGY.md).
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
