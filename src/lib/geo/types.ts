import type {
  FeatureCollection,
  LineString,
  Polygon,
  MultiPolygon,
} from 'geojson';

/** WGS84 decimal degrees, always longitude first. */
export type GeoPoint = [longitude: number, latitude: number];
export interface RoadNode {
  id: string;
  coordinate: GeoPoint;
}
export interface RoadEdge {
  id: string;
  segmentId: string;
  from: string;
  to: string;
  lengthMeters: number;
  geometry: LineString;
  osmWayId: string;
}
export interface RoadGraph {
  version: string;
  nodes: Record<string, RoadNode>;
  edges: Record<string, RoadEdge>;
  outgoing: Record<string, string[]>;
}
export type RoadGeoJSON = FeatureCollection<
  LineString,
  {
    segmentId: string;
    osmWayId: string;
    edgeIds: string[];
    tags: Record<string, string>;
  }
>;
export interface DisasterZone {
  id: string;
  kind: 'flood';
  geometry: Polygon | MultiPolygon;
  simulated: true;
}
export interface FloodScenario {
  id: string;
  graphVersion: string;
  label: string;
  description: string;
  steps: DisasterZone[][];
}
export interface EmergencyShelter {
  id: string;
  name: string;
  coordinate: GeoPoint;
  nodeId: string;
  provenance: 'synthetic';
  availability: 'unknown';
}
export interface RoutingProfile {
  id: 'walking-demo';
  cost: 'distance';
}
export interface RoadClosures {
  blockedEdgeIds?: ReadonlySet<string>;
  blockedNodeIds?: ReadonlySet<string>;
  blockedSegmentIds?: ReadonlySet<string>;
}
export interface RoutingOptions extends RoadClosures {
  profile?: RoutingProfile;
}
export interface RouteRequest extends RoutingOptions {
  originNodeId: string;
  destinationNodeId: string;
}
export type RequestFailure = { status: 'invalid-request'; reason: string };
export type SnapFailure =
  | { status: 'invalid-coordinate'; reason: string }
  | {
      status: 'snap-distance-exceeded';
      nearestDistanceMeters: number;
      maxDistanceMeters: number;
    }
  | { status: 'no-eligible-node' }
  | RequestFailure;
export type RouteResult =
  | {
      status: 'found';
      origin: RoadNode;
      destination: RoadNode;
      nodeIds: string[];
      edgeIds: string[];
      segmentIds: string[];
      distanceMeters: number;
      geometry: LineString | null;
      metadata: {
        graphVersion: string;
        algorithm: 'dijkstra';
        profileId: RoutingProfile['id'];
        settledNodeCount: number;
      };
    }
  | {
      status:
        | 'invalid-origin'
        | 'invalid-destination'
        | 'origin-blocked'
        | 'destination-blocked';
      nodeId: string;
    }
  | { status: 'no-route' }
  | SnapFailure;
export interface SnapOptions extends RoutingOptions {
  maxDistanceMeters?: number;
  largestComponentOnly?: boolean;
  role?: 'origin' | 'destination';
}
export type SnapResult =
  | {
      status: 'snapped';
      node: RoadNode;
      distanceMeters: number;
      graphVersion: string;
    }
  | SnapFailure;
