# Security and safety policy

## Scope

GhostRoute is a hackathon simulation, not an operational emergency navigation service. There is no established security support SLA; the current development branch is the only maintained version. Hazards, destinations and route availability must not be presented as verified live safety information. Do not use this project to make real evacuation decisions.

## Responsible reporting

Do not disclose secrets, personal locations or exploit details in a public issue. If GitHub offers **Security → Report a vulnerability** for this repository, use that private channel. Its availability has not been verified and this task does not enable repository settings. Otherwise contact repository owner [UmarAlMukhtar](https://github.com/UmarAlMukhtar) through a private contact method they publish, or request a private reporting channel in a public issue containing no sensitive details. At the event, a private in-person report to the project maintainer is also suitable. A dedicated private email/reporting channel remains a maintainer action; no address or response SLA is invented here.

Include affected commit/version, reproduction steps, impact, a minimal sanitized example and any mitigation. Coordinate disclosure after acknowledgement; maintainers should confirm receipt, assess severity, prepare a fix and credit the reporter with consent. Never test against live emergency services or other people's data.

## Development protections

Validate geographic JSON at the load boundary; reject malformed coordinates, dangling edges, unsafe weights and invalid polygons. Keep dependencies pinned, do not execute data content, and render external labels as text rather than HTML. Never put secrets in `NEXT_PUBLIC_*`, source files, logs or `.env.example`. No auth, database or external incident reporting exists in Phase 0.

## Safety limitations

A passing graph test proves only model behavior. Unblocked roads can be physically unsafe; map data may be stale; synthetic destinations have no verified capacity, accessibility or opening status. A 2D polygon ignores hydrology and structural damage. Preserve the disclaimer and fail explicitly on unavailable/malformed data; do not substitute imaginary successful routes. Report dangerous or misleading safety wording as a correctness issue, without exposing personal information.
