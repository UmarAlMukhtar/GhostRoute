# ADR-008: Indexed binary heap for routing

- Date: 2026-10-10
- Status: Accepted
- Scope: ROUTE-01; supersedes ADR-003's linear queue selection only

## Context

The ROUTE-01 request explicitly requires a binary min-heap and O((V + E) log V) routing. The earlier small-graph scan was a planning preference, not an organizer restriction.

## Decision

Use a small indexed binary min-heap with decrease-key, distance/node-ID priority and sorted edge traversal. Keep at most one queued entry per node. Initialize a private graph snapshot and component/adjacency indexes once; pass closures per request. The only implemented profile remains walking distance. Reuse the existing geographic contracts and validator.

## Alternatives considered

A linear scan does not meet the requested complexity. A lazy heap can retain O(E) stale entries and has a log E queue bound for multigraphs. A dependency or generalized queue/cost-plugin framework is unnecessary for this bounded engine.

## Consequences and verification

Heap position bookkeeping needs tests for repeated decrease-key, ties and removal. Unit tests compare real shortest distances with an independent Bellman-Ford oracle. Benchmark initialization separately from repeated route queries; see ROUTING_ENGINE and VERIFICATION. No safety/accessibility attributes are inferred.

## Revisit when

Consider A*, workers or expanded profiles only with measured performance requirements or reliable new geographic attributes.
