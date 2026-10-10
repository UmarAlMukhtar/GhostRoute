# ADR-003: Deterministic Dijkstra routing

- Date: 2026-10-10
- Status: Accepted; queue choice superseded by [ADR-008](008-heap-routing.md)
- Scope: planned MVP, not a claim of feature implementation

## Context

All weights are positive distances and the graph is bounded. Correctness and a clear explanation matter more than city-scale optimization.

## Decision

Use Dijkstra with stable ID ties, outgoing adjacency and a simple minimum-distance scan, skipping blocked edges/nodes. Recompute from scratch for each discrete change.

## Alternatives considered

A* needs an admissible heuristic and more proof; incremental routing is unnecessary for two scenario steps.

## Consequences and verification

O(V² + E) is acceptable only if measured budgets pass at the chosen extent. Shrink the region first; a binary heap is the next measured optimization. A* is not required.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
