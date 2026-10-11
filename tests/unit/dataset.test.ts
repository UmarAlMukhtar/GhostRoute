import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { convertOsm } from '../../src/lib/geo/convert.ts';
import { validateDataset } from '../../src/lib/geo/dataset.ts';
import { validateGraph } from '../../src/lib/geo/validate.ts';
import {
  connectedComponents,
  findPath,
} from '../../src/lib/geo/connectivity.ts';
import fixture from '../../public/data/ernakulam/demo-paths.json';
import metadata from '../../public/data/ernakulam/metadata.json';

const load = (name: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${name}`, 'utf8'));
const generatedJsonHash = (name: string) =>
  createHash('sha256')
    .update(
      readFileSync(`public/data/ernakulam/${name}`, 'utf8').replace(
        /\r\n/g,
        '\n',
      ),
    )
    .digest('hex');
const source = gunzipSync(readFileSync('data/source/ernakulam.osm.json.gz'));
const graph = validateGraph(load('graph.json'));
const envelope: [number, number, number, number] = [76.1, 9.8, 76.6, 10.3];

describe('frozen real Ernakulam dataset', () => {
  it('reproduces graph and GeoJSON exactly from the pinned OSM source', () => {
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      metadata.source.normalizedSourceSha256,
    );
    const converted = convertOsm(
      JSON.parse(source.toString()),
      graph.version,
      true,
    );
    expect(converted.graph).toEqual(graph);
    expect(converted.roads).toEqual(load('roads.geojson'));
    for (const [file, hash] of Object.entries(metadata.outputSha256))
      expect(generatedJsonHash(file)).toBe(hash);
  });
  it('fits local loading budgets and reports every component without inventing joins', () => {
    const report = validateDataset(graph, load('roads.geojson'), envelope);
    expect(report.runtimeBytes).toBeLessThan(100_000_000);
    expect(report).toMatchObject({
      nodeCount: metadata.nodeCount,
      directedEdgeCount: metadata.directedEdgeCount,
      componentSizes: metadata.componentSizes,
    });
    expect(report.componentSizes.reduce((sum, size) => sum + size, 0)).toBe(
      Object.keys(graph.nodes).length,
    );
    expect(report.parallelSegmentCandidates).toEqual(
      metadata.parallelSegmentCandidates,
    );
    // In this snapshot every segment has both directions, so weak components are also strong.
    expect(report.oneWaySegmentCount).toBe(metadata.oneWaySegmentCount);
    expect(connectedComponents(graph)[0]).toContain(fixture.origin.nodeId);
  });
  it('keeps the verified demo connected after blocking BOTH directions of a real segment', () => {
    expect(fixture.graphVersion).toBe(graph.version);
    expect(graph.nodes[fixture.origin.nodeId].coordinate).toEqual(
      fixture.origin.coordinate,
    );
    expect(graph.nodes[fixture.destination.nodeId].coordinate).toEqual(
      fixture.destination.coordinate,
    );
    expect(
      findPath(graph, fixture.origin.nodeId, fixture.destination.nodeId),
    ).toEqual(fixture.baseline.edgeIds);
    const alternate = findPath(
      graph,
      fixture.origin.nodeId,
      fixture.destination.nodeId,
      new Set([fixture.blockedSegmentId]),
    );
    expect(alternate).toEqual(fixture.alternate.edgeIds);
    expect(fixture.blockedEdgeIds).toHaveLength(2);
    expect(alternate!.some((id) => fixture.blockedEdgeIds.includes(id))).toBe(
      false,
    );
    const baseSegments = new Set(
      fixture.baseline.edgeIds.map((id) => graph.edges[id].segmentId),
    );
    const distinct = alternate!
      .filter((id) => !baseSegments.has(graph.edges[id].segmentId))
      .reduce((sum, id) => sum + graph.edges[id].lengthMeters, 0);
    expect(distinct).toBeGreaterThan(200);
    for (const witness of [fixture.baseline, fixture.alternate]) {
      let current = fixture.origin.nodeId;
      let meters = 0;
      for (const id of witness.edgeIds) {
        const e = graph.edges[id];
        expect(e.from).toBe(current);
        current = e.to;
        meters += e.lengthMeters;
      }
      expect(current).toBe(fixture.destination.nodeId);
      expect(meters).toBeCloseTo(witness.distanceMeters, 3);
    }
    expect(
      findPath(graph, fixture.origin.nodeId, fixture.disconnectedNodeId),
    ).toBeNull();
  });
  it('rejects out-of-bounds data, missing map segments and duplicate map features', () => {
    expect(() =>
      validateDataset(graph, load('roads.geojson'), [76.28, 9.97, 76.29, 9.98]),
    ).toThrow(/outside/);
    const { roads } = convertOsm(
      JSON.parse(source.toString()),
      graph.version,
      true,
    );
    const missing = { ...roads, features: roads.features.slice(1) };
    expect(() => validateDataset(graph, missing, envelope)).toThrow(/missing/);
    const duplicate = {
      ...roads,
      features: [...roads.features, roads.features[0]],
    };
    expect(() => validateDataset(graph, duplicate, envelope)).toThrow(
      /duplicate/,
    );
    roads.features[0].geometry.coordinates.reverse();
    expect(() => validateDataset(graph, roads, envelope)).toThrow(/geometry/);
  });
  it('rejects an oversized renderer payload', () => {
    const oversized = {
      type: 'FeatureCollection',
      features: [],
      padding: 'x'.repeat(100_000_001),
    };
    expect(() => validateDataset(graph, oversized, envelope)).toThrow(/budget/);
  });
});

it('rejects excessive graph nodes before map loading', () => {
  const oversized = structuredClone(graph);
  for (let i = 0; i < 100001; i++) {
    const id = `extra-${i}`;
    oversized.nodes[id] = { id, coordinate: [76.28, 9.97] };
    oversized.outgoing[id] = [];
  }
  expect(() =>
    validateDataset(oversized, load('roads.geojson'), envelope),
  ).toThrow(/size budget/);
});
