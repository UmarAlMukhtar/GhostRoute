import type { RoadGeoJSON } from '../geo/types';
import { point, record, text, validateGraph } from '../geo/validate';
import type { MapData } from './data';

export function parseMapAssets(
  graphInput: unknown,
  roadsInput: unknown,
  fixtureInput: unknown,
): Omit<MapData, 'router' | 'engine'> {
  const graph = validateGraph(graphInput);
  const raw = record(roadsInput, 'roads');
  if (raw.type !== 'FeatureCollection' || !Array.isArray(raw.features))
    throw new Error('roads: expected FeatureCollection');
  const seen = new Set<string>();
  const roads: RoadGeoJSON = {
    type: 'FeatureCollection',
    features: raw.features.map((value) => {
      const f = record(value, 'road'),
        p = record(f.properties, 'road properties');
      const segmentId = text(p.segmentId, 'segmentId');
      const edge =
        graph.edges[`${segmentId}:forward`] ??
        graph.edges[`${segmentId}:reverse`];
      if (
        f.type !== 'Feature' ||
        f.id !== segmentId ||
        seen.has(segmentId) ||
        !edge ||
        p.osmWayId !== edge.osmWayId
      )
        throw new Error('roads: invalid segment mapping');
      seen.add(segmentId);
      const geometry = record(f.geometry, 'road geometry');
      const coordinates = edge.id.endsWith(':forward')
        ? edge.geometry.coordinates
        : [...edge.geometry.coordinates].reverse();
      if (
        geometry.type !== 'LineString' ||
        JSON.stringify(geometry.coordinates) !== JSON.stringify(coordinates)
      )
        throw new Error('roads: geometry differs from graph');
      const edgeIds = [`${segmentId}:forward`, `${segmentId}:reverse`].filter(
        (id) => graph.edges[id],
      );
      if (
        !Array.isArray(p.edgeIds) ||
        JSON.stringify([...p.edgeIds].sort()) !== JSON.stringify(edgeIds)
      )
        throw new Error('roads: invalid edge IDs');
      const tags = Object.fromEntries(
        Object.entries(record(p.tags, 'tags')).map(([k, v]) => [
          k,
          text(v, 'tag'),
        ]),
      );
      return {
        type: 'Feature',
        id: segmentId,
        geometry: { type: 'LineString', coordinates },
        properties: { segmentId, osmWayId: edge.osmWayId, edgeIds, tags },
      };
    }),
  };
  if (
    seen.size !==
    new Set(Object.values(graph.edges).map((e) => e.segmentId)).size
  )
    throw new Error('roads: missing segments');
  const fixture = record(fixtureInput, 'demo fixture');
  if (fixture.graphVersion !== graph.version)
    throw new Error('Demo fixture graph version mismatch');
  const places = ['origin', 'destination'].map((key) => {
    const p = record(fixture[key], key),
      nodeId = text(p.nodeId, 'nodeId');
    const coordinate = point(p.coordinate, 'preset coordinate');
    if (
      !Object.hasOwn(graph.nodes, nodeId) ||
      JSON.stringify(coordinate) !==
        JSON.stringify(graph.nodes[nodeId].coordinate)
    )
      throw new Error('Invalid demo endpoint');
    return { nodeId, coordinate, label: text(p.label, 'preset label') };
  });
  const coordinates = Object.values(graph.nodes).map((n) => n.coordinate);
  return {
    graph,
    roads,
    places,
    bounds: [
      coordinates.reduce((min, p) => Math.min(min, p[0]), Infinity),
      coordinates.reduce((min, p) => Math.min(min, p[1]), Infinity),
      coordinates.reduce((max, p) => Math.max(max, p[0]), -Infinity),
      coordinates.reduce((max, p) => Math.max(max, p[1]), -Infinity),
    ],
  };
}
