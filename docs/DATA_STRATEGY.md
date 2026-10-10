# Geographic data strategy

Research checked 10 October 2026. This is a reproducible acquisition/conversion plan; no road extract or verified emergency dataset is bundled in Phase 0.

## Candidate region

Use a compact mainland central Ernakulam rectangle centered at `[76.2925, 9.9800]`, with display bounds `[76.280, 9.970, 76.305, 9.990]` in west/south/east/north order. It is approximately 6 km² and deliberately avoids an all-Kochi scope. Consult the [OSM map](https://www.openstreetmap.org/#map=15/9.9800/76.2925) during MAP-01 to review actual roads. These bounds are proposed, not a surveyed neighborhood boundary or a verified flood region. Extract the buffered bbox south 9.967, west 76.277, north 9.993, east 76.308. Keep whole selected ways and referenced nodes to avoid severing roads at display edges. The graph may extend slightly beyond the displayed rectangle.

Final approval requires inspection of intersections, bridges, access restrictions, component sizes and two real alternative paths. If the dataset exceeds 5,000 nodes / 12,000 directed edges or 3 MB uncompressed runtime assets, shrink the region and record the revised bounds. Do not selectively fabricate shortcuts to satisfy the demo. A route can only claim availability within this extract.

## Acquisition and reproducibility

Use a single manual/development-time [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL) extraction. Never query Overpass from normal app startup or CI. Save this query as `data/source/ernakulam.overpassql` during MAP-01:

```overpass
[out:json][timeout:30];
way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|footway|path|steps|primary_link|secondary_link|tertiary_link)$"](9.967,76.277,9.993,76.308);
(._;>;);
out body;
```

The bbox order differs from GeoJSON. The recurse statement retains way node identities and node coordinates; `out geom` alone is insufficient if the converter discards node IDs. Consult [Overpass examples](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example). Public endpoints can rate-limit or fail; stop retry loops and use the last reviewed frozen extract. An updated query will not reproduce a previous live OSM snapshot, so keep the raw response.

Proposed acquisition commands, to run only in MAP-01 after creating the query file:

```bash
curl --fail --show-error --max-time 60 \
  --data-urlencode 'data@data/source/ernakulam.overpassql' \
  https://overpass-api.de/api/interpreter \
  -o data/source/ernakulam.osm.json
sha256sum data/source/ernakulam.osm.json
```

Validate content before accepting it; HTTP success can still contain an error. Record query text/hash, source URL, actual fetched-at time in UTC, OSM `osm3s.timestamp_osm_base`, source SHA-256, converter commit, access policy version, source/runtime counts, connected-component summary and output SHA-256 in `data/source/manifest.json`. Re-run conversion twice against the same input and compare outputs byte-for-byte. Stable ID sorting and no conversion-time timestamps in generated graph files ensure determinism. Use `pnpm exec tsx scripts/prepare-roads.ts` only once that script and dependency are introduced; it is **not** a Phase 0 command.

## Conversion and graph rules

1. Parse untrusted JSON; require expected node/way elements, unique string IDs, finite WGS84 coordinates and complete node references. Fail clearly on empty or malformed input.
2. Use a walking demonstration profile. Exclude ways with `foot=no/private` or `access=no/private` unless an explicit allowed `foot=yes/designated/permissive` overrides general access. Conservative MVP handling: exclude other restricted access values (customers/destination/delivery), `foot=use_sidepath`, conditional access/direction, construction/proposed roads, motorways/trunks, ferries and ways involving unhandled access barriers. Record exclusions, not silent defaults. For allowed highway classes without access tags, assume walking for the demonstration and record this limitation; these defaults are not verified local rights of access.
3. Read [OSM access semantics](https://wiki.openstreetmap.org/wiki/Key:access) and [pedestrian direction semantics](https://wiki.openstreetmap.org/wiki/Key:oneway:foot). General vehicle `oneway` alone does not determine pedestrian direction. For this walking graph: `oneway:foot=yes` creates forward edges, `-1` reverse edges, `no` or missing creates both. Exclude unsupported values pending review. No vehicle profile or turn-restriction claim in P0.
4. Every consecutive pair of eligible OSM way nodes is a physical segment. Keep IDs as strings. Emit directed edges with `wayId:segmentIndex:forward/reverse` and shared `segmentId`. Reverse geometry for reverse edges. Length is geodesic meters, not degrees or Web Mercator pixels. Reject zero/nonfinite lengths and duplicate edges/IDs.
5. Connect only shared OSM node IDs. A geometric crossing is not automatically a junction. Retain bridge/tunnel/layer information in the source for audit; do not merge nearby nodes or planarize flyovers. Exclude unsupported barriers rather than routing through them. Report disconnected components and dangling references.
6. Build sorted outgoing adjacency and road GeoJSON from the same edges; avoid duplicate visible physical segments. Validate edge endpoints against node coordinates. Retain complete segment geometry for intersection/rendering.
7. Review one real baseline/alternative route pair and one disconnected case. Freeze the dataset before tuning the fixed flood scenario. The polygon is synthetic and chosen for demonstrability, not inferred from historical maps.

## Coordinates and GeoJSON

[RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946) specifies GeoJSON positions in longitude/latitude order in decimal degrees on WGS84. Store `[longitude, latitude]`; never swap Overpass's bbox order into positions. MapLibre projects for display; EPSG:3857 coordinates must not enter the graph. Turf geodesic distances use explicit meter units; preserve precision until UI rounding. Polygon rings must be closed, have enough distinct points, valid winding, no self-intersection and lie near the selected region. For this tiny area a 2D intersection is adequate as a simulation rule; it does not model real inundation.

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
