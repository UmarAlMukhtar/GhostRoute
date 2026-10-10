# ADR-006: Layered deterministic testing

- Date: 2026-10-10
- Status: Accepted
- Scope: planned MVP, not a claim of feature implementation

## Context

A compelling animation does not prove graph correctness.

## Decision

Vitest tests pure graph/simulation logic and integration; Playwright tests the user journey with local data and no external tiles. CI runs lint, formatting, types, unit tests, build and Chromium smoke/journey tests.

## Alternatives considered

Snapshot-only tests miss invalid paths; external-service tests are flaky; exhaustive browser matrices exceed the initial budget.

## Consequences and verification

Foundation tests prove only the scaffold. Algorithm acceptance remains pending until ROUTE-01/SIM-01/INT-01. Real device accessibility and field safety are not proven by CI.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
