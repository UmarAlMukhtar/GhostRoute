# ADR-001: Frontend-first architecture

- Date: 2026-10-10
- Status: Accepted
- Scope: planned MVP, not a claim of feature implementation

## Context

An eight-hour graph demo needs no shared mutable server data.

## Decision

Use Next.js App Router with client-side interactions, local static data and pure TypeScript engines. Keep routing outside React.

## Alternatives considered

A routing API or database adds deployment and availability dependencies with no P0 benefit.

## Consequences and verification

No backend setup or credentials; browser memory limits constrain dataset size. A future validated data loader can consume a service.

## Revisit when

Revisit if measured behavior or a changed requirement invalidates the context. Record a superseding ADR; do not silently replace the decision. See [architecture](../ARCHITECTURE.md), [data strategy](../DATA_STRATEGY.md) and [testing](../TESTING.md).
