import type { RouteResult } from '../geo/types';
import type { Place, MapData } from '../map/data';
import type { Selection } from '../map/selection';

/**
 * Demonstration-only relief points. These labels, facilities and capacity are
 * illustrative: they are not a live shelter directory or an emergency service.
 */
const shelterDefinitions = [
  {
    placeId: 'maharajas',
    name: 'Park Avenue community relief point',
    facilities: ['Drinking water', 'First-aid desk', 'Charging point'],
    capacityLabel: 'Illustrative capacity: 120 people',
  },
  {
    placeId: 'marine-drive',
    name: 'Marine Drive assembly point',
    facilities: ['Water', 'Toilets', 'Family help desk'],
    capacityLabel: 'Illustrative capacity: 80 people',
  },
  {
    placeId: 'high-court',
    name: 'High Court community relief point',
    facilities: ['First-aid desk', 'Charging point', 'Information desk'],
    capacityLabel: 'Illustrative capacity: 60 people',
  },
] as const;

export interface EvacuationShelter extends Place {
  id: string;
  name: string;
  facilities: readonly string[];
  capacityLabel: string;
  route: Extract<RouteResult, { status: 'found' }>;
}

export function findReachableShelters(
  data: MapData,
  origin: Selection,
  closures: {
    blockedNodeIds?: ReadonlySet<string>;
    blockedSegmentIds?: ReadonlySet<string>;
  },
): EvacuationShelter[] {
  const places = new Map(
    (data.searchPlaces ?? []).map((place) => [place.id, place]),
  );
  return shelterDefinitions
    .flatMap((definition) => {
      const place = places.get(definition.placeId);
      if (!place) return [];
      const route = data.router.findRoute({
        originNodeId: origin.nodeId,
        destinationNodeId: place.nodeId,
        ...closures,
      });
      if (route.status !== 'found') return [];
      return [
        {
          id: definition.placeId,
          nodeId: place.nodeId,
          label: definition.name,
          coordinate: place.coordinate,
          name: definition.name,
          facilities: definition.facilities,
          capacityLabel: definition.capacityLabel,
          route,
        },
      ];
    })
    .sort((a, b) => a.route.distanceMeters - b.route.distanceMeters);
}
