import { distanceMeters } from './distance.ts';
import type { GeoPoint, RoadEdge, RoadGraph, RoadNode } from './types.ts';

export function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label}: expected object`);
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    !value ||
    ['__proto__', 'constructor', 'prototype'].includes(value)
  )
    throw new Error(`${label}: expected nonempty safe string`);
  return value;
}
export function point(value: unknown, label: string): GeoPoint {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
    Math.abs(value[0]) > 180 ||
    Math.abs(value[1]) > 90
  )
    throw new Error(
      `${label}: invalid coordinate; expected [longitude, latitude]`,
    );
  return [value[0], value[1]];
}
const equal = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];

/** Validate unknown JSON and rebuild typed records; never trust a type assertion at load. */
export function validateGraph(input: unknown): RoadGraph {
  const raw = record(input, 'graph');
  const version = text(raw.version, 'graph.version');
  const nodes: Record<string, RoadNode> = {};
  const edges: Record<string, RoadEdge> = {};
  const outgoing: Record<string, string[]> = {};
  for (const [id, value] of Object.entries(record(raw.nodes, 'nodes'))) {
    const n = record(value, `node ${id}`);
    if (text(n.id, `node ${id}.id`) !== id)
      throw new Error(`node ${id}: ID/key mismatch`);
    nodes[id] = { id, coordinate: point(n.coordinate, `node ${id}`) };
    outgoing[id] = [];
  }
  if (!Object.keys(nodes).length) throw new Error('graph: empty nodes');
  const traversals = new Set<string>();
  const segments = new Map<string, RoadEdge>();
  for (const [id, value] of Object.entries(record(raw.edges, 'edges'))) {
    const e = record(value, `edge ${id}`);
    if (text(e.id, `edge ${id}.id`) !== id)
      throw new Error(`edge ${id}: ID/key mismatch`);
    const from = text(e.from, `${id}.from`),
      to = text(e.to, `${id}.to`);
    if (!Object.hasOwn(nodes, from) || !Object.hasOwn(nodes, to))
      throw new Error(`edge ${id}: missing endpoint`);
    if (
      from === to ||
      typeof e.lengthMeters !== 'number' ||
      !Number.isFinite(e.lengthMeters) ||
      e.lengthMeters <= 0
    )
      throw new Error(
        `edge ${id}: weight must be finite and positive; no self loops`,
      );
    const geometry = record(e.geometry, `${id}.geometry`);
    if (
      geometry.type !== 'LineString' ||
      !Array.isArray(geometry.coordinates) ||
      geometry.coordinates.length < 2
    )
      throw new Error(`edge ${id}: invalid LineString`);
    const coordinates = geometry.coordinates.map((p) =>
      point(p, `${id}.geometry`),
    );
    if (
      !equal(coordinates[0], nodes[from].coordinate) ||
      !equal(coordinates.at(-1)!, nodes[to].coordinate)
    )
      throw new Error(`edge ${id}: geometry endpoint mismatch`);
    let measured = 0;
    for (let i = 1; i < coordinates.length; i++)
      measured += distanceMeters(coordinates[i - 1], coordinates[i]);
    if (Math.abs(measured - e.lengthMeters) > 0.01)
      throw new Error(`edge ${id}: weight does not match geographic length`);
    const segmentId = text(e.segmentId, `${id}.segmentId`),
      osmWayId = text(e.osmWayId, `${id}.osmWayId`);
    if (
      !/^\d+:\d+$/.test(segmentId) ||
      segmentId.split(':')[0] !== osmWayId ||
      ![`${segmentId}:forward`, `${segmentId}:reverse`].includes(id)
    )
      throw new Error(`edge ${id}: invalid source/direction ID`);
    const traversal = `${segmentId}:${from}:${to}`;
    if (traversals.has(traversal))
      throw new Error(`edge ${id}: duplicate traversal`);
    traversals.add(traversal);
    const other = segments.get(segmentId);
    if (
      other &&
      (other.from !== to ||
        other.to !== from ||
        JSON.stringify(other.geometry.coordinates) !==
          JSON.stringify([...coordinates].reverse()))
    )
      throw new Error(`edge ${id}: inconsistent reverse direction`);
    const edge: RoadEdge = {
      id,
      segmentId,
      from,
      to,
      lengthMeters: e.lengthMeters,
      geometry: { type: 'LineString', coordinates },
      osmWayId,
    };
    segments.set(segmentId, edge);
    edges[id] = edge;
    outgoing[from].push(id);
  }
  if (!Object.keys(edges).length) throw new Error('graph: empty edges');
  const adjacency = record(raw.outgoing, 'outgoing');
  if (Object.keys(adjacency).length !== Object.keys(nodes).length)
    throw new Error('outgoing: node keys mismatch');
  for (const id of Object.keys(nodes)) {
    outgoing[id].sort();
    if (JSON.stringify(adjacency[id]) !== JSON.stringify(outgoing[id]))
      throw new Error(
        `outgoing ${id}: missing, duplicate, unsorted or wrong-direction edges`,
      );
  }
  return { version, nodes, edges, outgoing };
}
