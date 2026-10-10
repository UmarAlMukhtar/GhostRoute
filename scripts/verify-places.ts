import { readFileSync } from 'node:fs';
import { validateGraph } from '../src/lib/geo/validate.ts';
import { createRouter } from '../src/lib/routing/shortest-path.ts';
import { validatePlaces } from '../src/lib/map/places.ts';
const read = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const graph = validateGraph(read('public/data/ernakulam/graph.json'));
const coordinates = Object.values(graph.nodes).map((n) => n.coordinate);
const bounds: [number, number, number, number] = [
  Math.min(...coordinates.map((p) => p[0])),
  Math.min(...coordinates.map((p) => p[1])),
  Math.max(...coordinates.map((p) => p[0])),
  Math.max(...coordinates.map((p) => p[1])),
];
const places = validatePlaces(read('data/places/ernakulam.json'), {
  graph,
  router: createRouter(graph),
  bounds,
});
console.log(
  JSON.stringify(
    {
      places: places.length,
      graphVersion: graph.version,
      verified: places.map((p) => ({
        name: p.name,
        nodeId: p.nodeId,
        snapMeters: p.snapMeters,
      })),
    },
    null,
    2,
  ),
);
