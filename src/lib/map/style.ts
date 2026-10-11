import type {
  FeatureCollection,
  LineString,
  Polygon,
  MultiPolygon,
  Point,
} from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';
import type { RoadGeoJSON } from '../geo/types';
import { coverageGeometry } from './coverage';
export const EMPTY: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};
export interface MapOverlays {
  hazards?: FeatureCollection<Polygon | MultiPolygon>;
  blockedRoads?: FeatureCollection<LineString>;
  alternative?: FeatureCollection<LineString>;
  shelters?: FeatureCollection<Point>;
}
export function localStyle(
  roads: RoadGeoJSON,
  bounds: readonly number[],
): StyleSpecification {
  const coverage = coverageGeometry(bounds);
  return {
    version: 8,
    sources: {
      'demo-area': { type: 'geojson', data: coverage.area },
      'demo-boundary': { type: 'geojson', data: coverage.outline },
      roads: { type: 'geojson', data: roads },
      reports: { type: 'geojson', data: EMPTY },
      route: { type: 'geojson', data: EMPTY },
      hazards: { type: 'geojson', data: EMPTY },
      blockedRoads: { type: 'geojson', data: EMPTY },
      alternative: { type: 'geojson', data: EMPTY },
      shelters: { type: 'geojson', data: EMPTY },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#edf1ef' },
      },
      {
        id: 'demo-area',
        type: 'fill',
        source: 'demo-area',
        paint: { 'fill-color': '#0f766e', 'fill-opacity': 0.045 },
      },
      {
        id: 'hazards',
        type: 'fill',
        source: 'hazards',
        paint: {
          'fill-color': [
            'match',
            ['get', 'kind'],
            'landslide',
            '#a16207',
            'fire',
            '#f97316',
            '#06b6d4',
          ],
          'fill-opacity': 0.25,
          'fill-outline-color': '#b45309',
        },
      },
      {
        id: 'hazard-boundary',
        type: 'line',
        source: 'hazards',
        paint: {
          'line-color': '#d97706',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#c3cecb',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            1.5,
            16,
            6,
            19,
            14,
          ],
        },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0.5,
            16,
            3,
            19,
            10,
          ],
        },
      },
      {
        id: 'demo-boundary',
        type: 'line',
        source: 'demo-boundary',
        paint: {
          'line-color': '#0f766e',
          'line-width': 2.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.9,
        },
      },
      {
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#fff', 'line-width': 9 },
      },
      {
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 5 },
      },
      {
        id: 'alternative-casing',
        type: 'line',
        source: 'alternative',
        paint: { 'line-color': '#fff', 'line-width': 8 },
      },
      {
        id: 'alternative',
        type: 'line',
        source: 'alternative',
        paint: { 'line-color': '#15803d', 'line-width': 5 },
      },
      {
        id: 'blockedRoads',
        type: 'line',
        source: 'blockedRoads',
        paint: {
          'line-color': '#dc2626',
          'line-width': 5,
          'line-dasharray': [2, 1],
        },
      },
      {
        id: 'shelters',
        type: 'circle',
        source: 'shelters',
        paint: {
          'circle-radius': 9,
          'circle-color': '#7e22ce',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 3,
        },
      },
      {
        id: 'reports',
        type: 'circle',
        source: 'reports',
        paint: {
          'circle-radius': 8,
          'circle-color': '#7e22ce',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 3,
        },
      },
    ],
  };
}
