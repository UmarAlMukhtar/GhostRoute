import type { RoadEdge, RoadNode, RoadGeoJSON } from '../geo/types';
import type { MapData } from './data';
export type AssetMessage =
  | { type: 'nodes'; nodes: RoadNode[] }
  | { type: 'edges'; edges: RoadEdge[] }
  | { type: 'roads'; roads: RoadGeoJSON['features'][number]['properties'][] }
  | {
      type: 'ready';
      version: string;
      places: MapData['places'];
      bounds: MapData['bounds'];
    }
  | { type: 'error'; error: string };
