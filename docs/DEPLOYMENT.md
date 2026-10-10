# Vercel deployment runbook

Status: local production build and browser verification are recorded in VERIFICATION. No deployment has been created and no public URL is claimed. The Vercel CLI was not installed and this checkout had no `.vercel/project.json`; account authentication and project access remain unverified. No login, linking, project creation or remote setting mutation was attempted.

## Prepared configuration

- Framework: Next.js App Router, repository root (the folder containing `package.json`; **not** a nested `repository` directory in GitHub).
- Node: select 22.x on Vercel; the code supports Node 22.13+ or 24. The local verification used Node 22.23.1.
- `vercel.json` pins both installation and build to pnpm 11.25.0 through `npx`. This avoids assuming that Vercel's default pnpm detection selects this version. npm here launches pnpm only; it does not install application dependencies or create a second lockfile.
- Install: `npx --yes pnpm@11.25.0 install --frozen-lockfile`.
- Build: `npx --yes pnpm@11.25.0 run build`.
- Output directory: leave the Next.js default. No static-export override, custom server, database or backend API.
- Environment variables: **none required**. Do not upload credentials or use public variables for secrets. `.vercel/` is ignored.

Next.js is supported directly by [Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs). Explicit commands are supported by its [package-manager configuration](https://vercel.com/docs/package-managers). These documents were checked while preparing this runbook; hosted availability of the pinned framework/toolchain still requires a real build after authorization.

## Assets and browser behavior

The build script prepares `/vendor/maplibre/6.13.0/maplibre-gl-worker.mjs`, its sibling shared module and license before Next builds. Keep this script: the module worker must be served as JavaScript from the same origin. The map imports client-side and cleans up on unmount. No private API keys or CDN worker are used.

Graph, roads and demo fixtures are ordinary local `/data/ernakulam/` static assets; no runtime Overpass access. Deployment must be at the origin root (no configured basePath). The frozen graph/GeoJSON remain below the project size budget. Preserve JSON and `.mjs` MIME types; do not rewrite these paths to HTML. Browser tests check successful responses and actual worker-backed map rendering.

No custom CSP is imposed. If a hosting policy is added later, test module worker/script loading, local fetches, raster requests and WebGL; do not weaken an existing policy blindly. Browser geolocation and permissions are not required.

Optional raster tiles use `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, visible OSM attribution and normal browser caching/referrers. Do not bulk download, prefetch a tile archive, suppress the Referer header, or run automated public-tile scans. Automated tests abort tile requests and use bundled roads. Standard tiles have no availability guarantee; use an appropriate provider before scaling public traffic. See the [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/).

## Publish only after explicit approval

1. Review the final local commit, participant details, license scope and screenshots. Authorize the exact branch push separately; example: `git push origin codex-foundation` (never force).
2. Confirm the Vercel account/team and whether to use an existing project or create GhostRoute. Importing GitHub can immediately deploy and enable automatic deployments, so it is itself a remote publishing action requiring approval.
3. Either import the official GitHub repository with the root/settings above, or install the Vercel CLI, authenticate, and run `vercel deploy` from this directory for a preview. Do not run `--prod` until that action is approved. Do not run `vercel link --yes` against an unspecified account/project.
4. Inspect the actual hosted build logs and returned preview URL. Test the entire Demo Mode, manual endpoints, reset, static assets, mobile layout and tile failure on that URL. Verify judge access without an account; do not disable project protection without approval.
5. After a successful preview and explicit production approval, promote that tested deployment or run `vercel deploy --prod`. Record the real URL and exact implementation commit in SUBMISSION. Never invent the URL or claim local verification proves hosted behavior.

## Local production fallback

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`, choose **Demo Mode**, and follow the presenter cues. Preinstall dependencies and keep the production build on the demo laptop. Local road fallback works without remote tiles, but this is not an installable offline PWA. If WebGL fails, show textual results/tests and clearly identify any previously captured recording; do not imply the live map is working.

Stop publication on a build failure, missing worker/data asset, wrong route outcome, leaked secret, absent safety/attribution copy, or unresolved project/account choice. Keep the local demo available while resolving hosting issues.
