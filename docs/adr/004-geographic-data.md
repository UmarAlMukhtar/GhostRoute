# ADR-004: Frozen geographic dataset

- Date: 2026-10-10
- Status: Accepted; final extent and demo points proposed
- Scope: planned MVP, not a claim of feature implementation

## Context

Live extraction during judging is fragile and changes results.

## Decision

Freeze one small OSM extract plus query, timestamp, hashes and deterministic conversion. Use walking-demo access rules, reviewed node connectivity and synthetic destinations.

## Alternatives considered

Full Ernakulam is too large; invented route polylines fail the core requirement; runtime Overpass harms reproducibility.

## Consequences and verification

Real roads remain traceable. Manual inspection and source licensing are necessary. MAP-01 must prove alternatives and size budgets before finalizing the region.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
