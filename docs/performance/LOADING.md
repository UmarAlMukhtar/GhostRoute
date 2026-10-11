# Initial map loading measurements

Measured 11 October 2026 IST using `scripts/benchmark-loading.mjs`, installed Playwright Chromium, production Next.js servers, fresh browser contexts, a 360×800 mobile viewport, touch/mobile emulation, and CDP 4× CPU throttling. Optional OSM tiles were aborted. No bandwidth throttling was applied. Three runs per build ran sequentially without other builds/tests competing for CPU. Baseline was an isolated archive of `main` at `840ae8a431287ce62f95d4717a99549c340180cb`; the optimized build used the same dependencies and host. These are emulated Chromium measurements, not physical-phone measurements or a production speed guarantee.

| Metric (median of three runs)                             |           Before |            After |
| --------------------------------------------------------- | ---------------: | ---------------: |
| Actual local-road map readiness                           |        14,492 ms |       9,220.6 ms |
| Longest UI-thread task                                    |         6,361 ms |         1,316 ms |
| Longest animation-frame gap                               |       6,383.1 ms |       1,483.2 ms |
| Distinct painted loader transforms                        |               13 |              178 |
| Compressed data response bodies, including search catalog |  9,741,120 bytes |  4,586,034 bytes |
| Decoded data assets, including search catalog             | 68,134,956 bytes | 20,820,864 bytes |
| Reported JS heap after map readiness + 1 second           |           386 MB |           269 MB |

Raw records include every observed long task and browser request sizes/timings: [before](loading-before.jsonl), [after](loading-after.jsonl). The heap API is Chrome's coarse `performance.memory.usedJSHeapSize` reading, not peak memory or whole-browser/physical-device RAM. Worker resource requests are collected through browser-context response events because the main document's resource timeline does not include worker fetches.

The original 6-second stall combined JSON decoding, geographic validation and complete graph snapshot/index construction. The compact segment asset eliminates repeated downloaded geometry; a bundled worker decodes/reconstructs and runs the unchanged full graph and renderer validators. Validated records arrive in bounded messages. Routing, connectivity, hazard indexing and catalog validation yield between batches; completed route and hazard calculations retain the existing synchronous contracts. Full-network equality tests prove that all 49,740 nodes, 115,412 directed edges, 57,706 segments, coordinates, weights, tags and adjacency survive reconstruction. A reverse-only fixture also preserves canonical map geometry.

The remaining approximately 1.3-second largest task occurs during MapLibre initialization/road-source handoff in these throttled runs. This work does not disappear; faster loading and a responsive data loader are measured improvements, not a claim that every rendering task is under 50 ms. Further renderer changes would need separate evidence and scope.

Reproduce against a production server with:

```sh
pnpm build
pnpm start --hostname 127.0.0.1 --port 3100
# In another terminal:
node scripts/benchmark-loading.mjs http://127.0.0.1:3100
```

The browser animation regression samples actual computed transforms and animation frames while real dataset initialization runs, including 4× CPU emulation; a separate reduced-motion test checks static loading feedback. No fake progress percentage, extra product delay, coordinate downsampling or component removal was introduced. Dataset/worker failure remains visible and explicit retry creates a fresh worker.

Inspected real loading frames at [desktop start](loading-desktop-1.png), [desktop next frame](loading-desktop-2.png), [mobile start](loading-mobile-1.png) and [mobile next frame](loading-mobile-2.png), plus actual local-road readiness at [desktop](ready-desktop.png) and [mobile](ready-mobile.png). The spinner's arc changes position between loading captures. Search can still be independently initializing in the map-ready screenshots.
