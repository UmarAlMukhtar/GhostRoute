import { describe, expect, it } from 'vitest';
import { distanceMeters } from '../../src/lib/geo/distance.ts';
import { convertOsm } from '../../src/lib/geo/convert.ts';
import { validateGraph } from '../../src/lib/geo/validate.ts';
import {
  connectedComponents,
  findPath,
} from '../../src/lib/geo/connectivity.ts';

const node = (id: number, lon: number, lat: number, tags = {}) => ({
  type: 'node',
  id,
  lon,
  lat,
  tags,
});
const way = (id: number, nodes: number[], tags = {}) => ({
  type: 'way',
  id,
  nodes,
  tags: { highway: 'residential', ...tags },
});
const source = (tags = {}) => ({
  elements: [
    node(1, 76.29, 9.97),
    node(2, 76.291, 9.97),
    node(3, 76.291, 9.971),
    node(4, 76.29, 9.971),
    way(10, [1, 2, 3], tags),
    way(20, [1, 4, 3]),
  ],
});

describe('geographic calculations', () => {
  it('uses geographic meters, including across the antimeridian', () => {
    expect(distanceMeters([0, 0], [1, 0])).toBeCloseTo(111195.08, 1);
    expect(distanceMeters([179.5, 0], [-179.5, 0])).toBeCloseTo(111195.08, 1);
    expect(distanceMeters([76.29, 9.97], [76.29, 9.97])).toBe(0);
  });
});

describe('OSM topology and walking policy', () => {
  it('preserves shared IDs and an alternative when a physical road is blocked', () => {
    const { graph, roads } = convertOsm(source(), 'test');
    expect(Object.keys(graph.nodes)).toHaveLength(4);
    expect(Object.keys(graph.edges)).toHaveLength(8);
    expect(roads.features).toHaveLength(4);
    expect(findPath(graph, '1', '3')).toEqual(['10:0:forward', '10:1:forward']);
    expect(findPath(graph, '1', '3', new Set(['10:0']))).toEqual([
      '20:0:forward',
      '20:1:forward',
    ]);
    expect(findPath(graph, '1', '3', new Set(['10:0', '20:0']))).toBeNull();
    expect(connectedComponents(graph).map((c) => c.length)).toEqual([4]);
  });
  it.each([
    [{ oneway: 'yes' }, ['forward', 'reverse']],
    [{ 'oneway:foot': 'yes' }, ['forward']],
    [{ 'oneway:foot': '-1' }, ['reverse']],
    [{ 'foot:forward': 'no' }, ['reverse']],
    [{ 'foot:backward': 'no' }, ['forward']],
    [{ 'access:forward': 'private' }, ['reverse']],
    [{ 'access:forward': 'private', foot: 'yes' }, ['forward', 'reverse']],
    [{ motorroad: 'yes' }, []],
    [{ conveying: 'forward' }, []],
    [{ access: 'private', foot: 'yes' }, ['forward', 'reverse']],
    [{ foot: 'no' }, []],
    [{ access: 'customers' }, []],
    [{ 'foot:conditional': 'yes @ (Mo-Fr)' }, []],
    [{ 'oneway:foot': 'reversible' }, []],
  ])('honors pedestrian restrictions %j', (tags, directions) => {
    const { graph } = convertOsm(source(tags), 'test');
    expect(
      Object.values(graph.edges)
        .filter((e) => e.segmentId === '10:0')
        .map((e) => e.id.split(':')[2])
        .sort(),
    ).toEqual([...directions].sort());
  });
  it('does not join crossings or coincident coordinates with different OSM IDs', () => {
    const { graph } = convertOsm(
      {
        elements: [
          node(1, 0, 0),
          node(2, 1, 1),
          node(3, 0, 1),
          node(4, 1, 0),
          node(5, 0, 0),
          node(6, -1, 0),
          way(10, [1, 2], { bridge: 'yes', layer: '1' }),
          way(20, [3, 4]),
          way(30, [5, 6]),
        ],
      },
      'test',
    );
    expect(connectedComponents(graph).map((c) => c.length)).toEqual([2, 2, 2]);
    expect(findPath(graph, '1', '4')).toBeNull();
    expect(findPath(graph, '1', '5')).toBeNull();
  });
  it('excludes segments incident to restricted or unhandled barrier nodes', () => {
    const input = source();
    input.elements.push(
      node(5, 76.292, 9.97, { barrier: 'gate' }),
      way(30, [2, 5, 3]),
    );
    expect(
      Object.values(convertOsm(input, 'test').graph.edges).some(
        (e) => e.osmWayId === '30',
      ),
    ).toBe(false);
  });
  it('is invariant under source element order', () => {
    const input = source();
    expect(
      convertOsm({ elements: [...input.elements].reverse() }, 'test'),
    ).toEqual(convertOsm(input, 'test'));
  });
  it.each([
    [{ elements: [] }, /empty/i],
    [{ elements: [node(1, 200, 0)] }, /coordinate/i],
    [{ elements: [node(1, 0, 0), node(1, 1, 1)] }, /duplicate/i],
    [{ elements: [node(1, 0, 0), way(10, [1, 2])] }, /missing node/i],
    [
      { elements: [node(1, 0, 0), node(2, 0, 0), way(10, [1, 2])] },
      /zero.*length/i,
    ],
  ])('rejects malformed sources with actionable errors', (input, error) => {
    expect(() => convertOsm(input, 'test')).toThrow(error);
  });
});

