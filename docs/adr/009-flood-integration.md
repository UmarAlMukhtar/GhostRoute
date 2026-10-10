# ADR-009: Deterministic stages and retained selection state

- Date: 2026-10-10
- Status: Accepted
- Scope: SIM-01/INT-01; supersedes the single-stage scope in ADR-005 and single-reducer choice in ADR-007

## Context

The user requested three reproducible scenarios, including expanding extents, integrated with the completed MAP-02 dashboard. Its endpoint reducer already handles click/preset/error interactions.

## Decision

Keep that reducer and add a small scenario/stage reducer. Derive memoized baseline/current routes synchronously from both. Stage transitions reuse the baseline; endpoint changes update both routes. Store no separate mutable current-route state. Use deterministic nested polygons and manual previous/next controls; stage 0 clears closures. Four focused Turf modules provide intersection, node inclusion and geometry validation.

## Alternatives considered

Replacing working endpoint state increases regression scope without simplifying the demo. Timed playback and physical flood propagation add behavior unnecessary for the requested stage demonstration. A worker is premature at measured sub-2 ms per-operation p95 on the current machine.

## Consequences and verification

Scenario changes and resets remain deterministic, with no timer races. Shared contracts accept MultiPolygon. Tests prove real graph closures/detours, unavailable outcomes and baseline preservation; browser journeys cover endpoint changes and stage/reset interactions. Performance is machine-specific and must be remeasured on target hardware. See [FLOOD_SIMULATION](../FLOOD_SIMULATION.md).

## Revisit when

Add a worker and cancellation/version guards if dataset expansion causes measured delays. Revisit state structure if multiple pages actually share simulation state.
