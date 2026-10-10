import { withinCoverage } from '../simulation/hazards.ts';
import type { GeoPoint, RouteResult } from '../geo/types';
import type { MapData, Place } from './data';
export type Selection = Place & { clicked?: GeoPoint; snapMeters?: number };
export type Role = 'origin' | 'destination';
export interface SelectionState {
  origin: Selection | null;
  destination: Selection | null;
  active: Role | null;
  result: RouteResult | null;
  message: string;
}
export const initialSelection: SelectionState = {
  origin: null,
  destination: null,
  active: 'origin',
  result: null,
  message: '',
};
export type SelectionAction =
  | { type: 'select'; role: Role; selection: Selection }
  | { type: 'active'; role: Role | null }
  | { type: 'preset'; places: Place[] }
  | { type: 'result'; result: RouteResult }
  | { type: 'error'; message: string }
  | { type: 'clear'; role: Role }
  | { type: 'reset' };
export function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case 'clear':
      return {
        ...state,
        [action.role]: null,
        result: null,
        message: '',
        active: action.role,
      };
    case 'reset':
      return initialSelection;
    case 'error':
      return { ...state, message: action.message };
    case 'active':
      return { ...state, active: action.role, message: '' };
    case 'result':
      return { ...state, result: action.result, active: null, message: '' };
    case 'preset':
      return {
        origin: action.places[0],
        destination: action.places[1],
        active: null,
        result: null,
        message: '',
      };
    case 'select':
      return {
        ...state,
        [action.role]: action.selection,
        result: null,
        message: '',
        active:
          action.role === 'origin' && !state.destination ? 'destination' : null,
      };
  }
}
export function selectCoordinate(
  data: MapData,
  coordinate: GeoPoint,
  role: Role,
): SelectionAction {
  if (!withinCoverage(coordinate, data.bounds))
    return {
      type: 'error',
      message:
        'Location is outside the supported central Ernakulam road network. GhostRoute currently supports only the Ernakulam demo network.',
    };
  const snap = data.router.snap(coordinate, { role, maxDistanceMeters: 100 });
  if (snap.status !== 'snapped')
    return {
      type: 'error',
      message:
        snap.status === 'snap-distance-exceeded'
          ? 'That point is too far from the road network. GhostRoute currently supports only the Ernakulam demo network; choose a point within 100 m of a mapped road node.'
          : 'This point cannot be selected. Try a mapped road or a demo location.',
    };
  return {
    type: 'select',
    role,
    selection: {
      nodeId: snap.node.id,
      coordinate: snap.node.coordinate,
      label: `Map point · ${snap.node.coordinate[1].toFixed(5)}, ${snap.node.coordinate[0].toFixed(5)}`,
      clicked: coordinate,
      snapMeters: snap.distanceMeters,
    },
  };
}
export function routeMessage(result: RouteResult): string {
  switch (result.status) {
    case 'found':
      return 'Route available';
    case 'no-route':
      return 'No available route between these points in this dataset. Try another destination.';
    case 'origin-blocked':
      return 'The origin is blocked. Choose another starting point.';
    case 'destination-blocked':
      return 'The destination is blocked. Choose another destination.';
    case 'invalid-origin':
      return 'The origin is not in this road network.';
    case 'invalid-destination':
      return 'The destination is not in this road network.';
    case 'snap-distance-exceeded':
      return 'The selected point is too far from the road network.';
    case 'no-eligible-node':
      return 'No eligible road node is available.';
    case 'invalid-coordinate':
    case 'invalid-request':
      return result.reason;
  }
}
export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${meters.toFixed(1)} m`
    : `${(meters / 1000).toFixed(2)} km`;
}
