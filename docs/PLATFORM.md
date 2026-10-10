# Interactive hazards and local incident reports

## Workflows

- **Navigate:** select any supported coordinates by map click, coordinate entry, dragging A/B, swapping endpoints, or the explicit **Use my location** button. Browser permission is required; location is used locally once, never tracked or uploaded. Snapping uses the existing geographic router, requires a point inside the dataset bounds and an eligible node within 100 m. A node is not necessarily an accessible entrance. Disconnected components return unavailable routes.
- **Simulate:** choose flood, landslide, fire or roadblock. Place a zone center on the map, adjust 10–500 m radius, or click a visible road for a physical-segment closure. Add up to 20 hazards. Select a list item to move, resize, enable/disable or remove it. Clear simulated hazards leaves reports intact.
- **Reports:** submit a 5–500 character observation at a selected map location; severity is optional. Clicking a visible road associates its physical segment. Purple point markers and the report list show verification status, timestamp, coordinates and description. Filters affect both list and map visibility, **not routing policy**. Reports without a road association remain visible but do not close roads.
- **Demo:** retains the three validated flood scenarios and guided presentation. Demo routing and custom hazards are separate sources; switching routing modes selects one source, never invisibly merges sources.

The interface offers Normal, Simulation and Incident-aware modes. Normal has no additional closures. Simulation uses enabled custom hazards. Incident-aware has **no trusted verification feed** and adds no closures by default. The explicit exploratory checkbox treats only non-seed, unverified, road-associated reports as hypothetical closures. Rejected/resolved reports and illustrative seeds never affect routes. Do not interpret any mode as certified safe.

## Shared impact and state boundaries

`SimulatedHazard` has `source: 'simulation'`, a stable UUID, type, enabled flag, center, radius and optional physical segment ID. `hazardZone` constructs a deterministic 48-sided geodesic approximation on the same mean-radius sphere as road distances. All area types pass through the existing Turf polygon-validation/intersection engine in `simulation/flood.ts`. Its name/export remains compatible with the existing demo. Bounding boxes only reject impossible intersections; exact line/polygon tests establish impacts. Direct segment closures enter that same engine and are deduplicated with polygon impacts. All associated directed edges close. Unknown segments fail explicitly. No topology or graph weights change.

The dashboard retains the initialized router and impact engine. Memoized baseline and current results depend on endpoints and selected closure source. Geometry source updates do not recreate the map. Blue/dashed original and green current routes use actual geometry; red roads show closures. Cyan flood, ochre landslide and orange fire zones are illustrative; icons and text identify the type. Purple reports are observations, never hazard polygons. Camera fit, map picking, markers and report sources remain in MapView.

Radii are illustrative exclusion distances, **not flood propagation, fire spread or landslide models**. Two-dimensional intersection can overblock bridges. Zones may extend beyond the extract; only local roads are analyzed. No custom polygon drawing, road safety score, travel time or verified evacuation destination is supplied.

## Local persistence and verification policy

`incidents/reports.ts` validates report input and local storage on every load/submission. Key: `ghostroute.local-reports.v1`. A clearly labelled illustrative seed demonstrates the report UI and never changes routes. New observations use UUIDs and actual submission timestamps. The adapter stores at most 200 reports and limits submission to three per minute in this browser. Descriptions render as React text. No photo upload or external transmission exists. Storage failures preserve the prior archive and display an error; a corrupt archive disables submission rather than overwriting it.

Local storage is editable by the user. Every claimed Verified/Under review record is downgraded to Unverified on reading; there is **no moderator or self-verification control**. These protections are UI/model safeguards, not a server abuse boundary. Clearing browser storage deletes reports. Reports are scoped to the browser/origin and are not shared between users or synchronized live between tabs. A submission reloads the latest archive before writing to reduce same-browser stale writes, but atomic multi-tab storage is not claimed.

## Shared persistence migration path (not implemented)

No project Supabase configuration was present. The authorized fallback is therefore local-only, and no external resource was created. To enable a shared pilot:

1. Owner creates/approves a Supabase project, data region, retention and public-report privacy policy. Supply its project URL and a server-only secret through deployment environment settings, never chat or browser bundles.
2. Add a PostgreSQL report table: UUID primary key, region/dataset version, incident type, longitude/latitude with WGS84 and region constraints, description length 5–500, severity, server-generated timestamp, status default Unverified, optional validated physical segment ID. Verification evidence, reviewer identity and status-change history belong in separate restricted audit fields/tables. Do not import illustrative seeds as observations.
3. Enable row-level security and deny all anonymous/authenticated direct writes to status/reviewer/evidence. Anonymous users must not promote reports or read private moderation metadata. Use a server submission endpoint that allowlists fields, enforces bounds/size/rate limits independently of the browser, always inserts Unverified, and never accepts user-supplied timestamps/status.
4. Add authenticated reviewer roles and audited transitions: Unverified → Under review → Verified/Rejected; Verified → Resolved. Verified needs documented reviewer evidence and expiry/freshness rules before affecting routing. Human approval of policy is required before activating this mode.
5. Expose only sanitized public fields from a read endpoint. Test RLS bypass attempts, status spoofing, abuse limits, stale closure expiry and concurrent writes against an isolated database. Replace the adapter only after these checks pass; retain local fallback as explicitly separate data.

Credentials alone do not enable shared storage in this version: the server adapter and moderation policy still need implementation. No unused cloud dependencies or fake API endpoints are included. Photo uploads require separate MIME/content/size validation, private storage rules and privacy review. Address geocoding is deferred pending a suitable provider, attribution/privacy and enforceable usage policy; coordinate entry and geolocation work without a search service.

## Priorities and stop conditions

P0 is the real graph → editable hazards → reroute → separate local report workflow. P1 already includes filters, marker dragging, swap, coordinate entry, explicit geolocation and guarded exploratory routing. Remaining P1: shared server persistence and policy-compliant geocoding. P2: uploads, moderator UI, official feeds and extra cities.

Stop before claiming shared reports, trusted verification or live hazards without a working backend and audited provenance. Stop before publishing, creating cloud resources or changing repository settings without owner approval. Preserve the frozen graph and organizer files. Fix failed route-integrity/safety tests before adding optional features.

Implementation references for a future shared adapter: [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security) and [server-side API keys](https://supabase.com/docs/guides/getting-started/api-keys). Privileged keys bypass database row policies, so server authorization and validation remain necessary. Revoke unnecessary direct table grants as well as enabling RLS. These references informed the migration plan; no database has been provisioned or tested.
