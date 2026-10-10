import type { RoadGraph, RoadGeoJSON, GeoPoint } from './types.ts';
import { distanceMeters } from './distance.ts';
import { point, record, text, validateGraph } from './validate.ts';

const highways = new Set([
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'pedestrian',
  'footway',
  'path',
  'steps',
  'primary_link',
  'secondary_link',
  'tertiary_link',
]);
const allowed = new Set(['yes', 'designated', 'permissive']);
type Tags = Record<string, string>;
type OsmNode = { id: string; coordinate: GeoPoint; tags: Tags };
type OsmWay = { id: string; nodes: string[]; tags: Tags };
const order = <T extends { id: string }>(a: T, b: T) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function osmId(value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    return String(value);
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) return value;
  throw new Error(`Invalid OSM ID: ${String(value)}`);
}
function tags(value: unknown): Tags {
  return Object.fromEntries(
    Object.entries(record(value ?? {}, 'OSM tags'))
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => [k, text(v, `tag ${k}`)]),
  );
}
function restriction(t: Tags): string | null {
  if (
    Object.keys(t).some((k) =>
      /^(access|foot|oneway)(:.*)?:conditional$/.test(k),
    )
  )
    return 'conditional access/direction';
  if (t.barrier && t.barrier !== 'no') return 'unhandled barrier';
  if (t.foot && !allowed.has(t.foot)) return 'restricted foot access';
  if (!t.foot && t.access && !allowed.has(t.access))
    return 'restricted general access';
  return null;
}

/** Pure conversion of OSM node/way JSON. Input order never determines topology. */
export function convertOsm(
  input: unknown,
  version: string,
): {
  graph: RoadGraph;
  roads: RoadGeoJSON;
  exclusions: { id: string; reason: string }[];
} {
  const raw = record(input, 'OSM source');
  if (raw.remark) throw new Error(`OSM source error: ${String(raw.remark)}`);
  if (!Array.isArray(raw.elements) || !raw.elements.length)
    throw new Error('OSM source: empty elements');
  const nodes = new Map<string, OsmNode>(),
    ways: OsmWay[] = [],
    seen = new Set<string>(),
    restrictedWays = new Set<string>();
  for (const value of raw.elements) {
    const e = record(value, 'OSM element'),
      id = osmId(e.id),
      t = tags(e.tags);
    if (!['node', 'way', 'relation'].includes(String(e.type)))
      throw new Error(`OSM ${id}: unsupported element type`);
    const key = `${e.type}:${id}`;
    if (seen.has(key)) throw new Error(`Duplicate OSM ${key}`);
    seen.add(key);
    if (e.type === 'node')
      nodes.set(id, {
        id,
        coordinate: point([e.lon, e.lat], `OSM node ${id}`),
        tags: t,
      });
    if (e.type === 'way') {
      if (!Array.isArray(e.nodes) || e.nodes.length < 2)
        throw new Error(`OSM way ${id}: at least two node references required`);
      ways.push({ id, nodes: e.nodes.map(osmId), tags: t });
    }
    if (
      e.type === 'relation' &&
      (t['restriction:foot'] || t.type === 'restriction:foot')
    ) {
      if (!Array.isArray(e.members))
        throw new Error(`OSM relation ${id}: missing members`);
      for (const member of e.members) {
        const m = record(member, `relation ${id} member`);
        if (m.type === 'way') restrictedWays.add(osmId(m.ref));
      }
    }
  }
  const graph: RoadGraph = { version, nodes: {}, edges: {}, outgoing: {} };
  const roads: RoadGeoJSON = { type: 'FeatureCollection', features: [] },
    exclusions: { id: string; reason: string }[] = [];
  for (const way of ways.sort(order)) {
    for (const id of way.nodes)
      if (!nodes.has(id))
        throw new Error(`OSM way ${way.id}: missing node ${id}`);
    const t = way.tags;
    const reason = !highways.has(t.highway)
      ? 'unsupported highway'
      : (restriction(t) ??
        (t.motorroad === 'yes' ? 'motor road' : null) ??
        (t.conveying && t.conveying !== 'no'
          ? 'unhandled moving walkway'
          : null) ??
        (t.area === 'yes' ? 'area is not a linear road' : null) ??
        (t.construction || t.proposed ? 'construction/proposed' : null) ??
        (restrictedWays.has(way.id)
          ? 'unhandled pedestrian turn restriction'
          : null) ??
        (t['oneway:foot'] && !['yes', 'no', '-1'].includes(t['oneway:foot'])
          ? 'unsupported pedestrian direction'
          : null) ??
        (['foot:forward', 'foot:backward'].some(
          (k) =>
            t[k] && !allowed.has(t[k]) && !['no', 'private'].includes(t[k]),
        )
          ? 'unsupported directional access'
          : null) ??
        (['path', 'footway', 'steps', 'pedestrian'].includes(t.highway) &&
        t.oneway &&
        t.oneway !== 'no' &&
        !t['oneway:foot']
          ? 'ambiguous pedestrian oneway'
          : null));
    if (reason) {
      exclusions.push({ id: way.id, reason });
      continue;
    }
    const directions = ['forward', 'reverse'].filter(
      (d) =>
        (d === 'forward'
          ? t['oneway:foot'] !== '-1'
          : t['oneway:foot'] !== 'yes') &&
        !restriction({
          foot: t[d === 'forward' ? 'foot:forward' : 'foot:backward'] ?? t.foot,
          access:
            t[d === 'forward' ? 'access:forward' : 'access:backward'] ??
            t.access,
        }),
    );
    if (!directions.length) {
      exclusions.push({
        id: way.id,
        reason: 'both walking directions restricted',
      });
      continue;
    }
    for (let i = 0; i < way.nodes.length - 1; i++) {
      const a = nodes.get(way.nodes[i])!,
        b = nodes.get(way.nodes[i + 1])!;
      const segmentId = `${way.id}:${i}`;
      const nodeRestriction = restriction(a.tags) ?? restriction(b.tags);
      if (nodeRestriction) {
        exclusions.push({ id: segmentId, reason: nodeRestriction });
        continue;
      }
      const lengthMeters =
        Math.round(distanceMeters(a.coordinate, b.coordinate) * 1000) / 1000;
      if (lengthMeters <= 0)
        throw new Error(`OSM segment ${segmentId}: zero length`);
      const edgeIds: string[] = [];
      for (const direction of directions) {
        const [from, to] = direction === 'forward' ? [a, b] : [b, a];
        const id = `${segmentId}:${direction}`;
        for (const n of [from, to]) {
          graph.nodes[n.id] = { id: n.id, coordinate: n.coordinate };
          graph.outgoing[n.id] ??= [];
        }
        graph.edges[id] = {
          id,
          segmentId,
          from: from.id,
          to: to.id,
          lengthMeters,
          geometry: {
            type: 'LineString',
            coordinates: [from.coordinate, to.coordinate],
          },
          osmWayId: way.id,
        };
        graph.outgoing[from.id].push(id);
        edgeIds.push(id);
      }
      roads.features.push({
        type: 'Feature',
        id: segmentId,
        properties: { segmentId, osmWayId: way.id, edgeIds, tags: t },
        geometry: {
          type: 'LineString',
          coordinates: [a.coordinate, b.coordinate],
        },
      });
    }
  }
  for (const ids of Object.values(graph.outgoing)) ids.sort();
  return { graph: validateGraph(graph), roads, exclusions };
}
