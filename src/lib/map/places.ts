import type { MapData } from './data.ts';
import type { GeoPoint } from '../geo/types.ts';
import { point, record, text } from '../geo/validate.ts';
import { withinCoverage } from '../simulation/hazards.ts';
import {
  selectCoordinate,
  type Role,
  type Selection,
  type SelectionAction,
} from './selection.ts';
export const placeCategories = [
  'Waterfront',
  'Road',
  'Railway station',
  'College',
  'Hospital',
  'Shopping street',
  'Junction',
  'Landmark',
  'Locality',
] as const;
export interface SearchPlace {
  id: string;
  name: string;
  locality: string;
  category: (typeof placeCategories)[number];
  coordinate: GeoPoint;
  nodeId: string;
  snapMeters: number;
  aliases: string[];
  popular?: boolean;
}
/** Validate the small gazetteer against the retained router once per dataset load. */
export function validatePlaces(
  input: unknown,
  data: Pick<MapData, 'graph' | 'router' | 'bounds'>,
): SearchPlace[] {
  const raw = record(input, 'Gazetteer');
  if (raw.graphVersion !== data.graph.version)
    throw new Error('Place catalog does not match this road dataset');
  const anchor = text(raw.anchorNodeId, 'Gazetteer anchor');
  if (
    !Array.isArray(raw.places) ||
    !raw.places.length ||
    raw.places.length > 20000
  )
    throw new Error('Invalid place catalog size');
  const reversed = new Map(
    Object.keys(data.graph.nodes).map((id) => [id, [] as string[]]),
  );
  for (const edge of Object.values(data.graph.edges))
    reversed.get(edge.to)!.push(edge.from);
  const reachable = (reverse: boolean) => {
    const seen = new Set([anchor]),
      queue = [anchor];
    for (let i = 0; i < queue.length; i++) {
      const neighbors = reverse
        ? (reversed.get(queue[i]) ?? [])
        : (data.graph.outgoing[queue[i]] ?? []).map(
            (id) => data.graph.edges[id].to,
          );
      for (const id of neighbors)
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
    }
    return seen;
  };
  const fromAnchor = reachable(false),
    toAnchor = reachable(true);
  const ids = new Set<string>();
  return raw.places.map((value) => {
    const p = record(value, 'Place'),
      id = text(p.id, 'Place ID');
    if (ids.has(id)) throw new Error('Duplicate place ID');
    ids.add(id);
    const coordinate = point(p.coordinate, 'Place coordinate');
    if (!withinCoverage(coordinate, data.bounds))
      throw new Error(`Place ${id} is outside the Ernakulam demo network`);
    if (!placeCategories.includes(p.category as SearchPlace['category']))
      throw new Error(`Invalid place category: ${id}`);
    if (
      !Array.isArray(p.aliases) ||
      !p.aliases.every((a) => typeof a === 'string')
    )
      throw new Error('Invalid place aliases');
    const nodeId = text(p.nodeId, 'Snapped place node');
    if (
      typeof p.snapMeters !== 'number' ||
      !Number.isFinite(p.snapMeters) ||
      p.snapMeters < 0
    )
      throw new Error('Invalid snap distance');
    for (const role of ['origin', 'destination'] as const) {
      // Never search for a farther connected node when the nearest point is disconnected.
      const snap = data.router.snap(coordinate, {
        role,
        maxDistanceMeters: 100,
      });
      if (
        snap.status !== 'snapped' ||
        snap.node.id !== nodeId ||
        Math.abs(snap.distanceMeters - p.snapMeters) > 0.01
      )
        throw new Error(`Place ${id} no longer matches its verified road node`);
      if (!(role === 'origin' ? toAnchor : fromAnchor).has(nodeId))
        throw new Error(`Place ${id} is disconnected from the demo network`);
    }
    return {
      id,
      name: text(p.name, 'Place name'),
      locality: text(p.locality, 'Place locality'),
      category: p.category as SearchPlace['category'],
      coordinate,
      nodeId,
      snapMeters: p.snapMeters,
      aliases: p.aliases,
      popular: p.popular !== false,
    };
  });
}
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function filterPlaces(places: readonly SearchPlace[], query: string) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length)
    return places.filter((p) => p.popular !== false).slice(0, 8);
  const normalizedQuery = normalize(query);
  return places
    .filter((p) => {
      const haystack = normalize(
        [p.name, p.locality, p.category, ...p.aliases].join(' '),
      );
      return tokens.every((token) => haystack.includes(token));
    })
    .sort((a, b) => {
      const score = (p: SearchPlace) =>
        normalize(p.name) === normalizedQuery
          ? 0
          : p.aliases.some((alias) => normalize(alias) === normalizedQuery)
            ? 1
            : normalize(p.name).startsWith(normalizedQuery)
              ? 2
              : normalize(p.name).includes(normalizedQuery)
                ? 3
                : 4;
      return score(a) - score(b) || a.name.localeCompare(b.name);
    })
    .slice(0, 8);
}
export function choosePlace(
  data: MapData,
  place: SearchPlace,
  role: Role,
  other: Selection | null,
): SelectionAction {
  const selection = selectCoordinate(data, place.coordinate, role);
  if (selection.type !== 'select') return selection;
  if (selection.selection.nodeId !== place.nodeId)
    return {
      type: 'error',
      message:
        'This place no longer matches its verified road node. Try selecting a point on the Ernakulam demo network.',
    };
  if (other) {
    const route = data.router.findRoute(
      role === 'origin'
        ? { originNodeId: place.nodeId, destinationNodeId: other.nodeId }
        : { originNodeId: other.nodeId, destinationNodeId: place.nodeId },
    );
    if (route.status !== 'found')
      return {
        type: 'error',
        message:
          'This place cannot connect to your other endpoint in the Ernakulam demo network. Change or clear the other endpoint; no distant replacement was selected.',
      };
  }
  return {
    ...selection,
    selection: { ...selection.selection, label: place.name },
  };
}

export function coordinatePlace(
  query: string,
  data: MapData,
): SearchPlace | null {
  const match = query
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const coordinate: GeoPoint = [Number(match[2]), Number(match[1])];
  const action = selectCoordinate(data, coordinate, 'origin');
  if (action.type !== 'select')
    return {
      id: 'coordinates',
      name: query,
      locality: 'Outside road-network coverage',
      category: 'Landmark',
      coordinate,
      nodeId: '',
      snapMeters: 0,
      aliases: [],
    };
  return {
    id: 'coordinates',
    name: query,
    locality: 'Latitude, longitude',
    category: 'Landmark',
    coordinate,
    nodeId: action.selection.nodeId,
    snapMeters: action.selection.snapMeters ?? 0,
    aliases: [],
  };
}
