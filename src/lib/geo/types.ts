import type { FeatureCollection, LineString, Polygon } from 'geojson';

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
  geometry: Polygon;
  simulated: true;
}
export interface FloodScenario {
  id: string;
  graphVersion: string;
  label: string;
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
export interface RouteRequest {
  originNodeId: string;
  destinationNodeId: string;
  profile: RoutingProfile;
  blockedEdgeIds: ReadonlySet<string>;
  blockedNodeIds: ReadonlySet<string>;
}
export type RouteResult =
  | {
      status: 'found';
      nodeIds: string[];
      edgeIds: string[];
      distanceMeters: number;
      geometry: LineString | null;
    }
  | { status: 'unreachable'; reason: 'disconnected' | 'endpoint-blocked' }
  | { status: 'invalid'; reason: string };
