# Architecture decision records

Accepted means the implementation direction is selected, not that it is implemented or verified. Proposed subdecisions require evidence before adoption.

- [ADR-001: Frontend-first architecture](001-frontend-first.md) — Accepted
- [ADR-002: MapLibre and OpenStreetMap](002-maplibre-osm.md) — Accepted; optional OSM standard raster with local fallback
- [ADR-003: Deterministic Dijkstra routing](003-routing.md) — Accepted; queue choice superseded by ADR-008
- [ADR-004: Frozen geographic dataset](004-geographic-data.md) — Accepted; MAP-01 extent and path witness verified
- [ADR-005: Deterministic flood simulation](005-simulation.md) — Accepted
- [ADR-006: Layered deterministic testing](006-testing.md) — Accepted
- [ADR-007: Local React state and derived routes](007-state.md) — Accepted

- [ADR-008: Indexed binary heap for routing](008-heap-routing.md) — Accepted; ROUTE-01 implemented

- [ADR-009: Flood integration](009-flood-integration.md) supersedes ADR-005's single-stage scope and ADR-007's single-reducer choice for the implemented three-scenario dashboard.

- [ADR-010: Interactive hazards and separately sourced reports](010-interactive-hazards-reports.md) — accepted local adapter; shared verification proposed.
