# Geographic data strategy

## Expanded frozen geography — walking-v2

49,740 nodes / 115,412 directed edges / 57,706 physical segments. Actual whole-way graph extent is `[76.2148797, 9.8510819, 76.4365348, 10.1499696]` (west, south, east, north). Runtime graph + road JSON is 64,700,183 bytes. The source contains 30,035 real OSM highway ways and named OSM node POIs. No connections or geometry were fabricated. Central Kochi, Marine Drive, MG Road, Kaloor, Edappally, Palarivattom, Vyttila, Kadavanthra, Panampilly Nagar, Thevara, Fort Kochi, Mattancherry, Kakkanad and Aluva are represented; southern/eastern coverage is bounded, and Tripunithura coverage is partial.

Overpass requests failed (HTTP 406/500); bounded map API cells were acquired sequentially as a development fallback. Forty-four successful responses cover the northern urban rectangle [76.22,9.94,76.42,10.14] plus southern bridge approaches [76.22,9.89,76.32,9.94]. Larger cells exceeding the API limit were subdivided. An empty southwest ocean cell contributes no elements. Complete ways extend outside these cells. The exact URLs, response hashes and download timestamps are in the source manifest. No raw editing identities are retained. This is a one-time fallback; future routine regional refreshes should use a regional extract or Overpass.

Source merging uses OSM type/ID and the highest element version. Preparation is fully offline and deterministic. It generates graph, renderer geometry, fixture, metadata and a compact runtime place index from the frozen source. Source way tags and original shape geometry remain available; intermediate shape vertices outside the regression area become geometry rather than graph junctions. Budgets are now 100,000 nodes, 250,000 directed edges and 100 MB JSON, reflecting the validated expansion.

The local gazetteer derives named highway way points and named OSM nodes. It includes partial names, aliases, road names, landmarks, hospitals and localities, ranked by exact name/alias and prefix before loose matches. Only results within 100 m of an eligible nearest graph node and with directed access to the central anchor are indexed. Large building polygons without a named node are not indexed; this is a frozen local gazetteer, not a global geocoder. Popular defaults retain the original seven source-evidenced suggestions. No remote provider, paid key or prohibited public Nominatim autocomplete is used.

Hospital Road's original witness and shortest distances remain regression requirements. Disconnected components remain in the graph and return explicit unreachable results; newly expanded roads may connect formerly disconnected baseline nodes. Bounding geometry shows the actual graph extent and explicitly warns that the enclosed area does not guarantee connectivity.

The following small-area data notes are retained as historical baseline evidence; their counts/budgets are superseded above.

MAP-01 implemented 10 October 2026. Real local OSM roads are bundled, and ROUTE-01 implements Dijkstra. Map rendering and flood simulation remain upcoming tasks.

## Selected area and observed coverage

The request bbox is **[76.274, 9.966, 76.292, 9.984]** in west/south/east/north order (about 2 × 2 km). A broader OSM coverage inspection showed Marine Drive west of the Phase 0 proposal and South Railway Station Road below it. The selected rectangle includes OSM ways 180345780 (Marine Drive Walkway), 755605372 (Mahatma Gandhi Road), 768625211 (Hospital Road), 24952897 (Durbar Hall Road) and 30932690 (South Railway Station Road). These actual road positions determined the revised bounds; this is not an administrative or flood boundary.

Whole ways retain their referenced nodes beyond the request. Actual graph extent: **[76.2732579, 9.9638296, 76.2936855, 9.9897189]**. The validator's reviewed envelope is [76.273, 9.963, 76.294, 9.990]. Keeping complete ways avoids invented boundary intersections. No coordinate snapping, simplification or largest-component-only pruning occurs.

- Frozen source: 493 highway ways / 1,886 referenced nodes.
- Runtime: **1,719 nodes / 3,712 directed edges / 1,856 physical segments**.
- Components: **1,501, 117, 34, 30, 12, 8, 4, 4, 3, 2, 2, 2 nodes**. All segments in this snapshot are bidirectional, so these weak components are also strongly connected. The converter/tests support explicit pedestrian one-way tags even though this snapshot has none.
- Graph + GeoJSON: **1,875,234 bytes**, below the 3 MB / 5,000-node / 12,000-edge budgets. No parallel-segment endpoint duplicates were found.
- 71 way/segment exclusions are recorded individually in metadata. Smaller disconnected components remain available for honest unreachable handling.

## Source, acquisition and exact reproduction

