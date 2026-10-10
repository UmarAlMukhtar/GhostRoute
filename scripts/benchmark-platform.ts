import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { validateGraph } from '../src/lib/geo/validate.ts';
import { createRouter } from '../src/lib/routing/shortest-path.ts';
import { createFloodEngine } from '../src/lib/simulation/flood.ts';
import {
  hazardInputs,
  type SimulatedHazard,
} from '../src/lib/simulation/hazards.ts';
const graph = validateGraph(
  JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
);
const router = createRouter(graph),
  engine = createFloodEngine(graph);
const request = { originNodeId: '271145615', destinationNodeId: '1906667447' };
const baseline = router.findRoute(request);
const hazards: SimulatedHazard[] = [
  {
    source: 'simulation',
    id: 'flood',
    kind: 'flood',
    enabled: true,
    center: [76.2806, 9.9714],
    radiusMeters: 20,
  },
  {
    source: 'simulation',
    id: 'landslide',
    kind: 'landslide',
    enabled: true,
    center: [76.28184, 9.97176],
    radiusMeters: 20,
  },
  {
    source: 'simulation',
    id: 'roadblock',
    kind: 'roadblock',
    enabled: true,
    center: [76.28014, 9.97135],
    radiusMeters: 20,
    segmentId: '768625211:4',
  },
];
for (const count of [3, 20]) {
  const values =
    count === 3
      ? hazards
      : Array.from({ length: 20 }, (_, i) => ({
          ...hazards[i % 2],
          id: `h-${i}`,
          radiusMeters: 20 + i * 5,
        }));
  const inputs = hazardInputs(values);
  const impactTimes: number[] = [],
    routeTimes: number[] = [];
  let result = baseline,
    blocked = 0;
  for (let i = 0; i < 35; i++) {
    const start = performance.now();
    const impact = engine.evaluate(inputs.zones, inputs.segments);
    // Include the per-hazard explanations computed once when the hazard set changes.
    for (const hazard of values) {
      const individual = hazardInputs([hazard]);
      engine.evaluate(individual.zones, individual.segments);
    }
    const intersection = performance.now();
    if (impact.status !== 'ready') throw new Error(impact.reason);
    result = router.findRoute({
      ...request,
      blockedSegmentIds: impact.blockedSegmentIds,
      blockedNodeIds: impact.blockedNodeIds,
    });
    const end = performance.now();
    blocked = impact.metadata.segmentCount;
    if (i >= 5) {
      impactTimes.push(intersection - start);
      routeTimes.push(end - intersection);
    }
  }
  const stats = (values: number[]) => {
    values.sort((a, b) => a - b);
    return { medianMs: +values[15].toFixed(3), p95Ms: +values[28].toFixed(3) };
  };
  console.log(
    JSON.stringify({
      hazards: count,
      baselineMeters:
        baseline.status === 'found' ? baseline.distanceMeters : null,
      blockedSegments: blocked,
      result: result.status,
      updatedMeters: result.status === 'found' ? result.distanceMeters : null,
      intersection: stats(impactTimes),
      rerouting: stats(routeTimes),
    }),
  );
}
