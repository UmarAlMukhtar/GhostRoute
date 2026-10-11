import { cooperatively, synchronously } from '../geo/cooperative.ts';
import { booleanIntersects } from '@turf/boolean-intersects';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { booleanValid } from '@turf/boolean-valid';
import { kinks } from '@turf/kinks';
import type { FeatureCollection, LineString, Polygon } from 'geojson';
import { point, record, text } from '../geo/validate.ts';
import type { DisasterZone, RoadGraph, RoadNode } from '../geo/types.ts';

function polygon(input: unknown): Polygon {
  if (!Array.isArray(input) || !input.length)
    throw new Error('Polygon needs rings');
  const coordinates = input.map((ring: unknown) => {
    if (!Array.isArray(ring) || ring.length < 4)
      throw new Error('Ring needs at least four coordinates');
    const points = ring.map((p) => point(p, 'Flood ring'));
    if (String(points[0]) !== String(points.at(-1)))
      throw new Error('Flood ring must be closed');
    const [x, y] = points[0];
    const area = points
      .slice(1)
      .reduce(
        (sum, p, i) =>
          sum +
          (points[i][0] - x) * (p[1] - y) -
          (p[0] - x) * (points[i][1] - y),
        0,
      );
    if (
      !area ||
      points.some((p, i) => i > 0 && String(p) === String(points[i - 1]))
    )
      throw new Error('Degenerate flood ring');
    return points;
  });
  const result: Polygon = { type: 'Polygon', coordinates };
  if (!booleanValid(result) || kinks(result).features.length)
    throw new Error('Invalid or self-intersecting flood polygon');
  const shell: Polygon = { type: 'Polygon', coordinates: [coordinates[0]] };
  for (let i = 1; i < coordinates.length; i++) {
    const hole = coordinates[i];
    if (
      !booleanPointInPolygon(hole[0], shell, { ignoreBoundary: true }) ||
      booleanIntersects(
        { type: 'LineString', coordinates: hole },
        { type: 'LineString', coordinates: coordinates[0] },
      )
    )
      throw new Error('Flood hole must be strictly inside its shell');
    for (let j = 1; j < i; j++) {
      if (
        booleanIntersects(
          { type: 'Polygon', coordinates: [hole] },
          { type: 'Polygon', coordinates: [coordinates[j]] },
        )
      )
        throw new Error('Flood holes must not overlap');
    }
  }
  return result;
}
function parseZones(input: unknown): DisasterZone[] {
  if (!Array.isArray(input)) throw new Error('Flood zones must be an array');
  const ids = new Set<string>();
  return input.map((value) => {
    const zone = record(value, 'Flood zone');
    const id = text(zone.id, 'Flood zone ID');
    if (ids.has(id)) throw new Error('Duplicate flood zone ID');
    ids.add(id);
    if (
      (zone.kind !== 'flood' &&
        zone.kind !== 'landslide' &&
        zone.kind !== 'fire') ||
      zone.simulated !== true
    )
      throw new Error(
        'Only explicitly simulated flood, landslide or fire zones are supported',
      );
    const raw = record(zone.geometry, 'Flood geometry');
    let geometry: DisasterZone['geometry'];
    if (raw.type === 'Polygon') geometry = polygon(raw.coordinates);
    else if (
      raw.type === 'MultiPolygon' &&
      Array.isArray(raw.coordinates) &&
      raw.coordinates.length
    ) {
      const polygons = raw.coordinates.map(polygon);
      polygons.forEach((p, i) => {
        if (polygons.slice(0, i).some((other) => booleanIntersects(p, other)))
          throw new Error('MultiPolygon components must be disjoint');
      });
      geometry = {
        type: 'MultiPolygon',
        coordinates: polygons.map((p) => p.coordinates),
      };
    } else throw new Error('Expected nonempty Polygon or MultiPolygon');
    return {
      id,
      kind: zone.kind,
      simulated: true,
      geometry,
    };
  });
}
const bounds = (points: number[][]) => [
  Math.min(...points.map((p) => p[0])),
  Math.min(...points.map((p) => p[1])),
  Math.max(...points.map((p) => p[0])),
  Math.max(...points.map((p) => p[1])),
];
const overlaps = (a: number[], b: number[]) =>
  a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
