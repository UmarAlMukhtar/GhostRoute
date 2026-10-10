# Three-minute pitch — presenter-controlled Demo Mode

Target: approximately three minutes with pauses and clicks. This script has not been certified by a timed human rehearsal. Keep the safety statement and actual calculations; shorten future scope first if running long.

**0:00–0:25 · Demo Mode / regional overview**

“This is GhostRoute: navigate to safety when ordinary routes become unsafe. What you are seeing is a simulation, not emergency guidance. These are real mapped roads in central Ernakulam. Our question is simple: what happens to a route when some of those roads become unavailable?”

**0:25–0:50 · Load Hospital Road route**

“I’ll load a repeatable trip from the Park Avenue–Hospital Road junction to Jos Junction. The blue line is the shortest path through our actual road graph. Its distance is calculated from the road edges. These endpoints are demonstration locations, not verified shelters.”

Point to the displayed baseline distance.

**0:50–1:20 · Simulate Hospital Road flood**

“Now I’ll introduce an illustrative flood. Cyan shows the polygon; red shows the roads it intersects. A partial intersection blocks the whole physical segment in both directions. The original blue route stays visible for comparison. Green is the newly calculated available route. The comparison shows exactly how much farther it is.”

Point to the current blocked count and additional distance; do not recite a value if the selected endpoints differ.

**1:20–1:50 · Explore expanding flood → stage 2 → stage 3**

“Expansion is deterministic, so anyone can reproduce this demonstration. At stage two, more roads close but the best detour stays the same. At stage three, that detour changes too. This is real shortest-path recalculation, not a second line drawn for the presentation.”

**1:50–2:15 · Show unavailable route**

“Here the destination itself is flooded. GhostRoute does not invent an answer: it removes the green route and explicitly says unavailable. Blue is only the historical route. An unblocked road in this model is never a promise of real-world safety.”

**2:15–2:40 · Restore original route**

“Reset removes the simulated closures and restores the baseline. Underneath, OpenStreetMap becomes a directed graph. Turf handles geographic intersections, and a binary-heap Dijkstra algorithm finds the shortest remaining path. Codex helped us build and test the software; a language model does not generate these navigation routes.”

**2:40–3:00 · Close**

“The prototype runs its graph and scenarios locally, even when background map tiles fail. Next we would need reviewed road access, authoritative hazard provenance and verified destinations, together with emergency-service validation. GhostRoute makes the routing consequences understandable today; operational use needs that further work.”

Fallback: keep a local production server running and use its bundled road map. If graphics fail, show the actual textual outcomes/tests and identify any saved capture as prerecorded. Never claim an unverified deployment is live.
