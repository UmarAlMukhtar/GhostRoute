# ADR-011: Offline verified place search and explicit dataset extent

- Status: Accepted
- Date: 2026-10-11

## Context

The dashboard needs usable autocomplete without credentials, live service dependency or misleading road coverage. Public Nominatim's [usage policy](https://operations.osmfoundation.org/policies/nominatim/) prohibits client-side autocomplete. No suitable configured live provider is available.

## Decision

Use a seven-place OSM-derived local gazetteer with provenance and actual graph validation. Filter names, aliases, categories and locality locally. Reuse existing snapping and Dijkstra, enforcing a 100 m nearest-node limit and directed connectivity; never choose a farther connected node silently. Keep arbitrary map/coordinate selection and demo shortcuts.

Draw the exact min/max validated graph-node bounds as a dashed teal LineString plus subtle Polygon fill. Label it dataset extent, not guaranteed connectivity. Place the boundary below route/closure layers and keep a regional fit control available.

## Consequences

Search works offline and has no provider request quota or runtime geocoding traffic. It covers seven reviewed places, not arbitrary addresses. Source data needs manual review when expanding or changing the graph; snapping remains an approximate approach to a road node. A future live provider needs separately reviewed autocomplete terms, region/graph validation and attribution. Existing route and hazard engines remain unchanged.