describe('graph loading boundary', () => {
  it('accepts a valid graph parsed from local JSON', () => {
    const { graph } = convertOsm(source(), 'test');
    expect(validateGraph(JSON.parse(JSON.stringify(graph)))).toEqual(graph);
  });
  it.each([
    'coordinate',
    'endpoint',
    'weight',
    'geometry',
    'adjacency',
    'duplicate',
    'direction',
  ])('rejects invalid %s', (kind) => {
    const { graph } = convertOsm(source(), 'test');
    const edge = graph.edges['10:0:forward'];
    if (kind === 'coordinate') graph.nodes['1'].coordinate = [NaN, 9.97];
    if (kind === 'endpoint') edge.to = 'missing';
    if (kind === 'weight') edge.lengthMeters = -1;
    if (kind === 'geometry') edge.geometry.coordinates.reverse();
    if (kind === 'adjacency') graph.outgoing['1'] = [];
    if (kind === 'duplicate') graph.outgoing['1'].push(edge.id);
    if (kind === 'direction') graph.edges['10:0:reverse'].from = '1';
    expect(() => validateGraph(graph)).toThrow();
  });
});

it.each([0, NaN, Infinity, -Infinity])(
  'rejects invalid edge weight %s',
  (weight) => {
    const { graph } = convertOsm(source(), 'test');
    graph.edges['10:0:forward'].lengthMeters = weight;
    expect(() => validateGraph(graph)).toThrow(/weight/);
  },
);
it('does not invent reverse traversal on pedestrian one-way roads', () => {
  const { graph } = convertOsm(
    {
      elements: [
        node(1, 0, 0),
        node(2, 0.001, 0),
        way(10, [1, 2], { 'oneway:foot': 'yes' }),
      ],
    },
    'test',
  );
  expect(findPath(graph, '1', '2')).toEqual(['10:0:forward']);
  expect(findPath(graph, '2', '1')).toBeNull();
});

it('retains source bridge/tunnel/layer tags for map and flood review', () => {
  const { roads } = convertOsm(source({ bridge: 'yes', layer: '1' }), 'test');
  expect(
    roads.features.find((f) => f.properties.osmWayId === '10')!.properties.tags,
  ).toMatchObject({ bridge: 'yes', layer: '1' });
});
it('excludes explicit pedestrian turn restrictions instead of misrouting through them', () => {
  const input = source();
  const relation = {
    type: 'relation',
    id: 50,
    tags: { type: 'restriction', 'restriction:foot': 'no_right_turn' },
    members: [{ type: 'way', ref: 10, role: 'from' }],
  };
  const { graph, exclusions } = convertOsm(
    { elements: [...input.elements, relation] },
    'test',
  );
  expect(Object.values(graph.edges).some((e) => e.osmWayId === '10')).toBe(
    false,
  );
  expect(exclusions).toContainEqual({
    id: '10',
    reason: 'unhandled pedestrian turn restriction',
  });
});
