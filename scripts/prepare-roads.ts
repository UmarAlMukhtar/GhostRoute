import { preparePlaces } from './prepare-places.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { convertOsm } from '../src/lib/geo/convert.ts';
import { validateDataset } from '../src/lib/geo/dataset.ts';
import { connectedComponents, findPath } from '../src/lib/geo/connectivity.ts';
import { record, text } from '../src/lib/geo/validate.ts';

const sha256 = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
const source = gunzipSync(await readFile('data/source/ernakulam.osm.json.gz'));
const manifest = record(
  JSON.parse(await readFile('data/source/manifest.json', 'utf8')),
  'manifest',
);
if (sha256(source) !== text(manifest.normalizedSourceSha256, 'source hash'))
  throw new Error('Frozen source checksum mismatch');
const version = `ernakulam-walking-v2-${sha256(source).slice(0, 16)}`;
const { graph, roads, exclusions } = convertOsm(
  JSON.parse(source.toString()),
  version,
  true,
);
// Whole ways extend beyond the query; this reviewed envelope bounds every retained source road.
const report = validateDataset(graph, roads, [76.1, 9.8, 76.6, 10.3]);
const originNodeId = '271145615',
  destinationNodeId = '1906667447',
  blockedSegmentId = '768625211:4';
const baseline = findPath(graph, originNodeId, destinationNodeId);
const alternate = findPath(
  graph,
  originNodeId,
  destinationNodeId,
  new Set([blockedSegmentId]),
);
if (
  !baseline ||
  !alternate ||
  !baseline.some((id) => graph.edges[id].segmentId === blockedSegmentId)
)
  throw new Error('Reviewed demo path no longer exists; review source update');
const baselineSegments = new Set(
  baseline.map((id) => graph.edges[id].segmentId),
);
const distinctMeters = alternate
  .filter((id) => !baselineSegments.has(graph.edges[id].segmentId))
  .reduce((sum, id) => sum + graph.edges[id].lengthMeters, 0);
if (distinctMeters < 200)
  throw new Error(
    'Alternative does not have at least 200 meters of distinct road',
  );
const describe = (ids: string[]) => ({
  edgeIds: ids,
  distanceMeters:
    Math.round(
      ids.reduce((sum, id) => sum + graph.edges[id].lengthMeters, 0) * 1000,
    ) / 1000,
});
const components = connectedComponents(graph);
const fixture = {
  graphVersion: version,
  purpose:
    'Directed BFS connectivity witness, not shortest-distance routes or an approved shelter',
  origin: {
    nodeId: originNodeId,
    coordinate: graph.nodes[originNodeId].coordinate,
    label: 'Park Avenue / Hospital Road junction',
  },
  destination: {
    nodeId: destinationNodeId,
    coordinate: graph.nodes[destinationNodeId].coordinate,
    label: 'Jos Junction / Durbar Hall Road',
  },
  blockedSegmentId,
  blockedEdgeIds: Object.values(graph.edges)
    .filter((e) => e.segmentId === blockedSegmentId)
    .map((e) => e.id)
    .sort(),
  baseline: describe(baseline),
  alternate: describe(alternate),
  distinctAlternateMeters: Math.round(distinctMeters * 1000) / 1000,
  disconnectedNodeId: components.find((c) => !c.includes(originNodeId))![0],
};
const files: Record<string, string> = {
  'graph.json': JSON.stringify(graph) + '\n',
  'roads.geojson': JSON.stringify(roads) + '\n',
  'demo-paths.json': JSON.stringify(fixture, null, 2) + '\n',
};
await preparePlaces(JSON.parse(source.toString()), graph);
files['places.json'] = await readFile(
  'public/data/ernakulam/places.json',
  'utf8',
);
const metadata = {
  graphVersion: version,
  source: manifest,
  converter: 'walking-v2-shape-compaction',
  converterSha256: sha256(
    (
      await Promise.all(
        [
          'scripts/prepare-roads.ts',
          'scripts/prepare-places.ts',
          'src/lib/routing/shortest-path.ts',
          'src/lib/map/places.ts',
          'src/lib/geo/convert.ts',
          'src/lib/geo/distance.ts',
          'src/lib/geo/validate.ts',
          'src/lib/geo/dataset.ts',
          'src/lib/geo/connectivity.ts',
        ].map((p) => readFile(p)),
      )
    )
      .map((b) => b.toString())
      .join('\n'),
  ),
  ...report,
  exclusions,
  outputSha256: Object.fromEntries(
    Object.entries(files).map(([name, content]) => [name, sha256(content)]),
  ),
  limitations: [
    'Mapped walking access is assumed where tags are missing, not field verified.',
    'All components retained. No coordinate snapping or invented connections.',
    'No verified shelters, live hazards, elevation model or shortest-path engine.',
  ],
};
for (const [name, content] of Object.entries({
  ...files,
  'metadata.json': JSON.stringify(metadata, null, 2) + '\n',
}))
  await writeFile(`public/data/ernakulam/${name}`, content);
console.log(
  JSON.stringify(
    {
      ...report,
      baselineMeters: fixture.baseline.distanceMeters,
      alternateMeters: fixture.alternate.distanceMeters,
      distinctAlternateMeters: fixture.distinctAlternateMeters,
    },
    null,
    2,
  ),
);
