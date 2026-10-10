import type { RoadGraph, GeoPoint } from '../../src/lib/geo/types.ts';

/** Mathematical weighted fixture, never geography for display or ingestion. */
export function routingGraph(): RoadGraph {
  const coordinates: Record<string, GeoPoint> = {
    A: [76.29, 9.98],
    B: [76.291, 9.98],
    C: [76.291, 9.981],
    D: [76.292, 9.98],
    E: [76.294, 9.983],
  };
  const graph: RoadGraph = {
    version: 'synthetic-routing-v1',
    nodes: {},
    edges: {},
    outgoing: {},
  };
  for (const [id, coordinate] of Object.entries(coordinates)) {
    graph.nodes[id] = { id, coordinate };
    graph.outgoing[id] = [];
  }
  for (const [id, from, to, lengthMeters] of [
    ['ab', 'A', 'B', 100],
    ['bd', 'B', 'D', 100],
    ['ac', 'A', 'C', 150],
    ['cd', 'C', 'D', 150],
  ] as const) {
    graph.edges[id] = {
      id,
      from,
      to,
      lengthMeters,
      segmentId: id,
      osmWayId: 'synthetic',
      geometry: {
        type: 'LineString',
        coordinates: [coordinates[from], coordinates[to]],
      },
    };
    graph.outgoing[from].push(id);
  }
  for (const ids of Object.values(graph.outgoing)) ids.sort();
  return graph;
}
