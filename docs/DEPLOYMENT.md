# Vercel deployment runbook

Production: **https://ghostroute-weld.vercel.app**. Vercel project `ghostroute` in the existing Umar Al Mukhtar Hobby team is connected to `UmarAlMukhtar/GhostRoute`; `main` is the production branch. Initial deployed implementation: `cfed4ea9267a5b21e8b7b474af2ec1ab71c7bb77`, deployment `dpl_HyNZ3KE8yiYUbimfPjg5uPsdNBHE`. Build and public desktop/mobile journeys passed on 11 October 2026. See [VERIFICATION](VERIFICATION.md) for evidence and limits.

## Prepared configuration

- Framework: Next.js App Router, repository root (the folder containing `package.json`; **not** a nested `repository` directory in GitHub).
- Node: the existing project uses 24.x on Vercel; the code supports Node 22.13+ or 24. The local verification used Node 22.23.1.
- `vercel.json` pins both installation and build to pnpm 11.25.0 through `npx`. This avoids assuming that Vercel's default pnpm detection selects this version. npm here launches pnpm only; it does not install application dependencies or create a second lockfile.
- Install: `npx --yes pnpm@11.25.0 install --frozen-lockfile`.
- Build: `npx --yes pnpm@11.25.0 run build`.
- Output directory: leave the Next.js default. No static-export override, custom server, database or backend API.
- Environment variables: **none required**. Do not upload credentials or use public variables for secrets. `.vercel/` is ignored.

Next.js is supported directly by [Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs). Explicit commands are supported by its [package-manager configuration](https://vercel.com/docs/package-managers). These documents were checked while preparing this runbook; the pinned framework/toolchain also passed the real Vercel production build.

## Assets and browser behavior

The build script prepares `/vendor/maplibre/6.13.0/maplibre-gl-worker.mjs`, its sibling shared module and license before Next builds. Keep this script: the module worker must be served as JavaScript from the same origin. The map imports client-side and cleans up on unmount. No private API keys or CDN worker are used.

Graph, roads and demo fixtures are ordinary local `/data/ernakulam/` static assets; no runtime Overpass access. Deployment must be at the origin root (no configured basePath). The frozen graph/GeoJSON remain below the project size budget. Preserve JSON and `.mjs` MIME types; do not rewrite these paths to HTML. Browser tests check successful responses and actual worker-backed map rendering.

No custom CSP is imposed. If a hosting policy is added later, test module worker/script loading, local fetches, raster requests and WebGL; do not weaken an existing policy blindly. Browser geolocation and permissions are not required.

Optional raster tiles use `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, visible OSM attribution and normal browser caching/referrers. Do not bulk download, prefetch a tile archive, suppress the Referer header, or run automated public-tile scans. Automated tests abort tile requests and use bundled roads. Standard tiles have no availability guarantee; use an appropriate provider before scaling public traffic. See the [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/).

## GitHub production and preview workflow

1. Contributors keep using forks and pull requests targeting official `main`. Run the existing GitHub CI and review the contribution before merging; do not force-push or deploy forks as production.
2. The connected GitHub integration creates Preview deployments for eligible branches/PRs and adds PR comments and commit status. External-fork contributions can require the project owner's authorization; Hobby account collaboration and Vercel's existing preview access controls still apply. Do not share credentials or disable protection to work around them.
3. Every merge into official `main` automatically builds a Production deployment and assigns the production domain after a successful build. Failed builds remain failed deployments and do not replace the last Ready production deployment. No extra Deployment Checks gate is configured; GitHub review/CI before merging remains the team's responsibility.
4. Inspect the Vercel deployment Source SHA, logs and Ready status, then test the public production domain. A successful local build alone does not prove hosted behavior. No environment variables or paid resources are needed.
5. To reproduce setup in another authorized Vercel account, import the official GitHub repository, name the project `ghostroute`, keep root `./`, Next.js preset, Node 24.x and default output; use the tracked pnpm commands above. Importing starts a deployment. Existing authenticated CLI users may link the exact project and deploy a preview; production changes use the reviewed Git workflow.

## Troubleshooting and reliability

- **Install/build fails:** inspect logs and pinned Node/pnpm versions; use the frozen lockfile. Never promote a failed build. Local Turbopack can fail with a sandbox port-binding error; clearing only generated `.next` and rerunning with required local access resolved the verification run.
- **Map fails:** verify worker/shared `.mjs` files return JavaScript, all four `/data/ernakulam/` assets return JSON, and WebGL is available. Do not rewrite asset URLs to HTML. The build prepares worker assets automatically.
- **Slow initial map:** the hosted four datasets transferred about 9 MB with Brotli; raw JSON remains about 68 MB. The graph loads and validates before routing. Laptop mobile viewport checks do not establish physical low-memory phone performance.
- **Tiles fail:** bundled local roads and routes remain available with attribution. Public OSM tiles have no uptime guarantee; automated hosted journeys deliberately block them rather than scan the public tile service.
- **Refresh/404:** `/` and `/demo` are Next.js prerendered routes and return HTTP 200 directly. Keep the origin root configuration.
- **Caching:** deployed datasets and versioned worker return Vercel CDN HIT and ETags with `public, max-age=0, must-revalidate`. Browser revalidation is expected; no immutable caching is imposed on mutable dataset filenames.
- **Reports differ across devices/previews:** reporting is browser-local, scoped to the origin. No shared backend or verification service is configured.
- **Preview cannot be opened:** retain existing deployment protection. The owner can use Vercel's supported access/sharing controls or authorize a fork deployment. Public production access does not require login.

No organizer Google Form has been submitted. Participant details, final submitted SHA and human rehearsals remain team-owned.

## Local production fallback

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`, choose **Demo Mode**, and follow the presenter cues. Preinstall dependencies and keep the production build on the demo laptop. Local road fallback works without remote tiles, but this is not an installable offline PWA. If WebGL fails, show textual results/tests and clearly identify any previously captured recording; do not imply the live map is working.

Stop publication on a build failure, missing worker/data asset, wrong route outcome, leaked secret, absent safety/attribution copy, or unresolved project/account choice. Keep the local demo available while resolving hosting issues.

## Local reporting boundary

This version uses browser-local storage only. A new preview/production origin starts a separate archive; clearing browser storage deletes it. No Supabase environment variables activate shared reporting yet. Before a shared pilot, implement and verify the server/RLS/verification steps in [PLATFORM](PLATFORM.md). Do not present a deployed local adapter as a shared community service.
