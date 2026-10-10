# Frozen Ernakulam OSM source

`ernakulam.osm.json.gz` is the canonical **normalized OSM source**, not generated roads. It retains 493 highway ways, their 1,886 referenced nodes, source IDs, full node sequences, all tags, element versions and timestamps. No geometry or connections were invented. Non-road features and editor identities were removed. This small compressed source is committed because exact offline reproduction requires the original node topology/access tags; a future live request cannot recreate this snapshot.

The 7.9 MB unfiltered API response is outside Git. Its SHA-256, query URL, request bounds and acquisition evidence are in `manifest.json`. The normalized-source hash applies to the **decompressed bytes**. The OSM map API supplies no global database snapshot timestamp; file modification time records this run's curl download completion, separately from normalization/import time. Retained element timestamps are edit times, not proof of currency or passability.

From repository root:

```bash
pnpm data:prepare   # Offline; reproduces public/data/ernakulam/* JSON assets
pnpm test           # Offline; validates integrity and the alternative-path witness
```

Intentional source refresh (manual only; changes the dataset):

```bash
pnpm data:acquire
pnpm data:prepare
pnpm test
```

The acquisition command performs one small OSM API request with a 60-second timeout, verifies its bounds and conversion, then writes normalized source + manifest. Stop on errors; keep the checked-in source. Do not run live acquisition in CI or the browser. For larger coverage use a regional extract/Overpass rather than repeatedly querying the editing API.

Equivalent acquisition used for this snapshot:

```bash
curl --fail --show-error --max-time 60 \
  'https://api.openstreetmap.org/api/0.6/map.json?bbox=76.274,9.966,76.292,9.984' \
  -o /tmp/ghostroute-selected.json
pnpm data:acquire /tmp/ghostroute-selected.json
pnpm data:prepare
```

Only import an unmodified response from that exact URL. Re-downloading current OSM is a source update, not bit-for-bit reproduction. Review all changed exclusions/components, bounds and demo IDs before accepting it; prepare fails if the reviewed fixture or budgets stop holding. Bump the converter policy/version when changing access semantics. See [data strategy](../../docs/DATA_STRATEGY.md) and the [data license notice](../../public/data/ernakulam/ATTRIBUTION.md).
