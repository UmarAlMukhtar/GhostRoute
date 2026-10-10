# ADR-004: Frozen geographic dataset

- Date: 2026-10-10
- Status: Accepted; MAP-01 extent and connectivity fixture recorded
- Scope: MAP-01 local data implemented; routing/rendering remain planned

## Context

Live extraction during judging is fragile and changes results.

## Decision

Freeze one small OSM extract plus query, timestamp, hashes and deterministic conversion. Use walking-demo access rules, reviewed node connectivity and synthetic destinations.

## Alternatives considered

Full Ernakulam is too large; invented route polylines fail the core requirement; runtime Overpass harms reproducibility.

## Consequences and verification

Real roads remain traceable. Manual inspection and source licensing are necessary. MAP-01 verified alternatives and size budgets; see DATA_STRATEGY. Overpass failures required a small OSM map API extract. Freeze only normalized road source compressed with gzip, plus original-response hash, request URL and element revision evidence; unrelated raw features remain outside Git. No global snapshot timestamp is invented.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
