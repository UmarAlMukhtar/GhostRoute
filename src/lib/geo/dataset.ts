import { connectedComponents } from './connectivity.ts';
import { point, record, text, validateGraph } from './validate.ts';

/** Cross-check graph/renderer agreement and the MVP's geographic and size budgets. */
export function validateDataset(
  graphInput: unknown,
  roadsInput: unknown,
  bounds: [number, number, number, number],
) {
  const graph = validateGraph(graphInput),
    roads = record(roadsInput, 'roads');
  const [west, south, east, north] = bounds;
  point([west, south], 'bounds southwest');
  point([east, north], 'bounds northeast');
  if (west >= east || south >= north)
    throw new Error('bounds: inverted extent');
  const nodes = Object.values(graph.nodes),
    edges = Object.values(graph.edges);
  if (nodes.length > 100000 || edges.length > 250000)
    throw new Error('Dataset exceeds graph size budget');
  const runtimeBytes = new TextEncoder().encode(
    JSON.stringify(graphInput) + '\n' + JSON.stringify(roadsInput) + '\n',
  ).length;
  if (runtimeBytes > 100_000_000)
    throw new Error('Dataset exceeds 100 MB runtime budget');
  for (const node of nodes) {
    const [x, y] = node.coordinate;
    if (x < west || x > east || y < south || y > north)
      throw new Error(`node ${node.id}: outside dataset bounds`);
  }
  if (roads.type !== 'FeatureCollection' || !Array.isArray(roads.features))
    throw new Error('roads: expected FeatureCollection');
  const segments = new Map<string, string[]>();
  for (const e of edges) {
    const ids = segments.get(e.segmentId) ?? [];
    ids.push(e.id);
    segments.set(e.segmentId, ids);
  }
  const seen = new Set<string>();
  for (const value of roads.features) {
    const f = record(value, 'road feature'),
      p = record(f.properties, 'road properties');
    const id = text(p.segmentId, 'road segmentId');
    if (
      f.type !== 'Feature' ||
      f.id !== id ||
      seen.has(id) ||
      !segments.has(id)
    )
      throw new Error(`road ${id}: duplicate, unknown or mismatched feature`);
    seen.add(id);
    const ids = segments.get(id)!.sort();
    if (
      !Array.isArray(p.edgeIds) ||
      JSON.stringify([...p.edgeIds].sort()) !== JSON.stringify(ids)
    )
      throw new Error(`road ${id}: directed edge mapping mismatch`);
    const edge = graph.edges[ids[0]];
    if (p.osmWayId !== edge.osmWayId)
      throw new Error(`road ${id}: OSM source mismatch`);
    const geometry = record(f.geometry, `road ${id} geometry`);
    const coordinates = edge.id.endsWith(':forward')
      ? edge.geometry.coordinates
      : [...edge.geometry.coordinates].reverse();
    if (
      geometry.type !== 'LineString' ||
      JSON.stringify(geometry.coordinates) !== JSON.stringify(coordinates)
    )
      throw new Error(`road ${id}: geometry differs from graph`);
    for (const [key, value] of Object.entries(
      record(p.tags, `road ${id} tags`),
    ))
      text(value, `road ${id} tag ${key}`);
  }
  if (seen.size !== segments.size)
    throw new Error('roads: missing physical segments');
  // Parallel OSM ways may be legitimate. Report duplicate endpoints rather than merging identities.
  const pairs = new Map<string, string[]>();
  for (const ids of segments.values()) {
    const e = graph.edges[ids[0]],
      key = [e.from, e.to].sort().join(':');
    const matches = pairs.get(key) ?? [];
    matches.push(e.segmentId);
    pairs.set(key, matches);
  }
  return {
    nodeCount: nodes.length,
    directedEdgeCount: edges.length,
    segmentCount: segments.size,
    runtimeBytes,
    componentSizes: connectedComponents(graph).map((c) => c.length),
    oneWaySegmentCount: [...segments.values()].filter((ids) => ids.length === 1)
      .length,
    parallelSegmentCandidates: [...pairs.values()].filter(
      (ids) => ids.length > 1,
    ),
    bounds: [
      nodes.reduce((min, n) => Math.min(min, n.coordinate[0]), Infinity),
      nodes.reduce((min, n) => Math.min(min, n.coordinate[1]), Infinity),
      nodes.reduce((max, n) => Math.max(max, n.coordinate[0]), -Infinity),
      nodes.reduce((max, n) => Math.max(max, n.coordinate[1]), -Infinity),
    ],
  };
}
