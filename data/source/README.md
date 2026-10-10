# Frozen Kochi–Ernakulam OSM source

`ernakulam.osm.json.gz` is the canonical normalized snapshot: 30,035 highway ways, their referenced nodes and named OSM node POIs, tags, topology, versions and timestamps. Editor identities and unrelated features were removed. No coordinates/connections were invented. The 44 exact successful bounded map API response URLs, hashes and download times are recorded in `manifest.json`; raw responses remain outside Git. Overpass failed with HTTP 406/500 and larger map cells exceeded the response cap, so cells were subdivided sequentially. Routine future updates should use a regional extract or Overpass rather than repeated editing-API downloads.

```bash
pnpm data:prepare # fully offline deterministic graph, renderer, fixture, index and metadata
pnpm data:acquire # intentional Overpass source refresh; fails without replacing source on HTTP errors
pnpm data:acquire /path/to/bounded-responses # explicit imported map response or directory
```

Import only original bounded JSON responses within the reviewed Kochi envelope. The manifest records the actual cell union; queryBounds is its outer envelope, not an administrative boundary. Successful cells cover the northern [76.22,9.94,76.42,10.14] rectangle and southern [76.22,9.89,76.32,9.94] bridge approaches. An empty ocean cell is omitted. Complete ways extend beyond request cells. Duplicate elements use highest OSM version. Acquisition validates conversion before replacing source; preparation validates size/geography and the Hospital Road witness before output. Compare all changed exclusions/components and hashes when refreshing. No live acquisition in app or CI.

ODbL attribution applies to source and derived assets. Acquisition times are not a simultaneous global snapshot or proof of passability. See [DATA_STRATEGY](../../docs/DATA_STRATEGY.md) and [ATTRIBUTION](../../public/data/ernakulam/ATTRIBUTION.md).
