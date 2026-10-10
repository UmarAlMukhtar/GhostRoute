import type { DisasterZone, FloodScenario } from '../geo/types.ts';
const rectangle = (
  id: string,
  west: number,
  south: number,
  east: number,
  north: number,
): DisasterZone => ({
  id,
  kind: 'flood',
  simulated: true,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  },
});
import fixture from '../../../public/data/ernakulam/demo-paths.json' with { type: 'json' };
const graphVersion = fixture.graphVersion;
// The west boundary crosses the fixture's 0.548 m segment without flooding its origin.
const hospital = rectangle('hospital', 76.280142, 9.9712, 76.2809, 9.97165);
export const scenarios: FloodScenario[] = [
  {
    id: 'hospital',
    graphVersion,
    label: 'Hospital Road flood',
    description:
      'A localized illustrative closure across Hospital Road. Compare the original path with the available detour.',
    steps: [[], [hospital]],
  },
  {
    id: 'expanding',
    graphVersion,
    label: 'Expanding urban flood',
    description:
      'Three nested illustrative extents expand eastward. Each stage blocks intersecting roads and recalculates your route.',
    steps: [
      [],
      [hospital],
      [rectangle('urban', 76.280142, 9.9708, 76.282, 9.972)],
      [rectangle('urban', 76.280142, 9.9702, 76.2835, 9.9725)],
    ],
  },
  {
    id: 'unavailable',
    graphVersion,
    label: 'Route unavailable',
    description:
      'Illustrative flooding surrounds the Hospital Road demo destination. Select that preset to demonstrate an unavailable route.',
    steps: [[], [rectangle('destination', 76.2852, 9.9677, 76.2869, 9.9691)]],
  },
];
