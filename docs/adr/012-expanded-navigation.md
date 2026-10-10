# ADR-012: Expanded frozen OSM navigation, local gazetteer and separate workflows

Status: implemented; human review pending.

Use a larger frozen Kochi–Ernakulam OSM road graph, a derived offline name index and the existing Dijkstra/Turf engines. A remote geocoder adds reliability/policy concerns and paid providers add unavailable keys; a meaningful local OSM gazetteer supplies no-key autocomplete without public Nominatim. Record exact source provenance, keep all graph components, preserve source access/direction and the original Hospital Road regression geometry.

Compact only untagged non-junction shape vertices outside the original reviewed rectangle, retaining full geometry. Recognize toll booths as non-physical barriers while retaining explicit access exclusions. Use a coordinate grid for repeated nearest-node queries with exact-distance validation and full failure fallback. Keep the shared initialized router/index rather than workers or geographic partitioning without measured need.

Compose `/` and `/demo` through the same Dashboard; navigation remains left and simulated hazards/report workflows open right. Local reports remain unverified, and deletion manages only the browser archive. There is no authenticated identity and no server security claim. The current UI is light-only following the consistency update; theme controls, persistence and map switching were removed. Navigation/Demo page links share a segmented control and active state. Map and search-index readiness are independent.

Consequences: larger initial assets, frozen/incomplete OSM search, approximate nearest-node access and disconnected areas remain limitations. Future routine acquisition should use an extract/Overpass; shared reports require a real authenticated backend and moderation. Deployment needs separate human and hosted validation.
