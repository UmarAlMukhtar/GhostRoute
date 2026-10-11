# GhostRoute

GhostRoute is an interactive Kochi–Ernakulam road-routing **simulation**. Choose a starting point and destination, then see how a shortest path changes when illustrative floods, landslides, fires, or roadblocks close mapped roads. The map uses a frozen OpenStreetMap-derived road network; hazards and incident reports are not live emergency data.

[Open the public demo](https://ghostroute-weld.vercel.app/) · [View the guided demo](https://ghostroute-weld.vercel.app/demo) · [Original README backup](README.backup.md)

> **Simulation only.** Routes are not verified safe. Follow local authorities during a real emergency. Demo destinations are not verified shelters.

## What you can do

- **Navigate:** Search the offline place index, enter coordinates, pick a point on the map, or use your location if you grant browser permission. Compare the route and distance through the mapped road network.
- **Simulate:** Add and edit illustrative flood, landslide, fire, and roadblock hazards. GhostRoute excludes affected road segments and recalculates a route, or clearly reports when none is available in this dataset.
- **Report:** Save and delete unverified observations in this browser. Reports are not shared with other users or emergency services and do not alter routes by default.
- **Demo:** Walk through the Hospital Road baseline, flood detour, expanding flood, unavailable route, and reset at `/demo`.

The frozen graph contains 49,740 nodes, 115,412 directed edges, and 57,706 physical road segments. The offline search index contains 12,409 OSM-derived names. Coverage follows the dataset boundary, which does not guarantee that every road inside it is mapped or connected. [Data source and access assumptions](docs/DATA_STRATEGY.md) · [Place sources](data/places/README.md)

## Run locally

Use Node.js 22.13+ on the Node 22 line or Node 24, and pnpm 11.25.0. No API key or environment variables are required.

```bash
git clone https://github.com/UmarAlMukhtar/GhostRoute.git
cd GhostRoute
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). For a production build, run `pnpm build` followed by `pnpm start`. Browser tests also need `pnpm exec playwright install chromium`. The public site runs from the repository's `main` branch; local commits on other branches do not appear there until reviewed and deployed. [Deployment details](docs/DEPLOYMENT.md)

### Try a route

1. Open **Navigation**. Choose a starting point and destination from the search fields, enter coordinates, or select points on the map.
2. Open **Simulation** and add a hazard. Compare the original and updated routes, or read the unavailable-route result.
3. Use **Reset route** or switch to **Demo** for the guided sequence.

Local road geometry and routing work if optional OpenStreetMap street tiles are unavailable, provided the app and its bundled data have loaded. This is not a complete offline web app.

## Loading and troubleshooting

The app validates the local road dataset in a worker, initializes routing, then hands the complete road network to MapLibre in batches. Place search loads independently. During loading, the ring rotates normally; when your browser requests reduced motion, it gently pulses without rotating. A still-looking ring does not by itself mean loading has failed.

- **Map eventually appears:** Initial preparation can take several seconds, especially on slower devices. The loading text changes from data validation to map drawing. [Measured desktop-browser emulation](docs/performance/LOADING.md) · [Renderer measurements](docs/performance/RENDERING.md)
- **Map never appears:** Reload once. Check that the app's `/data/ernakulam/` assets and local MapLibre worker are served correctly and that WebGL is available. The page shows a failure message when preparation fails.
- **Street tiles fail:** The local roads and route controls remain usable; the status changes to a basemap fallback message.
- **Search stays unavailable:** You can still use coordinates or map selection while the local place index loads or if it fails.

## Development checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm data:prepare` regenerates runtime assets from the frozen source; `pnpm data:acquire` intentionally refreshes source data and needs review. Do not treat an illustrative route as emergency advice. [Architecture](docs/ARCHITECTURE.md) · [Verification and limits](docs/VERIFICATION.md) · [Contribution guide](CONTRIBUTING.md)

## Project and event records

GhostRoute was built for the DevDay Exchange Community Hackathon in Kochi, 10–11 October 2026. The original template guidance is preserved in [README.backup.md](README.backup.md); [event rules](RULES.md), [AI usage](AI_USAGE.md), [change log](CHANGELOG.md), and [submission record](SUBMISSION.md) remain available. The project code is [MIT licensed](LICENSE); OSM-derived data has [separate ODbL attribution](public/data/ernakulam/ATTRIBUTION.md).
