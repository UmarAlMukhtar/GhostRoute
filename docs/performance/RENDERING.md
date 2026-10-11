# Bounded road renderer handoff

Base: `608caa29051f6dbe560b8594bbc419ce250b99fc`. The remaining pause came from MapLibre serializing and posting one inline GeoJSON collection containing all 57,706 roads. Chromium's main-renderer trace measured a 1,436.3 ms task through `GeoJSONSource._sendWorkerUpdate`, `Actor.sendAsync`, recursive serialization and native `postMessage`. This is separate from the previously fixed dataset decoding/validation cost.

MapView now starts with an empty road source and awaits ordered `GeoJSONSource.updateData({add})` calls of at most 5,000 original features. This is MapLibre 6.13's supported incremental API. IDs, complete properties, feature order and exact coordinates remain unchanged. Readiness waits for every update and the map's final idle event; optional tiles still start afterward. Unmount stops subsequent batches, and renderer failures remain visible. No new dependencies, worker forks, simplified geometry or removed roads.

## Matched measurements

Three fresh browser contexts per version, production builds on the same laptop, Chromium 360×800 mobile viewport/touch emulation, 4× CPU slowdown, no bandwidth throttle, external tiles aborted. No concurrent build or tests during timing runs. Run `node scripts/benchmark-loading.mjs http://127.0.0.1:3100` against each built version. This is not a physical-phone result.

| Measure (median)              |     Before |      After |
| ----------------------------- | ---------: | ---------: |
| Complete map readiness        | 9,155.1 ms | 8,930.0 ms |
| Longest main-thread task      |   1,318 ms |     165 ms |
| Longest animation-frame gap   | 1,499.8 ms |   216.6 ms |
| Coarse Chromium heap estimate |     269 MB |     322 MB |

[Before runs](rendering-before.jsonl) and [after runs](rendering-after.jsonl) include every long task and transfer size. The data assets are unchanged. With tracing enabled, the largest task fell from 1,436.3 to 253.1 ms; trace instrumentation is deliberately excluded from the timing table.

The higher coarse heap estimate includes temporary allocations. A separate isolated unchanged build and optimized build used the same browser conditions, one second after actual readiness, with `Runtime.getHeapUsage` before and after diagnostic-only `HeapProfiler.collectGarbage`. Three-run medians after GC: **196,629,328 bytes before / 197,744,056 bytes after** main-context used heap (+1.11 MB). Backing storage settles at about 7.55 MB for both; before GC it was about 12.6 MB before / 60.0 MB after. [Raw diagnostic records](rendering-heap.jsonl) preserve the allocation tradeoff. No production garbage collection is triggered. These numbers do not measure total worker/process memory, or establish safety on a physical low-memory phone.

## Coverage and regression checks

The helper's tests assert every original feature reference/order, all 57,706 unique IDs, bounded batches, serialized acknowledgments, cancellation while pending and failure propagation. A browser fixture runs the exact helper against real MapLibre and hashes `GeoJSONSource.getData()` against the complete original GeoJSON. Application tests navigate during preparation, assert full-count handoff before readiness, and inject one renderer-send failure followed by successful reload. Animation tests now cover both dataset initialization and actual map preparation, including reduced motion. Existing route, hazard, report and offline journeys remain required.

Residual main-thread tasks and temporary allocation remain; this change removes the measured whole-network serialization pause without claiming zero jank or faster networking.
