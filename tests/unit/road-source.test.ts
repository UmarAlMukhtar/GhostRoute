import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { GeoJSONSource } from 'maplibre-gl';
import type { RoadGeoJSON } from '../../src/lib/geo/types';
import { loadRoadSource } from '../../src/lib/map/roads';

const roads = JSON.parse(
  readFileSync('public/data/ernakulam/roads.geojson', 'utf8'),
) as RoadGeoJSON;

describe('bounded full-network renderer handoff', () => {
  it('preserves every original feature, property, geometry and order', async () => {
    const emitted: RoadGeoJSON['features'] = [];
    const source = {
      updateData: vi.fn(
        async (diff: Parameters<GeoJSONSource['updateData']>[0]) => {
          expect(diff.add!.length).toBeLessThanOrEqual(5000);
          emitted.push(...(diff.add as RoadGeoJSON['features']));
        },
      ),
    };
    expect(await loadRoadSource(source, roads, () => true)).toBe(true);
    expect(emitted).toHaveLength(57706);
    expect(
      emitted.every((feature, index) => feature === roads.features[index]),
    ).toBe(true);
    expect(new Set(emitted.map((feature) => feature.id)).size).toBe(57706);
  });

  it('awaits each update and stops after cancellation during a pending update', async () => {
    let release!: () => void;
    let active = true;
    const source = {
      updateData: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      ),
    };
    const loading = loadRoadSource(source, roads, () => active);
    expect(source.updateData).toHaveBeenCalledOnce();
    active = false;
    release();
    expect(await loading).toBe(false);
    expect(source.updateData).toHaveBeenCalledOnce();
  });

  it('propagates renderer failures without completing preparation', async () => {
    const source = {
      updateData: vi.fn(async () => {
        throw new Error('Worker failed');
      }),
    };
    await expect(loadRoadSource(source, roads, () => true)).rejects.toThrow(
      'Worker failed',
    );
    expect(source.updateData).toHaveBeenCalledOnce();
  });
});
