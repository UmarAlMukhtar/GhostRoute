import type { RoadGraph } from './types.ts';

/** Weak components for reporting; never implies directed reachability. */
export function connectedComponents(graph: RoadGraph): string[][] {
  const neighbors = new Map(
    Object.keys(graph.nodes).map((id) => [id, new Set<string>()]),
  );
  for (const e of Object.values(graph.edges)) {
    neighbors.get(e.from)!.add(e.to);
    neighbors.get(e.to)!.add(e.from);
  }
  const seen = new Set<string>(),
    components: string[][] = [];
  for (const id of Object.keys(graph.nodes).sort()) {
    if (seen.has(id)) continue;
    const queue = [id];
    seen.add(id);
    for (let i = 0; i < queue.length; i++)
      for (const next of neighbors.get(queue[i])!) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    components.push(queue.sort());
  }
  return components.sort(
    (a, b) => b.length - a.length || a[0].localeCompare(b[0], 'en'),
  );
}

/** Validation-only BFS: proves a directed path, NOT a shortest-distance route. */
export function findPath(
  graph: RoadGraph,
  origin: string,
  destination: string,
  blockedSegments: ReadonlySet<string> = new Set(),
): string[] | null {
  if (
    !Object.hasOwn(graph.nodes, origin) ||
    !Object.hasOwn(graph.nodes, destination)
  )
    throw new Error('Path validation: unknown endpoint');
  const queue = [origin],
    seen = new Set([origin]),
    previous = new Map<string, string>();
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current === destination) {
      const path: string[] = [];
      for (let n = destination; n !== origin;) {
        const id = previous.get(n)!;
        path.push(id);
        n = graph.edges[id].from;
      }
      return path.reverse();
    }
    for (const id of graph.outgoing[current]) {
      const edge = graph.edges[id];
      if (blockedSegments.has(edge.segmentId) || seen.has(edge.to)) continue;
      seen.add(edge.to);
      previous.set(edge.to, id);
      queue.push(edge.to);
    }
  }
  return null;
}