The initial Overpass endpoint returned HTTP 406; two mirrors returned HTTP 500. A single small [OSM map API](https://wiki.openstreetmap.org/wiki/API_v0.6#Retrieving_map_data_by_bounding_box:_GET_/api/0.6/map) extract succeeded. It returns complete ways plus referenced nodes. This development-time fallback is not an application or CI dependency. For wider-area expansion prefer an extract or [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL), not repeated editing-API downloads.

The [source manifest](../data/source/manifest.json) records the exact URL, downloaded response hash, normalized source hash, query bounds and timestamps. This response finished downloading at **2026-10-10T16:51:47.804Z**, evidenced by its local file modification time. The API provides no global snapshot timestamp; per-element edit timestamps and versions are retained. Do not equate acquisition time with verified fresh conditions.

`data/source/ernakulam.osm.json.gz` contains only road ways, their nodes and any explicit pedestrian restriction relations, retaining all tags and topology. Editor identities and unrelated features are removed. The compressed normalized source is committed because it is necessary for exact offline conversion. The unfiltered response stays outside Git. Runtime metadata includes policy version, converter-code hash, component summary, exclusion reasons and output hashes.

Exact offline regeneration from repository root (Node 22.13+ or 24; no tsx dependency):

```bash
pnpm install --frozen-lockfile
pnpm data:prepare
pnpm test
```

To confirm determinism:

```bash
sha256sum public/data/ernakulam/*.json public/data/ernakulam/*.geojson > /tmp/ghostroute-before.sha256
pnpm data:prepare
sha256sum --check /tmp/ghostroute-before.sha256
```

An intentional source update uses `pnpm data:acquire` then `pnpm data:prepare` and review/tests. A live request will change with OSM edits. The [source README](../data/source/README.md) gives exact curl/import commands and failure handling. Changing the extent requires changing the acquisition URL/bounds checks, reviewed output envelope, fixtures and metadata together. Source updates that invalidate the demo or budgets must be reviewed before committing. Bump the walking policy version for changed semantics.

## Conversion policy: walking-v1

1. Parse unknown JSON and validate IDs, duplicate elements, coordinate ranges and complete node references. Reject empty data, API error remarks, invalid geometry and zero-length segments with useful errors.
2. Allow primary/secondary/tertiary and their links, unclassified, residential, living_street, service, pedestrian, footway, path and steps. Exclude other classes, motor roads, area ways, construction/proposed ways and moving walkways. Missing walking/access tags on an allowed highway imply assumed demo access, not verified legal rights or sidewalks.
3. Only `yes`, `designated`, `permissive` are accepted explicit foot/access permissions. Specific foot permission overrides general access. Reject private/no/customers/destination/delivery/use_sidepath and other unsupported values. Exclude conditional access/direction, including on nodes, rather than evaluating time-dependent rules. Nodes with unhandled barriers block incident segments, preserving the rest of the way.
4. [Pedestrian direction](https://wiki.openstreetmap.org/wiki/Key:oneway:foot): `oneway:foot=yes` is forward, `-1` reverse, `no` or absent both. Apply foot/access forward/backward restrictions. Ignore vehicle `oneway` on streets; conservatively exclude ambiguous oneway-tagged pedestrian/path/steps ways without an explicit pedestrian direction. Exclude unsupported direction values and ways involved in explicit pedestrian turn-restriction relations. Vehicle turn relations are not a walking restriction model. See [access semantics](https://wiki.openstreetmap.org/wiki/Key:access).
5. Split each consecutive OSM way-node pair, preserving all shape nodes and source way IDs. IDs are `way:segment:forward/reverse`; opposite directions share `segmentId`. Emit one GeoJSON feature per physical segment, with both directed edge IDs and all source way tags (including name, bridge, tunnel, layer).
6. Shared OSM node identity alone connects roads. Crossing lines or equal coordinates with different IDs remain separate. No joining by proximity or assumed road level. Bridges/tunnels retain mapped topology; this does not verify its field accuracy.
7. Graph loading validates meter weights against full geometry, endpoints, source IDs, reverse geometry and exact sorted adjacency. Dataset validation cross-checks map/graph agreement, duplicates, geographic envelope, component counts and byte/node/edge limits. Parallel ways with equal endpoint IDs are reported for review, not automatically merged.

## Reviewed alternative-path fixture

[demo-paths.json](../public/data/ernakulam/demo-paths.json) is a graph-version-bound **BFS connectivity witness**, not shortest-distance routing or a shelter selection.

| Role                                         | OSM node   | [Longitude, latitude]   |
| -------------------------------------------- | ---------- | ----------------------- |
| Origin: Park Avenue / Hospital Road          | 271145615  | [76.28014, 9.9713489]   |
| Destination: Jos Junction / Durbar Hall Road | 1906667447 | [76.2860629, 9.9684255] |

The baseline witness is 15 edges / **1,003.818 m**, via Hospital Road, TD Road, Club Road and Durbar Hall Road. Blocking **768625211:4**, both `forward` and `reverse`, leaves a 25-edge / **1,470.595 m** witness via Park Avenue, Cannon Shed Road and Market Road before rejoining Hospital Road. It uses **695.005 m** of physical segments absent from the baseline. Tests walk each consecutive directed edge, verify endpoint coordinates, sum distances and exclude the blocked segment. A node from another component is also frozen as an unreachable fixture.

ROUTE-01 now independently calculates shortest paths (see [ROUTING_ENGINE](ROUTING_ENGINE.md)): these BFS distances are not Dijkstra expectations and are not a claim about the eventual optimal detour. SIM-01 must independently choose/test its flood polygon; no hazard geometry was added here.

## Coordinates and GeoJSON

[RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946) specifies GeoJSON positions in longitude/latitude order in decimal degrees on WGS84. Store `[longitude, latitude]`; never swap Overpass's bbox order into positions. MapLibre projects for display; EPSG:3857 coordinates must not enter the graph. The converter uses the haversine formula with IUGG mean Earth radius 6,371,008.8 m and rounds edge lengths to millimeters; preserve precision until UI rounding. Polygon rings must be closed, have enough distinct points, valid winding, no self-intersection and lie near the selected region. For this tiny area a 2D intersection is adequate as a simulation rule; it does not model real inundation.

## Flood intersection and snapping

Use [Turf booleanIntersects](https://turfjs.org/docs/api/booleanIntersects) between the full line geometry and polygon. Block crossings, contained segments and boundary touches; holes remain open unless a segment touches/crosses their boundaries. Block both directed edges belonging to the same physical segment. Independently mark nodes in/on the polygon unavailable. Do not mutate graph weights.

A map click selects the nearest eligible node within 100 m using geodesic distance and a stable ID tie-break; otherwise show an out-of-network message. Show the selected snapped point and distance. No straight connector line should imply a safe physical approach across a canal or private land. Keyboard preset origins bypass click ambiguity. Synthetic destinations are placed directly on reviewed graph nodes, with explicit demo names.

## Shelters and geographic truth

The official Kerala State Disaster Management Authority has a [2020 relief-camp map including Ernakulam](https://sdma.kerala.gov.in/wp-content/uploads/2020/08/0__Kerala_CZ_28-07-2020_Final-converted.pdf) and a [2015 Ernakulam disaster management plan](https://sdma.kerala.gov.in/wp-content/uploads/2018/11/7-Ernakulam-Final.pdf). These are historical references, not evidence of live availability, capacity or current evacuation suitability. The large 2020 PDF was located through the official site; its individual camp coordinates were not extracted or verified in this phase. No reusable live shelter API has been verified.

Use at least two clearly named “Demo destination A/B (synthetic)” points. Do not relabel a school/hospital from OSM as an approved shelter. Keep `provenance: synthetic` and `availability: unknown`; omit capacity instead of inventing it. Future real facilities need source/license, reviewed entrance coordinates, authoritative status and a freshness policy.

## Licensing and attribution

OSM geographic databases and derived graph assets retain [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) obligations, including attribution and applicable share-alike; MIT for new project code does not replace them. Display “© OpenStreetMap contributors” linked to [OSM copyright](https://www.openstreetmap.org/copyright), including in fallback maps and screenshots. Bundle source/query/manifest and a data license notice with derived data. Record other source licenses separately; do not copy proprietary map imagery or assume government PDFs are freely redistributable.

## Tiles, fixtures and offline fallback

Select an online tile/style provider only after reviewing current terms and attribution (ADR-002 leaves the provider proposed). The [OSM standard tile policy](https://operations.osmfoundation.org/policies/tiles/) disallows bulk/offline tile downloads and offers no service guarantee. Do not prefetch those tiles. Build a local MapLibre background style using bundled road GeoJSON and labels needed for the demo, without external sprite/glyph dependencies. This keeps actual graph operations demonstrable when internet tiles fail after installation. Full offline installation/PWA and nationwide offline maps remain P2.

Keep a tiny synthetic mathematical graph fixture in tests, separate from OSM assets. Its topology and expected routes are specified in [TESTING](TESTING.md); it is not real Ernakulam road data. The eventual browser fixture must be the reviewed local road dataset with a tile-free map style.

## Data quality limits

OSM completeness, access rules, road condition, usable sidewalks, steps and crossings are uncertain; a connected mapped edge is not proof of physical passability. The simulation ignores elevation, water depth/velocity, bridge strength, crowding and traffic. Missing wider-area paths can produce false local unreachability. Document dataset age and exclusions visibly; do not silently fetch a newer network during a presentation.

## Lossless runtime transport

`pnpm data:prepare` also emits `dataset.json` (`ghostroute-segments-v1`). It stores each node ID/coordinate and each physical segment's complete canonical LineString, OSM way ID, tags, and explicit forward/reverse endpoints and meter weights once. Reconstruction rebuilds the original directed edges and sorted adjacency before full geographic validation in a bundled same-origin worker. No coordinates, components, directions, source identities, access constraints or tags are omitted. The original `graph.json` and `roads.geojson` remain deterministic reference/verification assets. A full-network equivalence test compares every reconstructed value with those originals. Fixture graph-version checks still reject mismatched deployment assets, and a failed worker/load clears the shared promise for explicit retry. No persistent browser cache or new stale-data policy is introduced.
