# ADR-007: Local React state and derived routes

- Date: 2026-10-10
- Status: Accepted
- Scope: planned MVP, not a claim of feature implementation

## Context

One page controls a small dataset and discrete scenario.

## Decision

Use a single reducer for selection/scenario step and derived memoized blocked sets/routes. Keep immutable graph data and a MapLibre instance outside reducer state.

## Alternatives considered

Global stores and event buses introduce synchronization work without a present need.

## Consequences and verification

No external state dependency; synchronous bounded computation avoids async races. Move work off-thread only after measurement and add stale-result guards then.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
