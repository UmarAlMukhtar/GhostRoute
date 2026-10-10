import type { RoadGraph, RoadGeoJSON } from './types.ts';
import { record, text } from './validate.ts';

/** Lossless transport: one canonical geometry per physical segment, including every OSM tag. */
export function packDataset(graph: RoadGraph, roads: RoadGeoJSON) {
  return {
    format: 'ghostroute-segments-v1',
    version: graph.version,
    nodes: Object.values(graph.nodes).map((n) => [n.id, n.coordinate]),
    segments: roads.features.map((f) => [
      f.properties.segmentId,
      f.properties.osmWayId,
      f.geometry.coordinates,
      f.properties.tags,
      ...['forward', 'reverse'].map((direction) => {
        const e = graph.edges[`${f.properties.segmentId}:${direction}`];
        return e ? [e.from, e.to, e.lengthMeters] : null;
      }),
    ]),
  };
}

/** Expand unknown transport before the existing full graph and renderer validators. */
export function unpackDataset(input: unknown) {
  const raw = record(input, 'dataset');
  if (
    raw.format !== 'ghostroute-segments-v1' ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.segments)
  )
    throw new Error('dataset: unsupported format');
  const nodes: Record<string, unknown> = {},
    edges: Record<string, unknown> = {},
    outgoing: Record<string, string[]> = {};
  for (const n of raw.nodes) {
    if (!Array.isArray(n) || n.length !== 2)
      throw new Error('dataset: invalid node');
    const id = text(n[0], 'node ID');
    if (Object.hasOwn(nodes, id)) throw new Error('dataset: duplicate node');
    nodes[id] = { id, coordinate: n[1] };
    outgoing[id] = [];
  }
  const features = [];
  const seen = new Set<string>();
  for (const s of raw.segments) {
    if (!Array.isArray(s) || s.length !== 6 || !Array.isArray(s[2]))
      throw new Error('dataset: invalid segment');
    const segmentId = text(s[0], 'segment ID');
    if (seen.has(segmentId)) throw new Error('dataset: duplicate segment');
    seen.add(segmentId);
    const edgeIds: string[] = [];
    for (const [index, direction] of [
      [4, 'forward'],
      [5, 'reverse'],
    ] as const) {
      const e: unknown = s[index];
      if (e === null) continue;
      if (!Array.isArray(e) || e.length !== 3)
        throw new Error('dataset: invalid direction');
      const from = text(e[0], 'edge from'),
        to = text(e[1], 'edge to');
      if (!Object.hasOwn(nodes, from) || !Object.hasOwn(nodes, to))
        throw new Error('dataset: missing endpoint');
      const id = `${segmentId}:${direction}`;
      edges[id] = {
        id,
        segmentId,
        osmWayId: s[1],
        from,
        to,
        lengthMeters: e[2],
        geometry: {
          type: 'LineString',
          coordinates: direction === 'forward' ? s[2] : [...s[2]].reverse(),
        },
      };
      outgoing[from].push(id);
      edgeIds.push(id);
    }
    if (!edgeIds.length) throw new Error('dataset: segment without directions');
    features.push({
      type: 'Feature',
      id: segmentId,
      geometry: { type: 'LineString', coordinates: s[2] },
      properties: { segmentId, osmWayId: s[1], tags: s[3], edgeIds },
    });
  }
  for (const ids of Object.values(outgoing)) ids.sort();
  return {
    graph: { version: raw.version, nodes, edges, outgoing },
    roads: { type: 'FeatureCollection', features },
  };
}
