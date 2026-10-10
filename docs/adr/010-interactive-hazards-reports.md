# ADR-010: Interactive hazards and separately sourced incident reports

- Status: Accepted for local implementation; shared persistence/verification remains proposed.
- Context: User-directed scope now extends beyond fixed flood demos, without replacing the real graph, Dijkstra engine or organizer foundation.
- Decision: Extend the existing polygon impact engine to flood/landslide/fire and explicit physical segments. Keep stable user hazard IDs and immutable graph data. Keep community reports in a separate source-discriminated contract and local storage adapter. Browser-local records cannot establish trusted verification; unverified routing requires explicit exploratory opt-in. Modes select one source of additional closures.
- Consequences: No new dependencies or runtime geographic services. Offline road assets still work; reports persist only in this browser and are not shared. No authenticated reviewer, cloud database, photo upload or geocoder is implied. Supabase integration needs server validation/RLS and an evidence/expiry policy before verified reports influence routing.
- Supersedes: ADR-001's no-persistence scope for browser-local reports; ADR-005/009 fixed-flood-only scenario scope. Existing template, frontend-first architecture and routing decisions remain intact.
- Evidence: `tests/unit/platform.test.ts`, `tests/e2e/platform.spec.ts`, [platform policy](../PLATFORM.md), and current [verification](../VERIFICATION.md).
