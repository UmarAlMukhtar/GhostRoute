import type { GeoPoint } from './types.ts';

/** Haversine on the IUGG mean-radius sphere; sufficient for this walking demo. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const radians = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * radians) / 2) ** 2 +
    Math.cos(a[1] * radians) *
      Math.cos(b[1] * radians) *
      Math.sin(((b[0] - a[0]) * radians) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
