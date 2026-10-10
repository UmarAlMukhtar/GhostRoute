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
    raw.places.length > 100
  )
    throw new Error('Invalid place catalog size');
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
      const route = data.router.findRoute(
        role === 'origin'
          ? { originNodeId: nodeId, destinationNodeId: anchor }
          : { originNodeId: anchor, destinationNodeId: nodeId },
      );
      if (route.status !== 'found')
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
  return places.filter((p) => {
    const haystack = normalize(
      [p.name, p.locality, p.category, ...p.aliases].join(' '),
    );
    return tokens.every((token) => haystack.includes(token));
  });
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
