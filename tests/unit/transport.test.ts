import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { packDataset, unpackDataset } from '../../src/lib/geo/transport';
import { parseMapAssets } from '../../src/lib/map/assets';
import { validateGraph } from '../../src/lib/geo/validate';
import {
  createRouter,
  createRouterAsync,
} from '../../src/lib/routing/shortest-path';
import {
  createFloodEngine,
  createFloodEngineAsync,
} from '../../src/lib/simulation/flood';
import { routingGraph } from '../fixtures/graph';
const read = (file: string) =>
  JSON.parse(readFileSync(`public/data/ernakulam/${file}`, 'utf8'));
it('preserves every node, direction, weight, coordinate, tag and adjacency in the full network', () => {
  const graph = read('graph.json'),
    roads = read('roads.geojson');
  const transport = read('dataset.json');
  expect(packDataset(graph, roads)).toEqual(transport);
  const expanded = unpackDataset(transport);
  expect(expanded.graph).toEqual(graph);
  expect(expanded.roads).toEqual(roads);
  const assets = parseMapAssets(
    expanded.graph,
    expanded.roads,
    read('demo-paths.json'),
  );
  expect(Object.keys(assets.graph.nodes)).toHaveLength(49740);
  expect(Object.keys(assets.graph.edges)).toHaveLength(115412);
  expect(assets.roads.features).toHaveLength(57706);
});
it('preserves canonical map orientation when only the reverse traversal exists', () => {
  const full = read('graph.json'),
    feature = read('roads.geojson').features[0];
  const edge = full.edges[`${feature.properties.segmentId}:reverse`];
  const graph = {
    version: full.version,
    nodes: {
      [edge.from]: full.nodes[edge.from],
      [edge.to]: full.nodes[edge.to],
    },
    edges: { [edge.id]: edge },
    outgoing: { [edge.from]: [edge.id], [edge.to]: [] },
  };
  feature.properties.edgeIds = [edge.id];
  const roads = { type: 'FeatureCollection' as const, features: [feature] };
  const expanded = unpackDataset(packDataset(graph, roads));
  expect(expanded.graph).toEqual(graph);
  expect(expanded.roads).toEqual(roads);
  expect(validateGraph(expanded.graph)).toEqual(graph);
});
it('rejects duplicate transport IDs and invalid geographic weights at the existing boundary', () => {
  const packed = read('dataset.json');
  packed.nodes.push(packed.nodes[0]);
  expect(() => unpackDataset(packed)).toThrow(/duplicate node/);
  packed.nodes.pop();
  packed.segments[0][4][2] = -1;
  expect(() => validateGraph(unpackDataset(packed).graph)).toThrow(/weight/);
});
it('cooperative initialization preserves routing, closures, snapping and snapshot isolation', async () => {
  const graph = routingGraph();
  const router = await createRouterAsync(graph),
    sync = createRouter(graph);
  const request = { originNodeId: 'A', destinationNodeId: 'D' };
  expect(router.findRoute(request)).toEqual(sync.findRoute(request));
  expect(
    router.findRoute({ ...request, blockedEdgeIds: new Set(['bd']) }),
  ).toEqual(sync.findRoute({ ...request, blockedEdgeIds: new Set(['bd']) }));
  expect(router.snap(graph.nodes.A.coordinate)).toEqual(
    sync.snap(graph.nodes.A.coordinate),
  );
  const engine = await createFloodEngineAsync(graph);
  expect(engine.evaluate([], new Set(['ab']))).toEqual(
    createFloodEngine(graph).evaluate([], new Set(['ab'])),
  );
  graph.edges.ab.lengthMeters = 999;
  graph.nodes.A.coordinate[0] = 0;
  expect(router.findRoute(request)).toEqual(sync.findRoute(request));
});