export interface FloodSnapshot {
  status: 'ready';
  blockedSegmentIds: ReadonlySet<string>;
  blockedEdgeIds: ReadonlySet<string>;
  blockedNodeIds: ReadonlySet<string>;
  hazards: FeatureCollection<DisasterZone['geometry']>;
  blockedRoads: FeatureCollection<LineString>;
  metadata: {
    graphVersion: string;
    zoneIds: string[];
    segmentCount: number;
    edgeCount: number;
    nodeCount: number;
  };
}
export type FloodResult = FloodSnapshot | { status: 'invalid'; reason: string };
/** Call once with the already validated graph. All intersections use WGS84 geometry. */
export function createFloodEngine(graph: RoadGraph) {
  return synchronously(floodEngineSteps(graph));
}

export function createFloodEngineAsync(graph: RoadGraph) {
  return cooperatively(floodEngineSteps(graph));
}

function* floodEngineSteps(graph: RoadGraph) {
  let batch = 0;
  const segments = new Map<
    string,
    { geometry: LineString; bounds: number[]; edgeIds: string[] }
  >();
  for (const edge of Object.values(graph.edges).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const segment = segments.get(edge.segmentId);
    if (segment) segment.edgeIds.push(edge.id);
    else
      segments.set(edge.segmentId, {
        geometry: structuredClone(edge.geometry),
        bounds: bounds(edge.geometry.coordinates),
        edgeIds: [edge.id],
      });
    if (++batch % 512 === 0) yield;
  }
  const nodes: RoadNode[] = [];
  for (const node of Object.values(graph.nodes)) {
    nodes.push({ id: node.id, coordinate: [...node.coordinate] });
    if (++batch % 512 === 0) yield;
  }
  const graphVersion = graph.version;
  return {
    evaluate(
      input: unknown,
      closedSegments: ReadonlySet<string> = new Set(),
    ): FloodResult {
      try {
        for (const id of closedSegments)
          if (!segments.has(id))
            throw new Error(`Unknown physical segment: ${id}`);
        const zones = parseZones(input).sort((a, b) =>
          a.id.localeCompare(b.id),
        );
        const prepared = zones.map((z) => ({
          geometry: z.geometry,
          bounds: bounds(
            z.geometry.type === 'Polygon'
              ? z.geometry.coordinates.flat()
              : z.geometry.coordinates.flat(2),
          ),
        }));
        const blockedSegmentIds = new Set<string>(),
          blockedEdgeIds = new Set<string>(),
          blockedNodeIds = new Set<string>();
        const blockedRoads: FeatureCollection<LineString> = {
          type: 'FeatureCollection',
          features: [],
        };
        for (const [id, segment] of segments) {
          if (
            !closedSegments.has(id) &&
            !prepared.some(
              (z) =>
                overlaps(segment.bounds, z.bounds) &&
                booleanIntersects(segment.geometry, z.geometry),
            )
          )
            continue;
          blockedSegmentIds.add(id);
          segment.edgeIds.forEach((edge) => blockedEdgeIds.add(edge));
          blockedRoads.features.push({
            type: 'Feature',
            properties: { segmentId: id },
            geometry: structuredClone(segment.geometry),
          });
        }
        for (const node of nodes) {
          if (
            prepared.some(
              (z) =>
                overlaps([...node.coordinate, ...node.coordinate], z.bounds) &&
                booleanPointInPolygon(node.coordinate, z.geometry),
            )
          )
            blockedNodeIds.add(node.id);
        }
        return {
          status: 'ready',
          blockedSegmentIds,
          blockedEdgeIds,
          blockedNodeIds,
          blockedRoads,
          hazards: {
            type: 'FeatureCollection',
            features: zones.map((z) => ({
              type: 'Feature',
              properties: { id: z.id, kind: z.kind, simulated: true },
              geometry: z.geometry,
            })),
          },
          metadata: {
            graphVersion,
            zoneIds: zones.map((z) => z.id),
            segmentCount: blockedSegmentIds.size,
            edgeCount: blockedEdgeIds.size,
            nodeCount: blockedNodeIds.size,
          },
        };
      } catch (error) {
        return {
          status: 'invalid',
          reason:
            error instanceof Error ? error.message : 'Invalid flood geometry',
        };
      }
    },
  };
}
