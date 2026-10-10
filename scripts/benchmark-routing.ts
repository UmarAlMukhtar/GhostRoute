import { readFileSync } from 'node:fs';
import { cpus, platform, release, arch } from 'node:os';
import { performance } from 'node:perf_hooks';
import { createRouter } from '../src/lib/routing/shortest-path.ts';
import { validateGraph } from '../src/lib/geo/validate.ts';

const raw: unknown = JSON.parse(
  readFileSync('public/data/ernakulam/graph.json', 'utf8'),
);
const graph = validateGraph(raw),
  router = createRouter(graph);
const request = { originNodeId: '271145615', destinationNodeId: '1906667447' };
const closed = { ...request, blockedSegmentIds: new Set(['768625211:4']) };
const runs = 30,
  warmups = 5;
function measure(operation: () => void) {
  for (let i = 0; i < warmups; i++) operation();
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {
    medianMs: Number(((samples[14] + samples[15]) / 2).toFixed(3)),
    p95Ms: Number(samples[Math.ceil(0.95 * runs) - 1].toFixed(3)),
  };
}
function calculate(input = request) {
  const result = router.findRoute(input);
  if (result.status !== 'found')
    throw new Error(`Benchmark route failed: ${result.status}`);
  return result;
}
const baseline = calculate(),
  alternate = calculate(closed);
if (
  Math.abs(baseline.distanceMeters - 944.333) > 0.001 ||
  Math.abs(alternate.distanceMeters - 980.79) > 0.001 ||
  alternate.segmentIds.includes('768625211:4')
)
  throw new Error(
    'Benchmark fixture changed; review data before reporting performance',
  );
console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: platform(),
        release: release(),
        arch: arch(),
        cpu: cpus()[0]?.model,
      },
      graphVersion: graph.version,
      nodes: Object.keys(graph.nodes).length,
      directedEdges: Object.keys(graph.edges).length,
      runs,
      warmups,
      distancesMeters: {
        baseline: baseline.distanceMeters,
        blockedHospitalRoad: alternate.distanceMeters,
      },
      initialization: measure(() => {
        createRouter(graph);
      }),
      validationAndInitialization: measure(() => {
        createRouter(validateGraph(raw));
      }),
      baseline: measure(() => {
        calculate();
      }),
      reroute: measure(() => {
        calculate(closed);
      }),
      repeatedBatch100: measure(() => {
        for (let i = 0; i < 100; i++) calculate(i % 2 ? closed : request);
      }),
      snap: measure(() => {
        router.snap([76.28014, 9.9713489], { largestComponentOnly: true });
      }),
      notes:
        'Node-only wall-clock measurements, in-memory data, no file read/JSON parse/network/map rendering in timed operations. Batch timing is for 100 alternating baseline/closed requests, not per request. Includes closure validation and route geometry reconstruction.',
    },
    null,
    2,
  ),
);
