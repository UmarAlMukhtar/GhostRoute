import type { GeoJSONSource } from 'maplibre-gl';
import type { RoadGeoJSON } from '../geo/types';

// Await each supported incremental update so MapLibre cannot serialize the
// entire collection in one UI task. IDs and complete features stay unchanged.
export async function loadRoadSource(
  source: Pick<GeoJSONSource, 'updateData'>,
  roads: RoadGeoJSON,
  active: () => boolean,
): Promise<boolean> {
  for (let start = 0; start < roads.features.length; start += 5000) {
    if (!active()) return false;
    await source.updateData({ add: roads.features.slice(start, start + 5000) });
  }
  return active();
}
