import type { Feature, LineString, Polygon } from 'geojson';
export function coverageGeometry(bounds: readonly number[]): {
  area: Feature<Polygon>;
  outline: Feature<LineString>;
} {
  const [west, south, east, north] = bounds;
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    west >= east ||
    south >= north ||
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90
  )
    throw new Error('Invalid geographic coverage bounds');
  const ring = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  return {
    area: {
      type: 'Feature',
      properties: { label: 'GhostRoute Demo Area — Ernakulam' },
      geometry: { type: 'Polygon', coordinates: [ring] },
    },
    outline: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: ring },
    },
  };
}
