# Ernakulam offline place catalog

Seven reviewed OpenStreetMap points, selected from a bounded OSM map API response on 11 October 2026 (IST). `ernakulam.json` records the exact acquisition URL, UTC time, raw-response SHA-256, graph version, source IDs, `[longitude, latitude]`, nearest eligible node and measured offset. `osm-evidence.json` preserves the selected OSM nodes and relevant named parent ways with versions/timestamps; editor identities and unrelated raw data are omitted.

© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). These files are geographic data under ODbL, separate from the MIT application code.

| Display place                              | Point evidence                                                 | Snapped node | Offset   |
| ------------------------------------------ | -------------------------------------------------------------- | ------------ | -------- |
| Marine Drive                               | Named tourism node 7016742693                                  | 7016742693   | 0 m      |
| MG Road — Jos Junction                     | Junction node 1906667447 on Mahatma Gandhi Road way 1038662801 | 1906667447   | 0 m      |
| Ernakulam South Railway Station            | Named Ernakulam Junction railway node 4760378949               | 11235421033  | 42.358 m |
| Maharaja’s College — Park Avenue entrance  | Entrance node 7057719920 on college way 264720319              | 271151789    | 24.236 m |
| General Hospital Ernakulam — main entrance | Main entrance node 7057737620 on hospital way 755600802        | 271145617    | 4.099 m  |
| Broadway — northern section                | Node 1906467050 on named Broadway way 1230913299               | 1906467050   | 0 m      |
| High Court Junction                        | Named junction node 271146530                                  | 271146530    | 0 m      |

These are sourced geographic points, not verified emergency destinations, official shelters or guaranteed accessible entrances. A station point is not a verified station entrance. Broadway and MG Road identify specific portions of long streets, not every address along them. The initially considered Broadway pedestrian node 277325109 was disconnected from the demo anchor; it was rejected, not silently snapped to a farther connected node. The included northern street point is separately sourced and explicitly labelled.

## Verification and maintenance

From the repository root:

```bash
pnpm places:verify
pnpm test
```

Validation uses the existing graph/router: bounds, coordinates, graph version, unique IDs, category, nearest eligible node within **100 m**, exact stored offset (0.01 m tolerance), and routes in both directions to anchor `271145615`. Unit tests compare each coordinate with OSM evidence, check named parent-way membership and all 49 ordered place pairs. The app repeats catalog validation once per loaded dataset; selecting a result rechecks snapping and connectivity to the other endpoint. There is no largest-component fallback that silently relocates a disconnected point.

To review a fresh source (optional maintenance, never application runtime):

```bash
curl --fail --retry 2 \
  --user-agent 'GhostRoute-maintenance (https://github.com/UmarAlMukhtar/GhostRoute)' \
  'https://api.openstreetmap.org/api/0.6/map.json?bbox=76.273,9.963,76.294,9.991' \
  --output /tmp/ghostroute-places-osm.json
sha256sum /tmp/ghostroute-places-osm.json
```

This is one bounded data acquisition, not a search or autocomplete endpoint. The live response may change. Review source versions/tags and parent membership, update only the selected evidence and catalog entries, recalculate offsets with `router.snap`, then run verification/tests. Preserve provenance, never fabricate coordinates, and do not commit the full raw response. The committed evidence and graph allow offline validation without refetching historical OSM data.
