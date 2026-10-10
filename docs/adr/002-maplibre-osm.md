# ADR-002: MapLibre and OpenStreetMap

- Date: 2026-10-10
- Status: Accepted; optional OSM standard raster selected for MAP-02
- Scope: planned MVP, not a claim of feature implementation

## Context

The demo needs inspectable geographic roads and independent layer styling.

## Decision

Use MapLibre for rendering and OSM-derived local roads/graph. Preserve ODbL attribution. MAP-02 uses optional OSM standard raster tiles after reviewing its [tile policy](https://operations.osmfoundation.org/policies/tiles/): browser Referer/cache behavior, visible attribution, no bulk/prefetch and no public tile requests from tests. Local road style is the mandatory fallback. Service availability is best effort.

## Alternatives considered

Leaflet could render the small region but a single MapLibre layer model better fits route/hazard styling; commercial routing APIs hide the graph behavior.

## Consequences and verification

WebGL support is required for the map. Data licensing and tile-service policies are distinct. No paid service or tile prefetch requirement.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
