# ADR-005: Deterministic flood simulation

- Date: 2026-10-10
- Status: Accepted
- Scope: planned MVP, not a claim of feature implementation

## Context

A presenter needs a repeatable closure that visibly affects an actual path.

## Decision

P0 has step 0 clear and step 1 one fixed valid polygon. Intersect entire road geometry and block physical segments in both directions, plus flooded nodes. Reset restores step 0.

## Alternatives considered

Random floods can miss the route or disconnect the whole graph; real feeds introduce validation and freshness work beyond the MVP.

## Consequences and verification

Boundary touches block conservatively; bridges may be overblocked. No weather, hydrology, randomness or claim of live conditions. Replay UI is P1.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
