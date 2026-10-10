import { readFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { performance } from 'node:perf_hooks';
import { validateGraph } from '../src/lib/geo/validate.ts';
import { createRouter } from '../src/lib/routing/shortest-path.ts';
import { createFloodEngine } from '../src/lib/simulation/flood.ts';
import { scenarios } from '../src/lib/simulation/scenarios.ts';
import { reroute } from '../src/lib/simulation/session.ts';
const graph = validateGraph(
  JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
);
const router = createRouter(graph),
  engine = createFloodEngine(graph);
const baseline = router.findRoute({
  originNodeId: '271145615',
  destinationNodeId: '1906667447',
});
function measure(fn: () => unknown) {
  for (let i = 0; i < 5; i++) fn();
  const samples = Array.from({ length: 30 }, () => {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }).sort((a, b) => a - b);
  return {
    medianMs: Number(((samples[14] + samples[15]) / 2).toFixed(3)),
    p95Ms: Number(samples[28].toFixed(3)),
  };
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      os: platform(),
      cpu: cpus()[0].model,
      warmups: 5,
      runs: 30,
      initialization: measure(() => createFloodEngine(graph)),
      baselineMeters:
        baseline.status === 'found' ? baseline.distanceMeters : null,
      scenarios: scenarios.flatMap((s) =>
        s.steps.slice(1).map((zones, i) => {
          const flood = engine.evaluate(zones);
          if (flood.status !== 'ready') throw Error(flood.reason);
          const result = reroute(router, baseline, flood);
          return {
            id: s.id,
            stage: i + 1,
            ...flood.metadata,
            status: result?.status,
            distanceMeters:
              result?.status === 'found' ? result.distanceMeters : null,
            intersection: measure(() => engine.evaluate(zones)),
            rerouting: measure(() => reroute(router, baseline, flood)),
          };
        }),
      ),
    },
    null,
    2,
  ),
);
