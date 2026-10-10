import type { DisasterZone, GeoPoint } from '../geo/types.ts';
import { point } from '../geo/validate.ts';

export type HazardKind = DisasterZone['kind'] | 'roadblock';
export interface SimulatedHazard {
  source: 'simulation';
  id: string;
  kind: HazardKind;
  enabled: boolean;
  center: GeoPoint;
  radiusMeters: number;
  segmentId?: string;
}
export function withinCoverage(
  coordinate: GeoPoint,
  bounds: readonly number[],
) {
  return (
    coordinate[0] >= bounds[0] &&
    coordinate[0] <= bounds[2] &&
    coordinate[1] >= bounds[1] &&
    coordinate[1] <= bounds[3]
  );
}
/** Illustrative spherical exclusion circle, not a physical hazard model. */
export function hazardZone(hazard: SimulatedHazard): DisasterZone {
  const center = point(hazard.center, 'Hazard center');
  if (hazard.kind === 'roadblock')
    throw new Error('Roadblocks need a physical segment');
  if (
    !Number.isFinite(hazard.radiusMeters) ||
    hazard.radiusMeters < 10 ||
    hazard.radiusMeters > 500
  )
    throw new Error('Radius must be between 10 and 500 meters');
  const lat = (center[1] * Math.PI) / 180,
    lon = (center[0] * Math.PI) / 180;
  const angular = hazard.radiusMeters / 6371008.8;
  const ring: GeoPoint[] = Array.from({ length: 48 }, (_, i) => {
    const bearing = (i * 2 * Math.PI) / 48;
    const y = Math.asin(
      Math.sin(lat) * Math.cos(angular) +
        Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
    );
    const x =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(y),
      );
    return [(x * 180) / Math.PI, (y * 180) / Math.PI];
  });
  ring.push([...ring[0]]);
  return {
    id: hazard.id,
    kind: hazard.kind,
    simulated: true,
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}
export function hazardInputs(hazards: readonly SimulatedHazard[]) {
  const enabled = hazards.filter((h) => h.enabled);
  return {
    zones: enabled.filter((h) => h.kind !== 'roadblock').map(hazardZone),
    segments: new Set(
      enabled
        .filter((h) => h.kind === 'roadblock' && h.segmentId)
        .map((h) => h.segmentId!),
    ),
  };
}
