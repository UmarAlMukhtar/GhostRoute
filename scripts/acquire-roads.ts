import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { convertOsm } from '../src/lib/geo/convert.ts';
import { record } from '../src/lib/geo/validate.ts';

// Acquisition is development-only. Overpass is preferred; bounded map API cells are an explicit fallback.
const queryBounds = [76.22, 9.89, 76.42, 10.14];
const url = 'https://overpass-api.de/api/interpreter';
const query =
  '[out:json][timeout:180];way[highway](9.89,76.22,10.14,76.42);(._;>;);out meta;';
const importedAt = new Date().toISOString();
const path = process.argv[2];
const directory = path && (await stat(path)).isDirectory();
const paths = directory
  ? (await readdir(path))
      .filter((p) => p.endsWith('.json'))
      .sort()
      .map((p) => `${path}/${p}`)
  : path
    ? [path]
    : [];
const response = path
  ? null
  : await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(240000),
    });
if (response && !response.ok)
  throw new Error(
    `OSM HTTP ${response.status}; keep the existing frozen source`,
  );
const responses = paths.length
  ? await Promise.all(
      paths.map(async (p) => ({ path: p, bytes: await readFile(p) })),
    )
  : [{ path: url, bytes: Buffer.from(await response!.arrayBuffer()) }];
const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const sourceRequests: {
  sourceUrl: string;
  sha256: string;
  fetchedAt: string;
}[] = [];
const byId = new Map<string, Record<string, unknown>>();
for (const input of responses) {
  if (input.bytes.length > 40_000_000)
    throw new Error('OSM response exceeds 40 MB per-cell budget');
  const raw = record(JSON.parse(input.bytes.toString()), 'OSM response');
  if (!Array.isArray(raw.elements))
    throw new Error('OSM response has no elements');
  let sourceUrl = url;
  if (path) {
    const bounds = record(raw.bounds, 'OSM response bounds');
    const box = [bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat];
    if (
      !box.every((v) => typeof v === 'number') ||
      Number(box[0]) < queryBounds[0] ||
      Number(box[1]) < queryBounds[1] ||
      Number(box[2]) > queryBounds[2] ||
      Number(box[3]) > queryBounds[3]
    )
      throw new Error('OSM response bounds differ from the reviewed request');
    sourceUrl = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${box.join(',')}`;
  }
  sourceRequests.push({
    sourceUrl,
    sha256: sha256(input.bytes),
    fetchedAt: path ? (await stat(input.path)).mtime.toISOString() : importedAt,
  });
  for (const value of raw.elements) {
    const element = record(value, 'OSM element');
    const key = `${element.type}:${element.id}`;
    const previous = byId.get(key);
    if (
      !previous ||
      Number(element.version ?? 0) > Number(previous.version ?? 0)
    )
      byId.set(key, element);
  }
}
const elements = [...byId.values()];
const ways = elements.filter(
  (e) => e.type === 'way' && record(e.tags ?? {}, 'tags').highway,
);
const nodeIds = new Set(
  ways.flatMap((w) => {
    if (!Array.isArray(w.nodes)) throw new Error(`Way ${w.id}: missing nodes`);
    return w.nodes;
  }),
);
const selected = elements.filter(
  (e) =>
    (e.type === 'node' &&
      (nodeIds.has(e.id) || record(e.tags ?? {}, 'tags').name)) ||
    ways.includes(e) ||
    (e.type === 'relation' &&
      (record(e.tags ?? {}, 'tags')['restriction:foot'] ||
        record(e.tags ?? {}, 'tags').type === 'restriction:foot')),
);
// Remove unrelated features and editor identities; retain topology, all tags and element revision evidence.
const normalized = {
  elements: selected
    .map((e) =>
      Object.fromEntries(
        [
          'type',
          'id',
          'lat',
          'lon',
          'nodes',
          'members',
          'tags',
          'version',
          'timestamp',
        ]
          .filter((k) => e[k] !== undefined)
          .map((k) => [
            k,
            k === 'tags'
              ? Object.fromEntries(
                  Object.entries(record(e.tags, 'tags')).sort(([a], [b]) =>
                    a < b ? -1 : 1,
                  ),
                )
              : e[k],
          ]),
      ),
    )
    .sort((a, b) => (`${a.type}:${a.id}` < `${b.type}:${b.id}` ? -1 : 1)),
};
convertOsm(normalized, 'acquisition-validation');
const source = Buffer.from(JSON.stringify(normalized) + '\n');
await writeFile(
  'data/source/ernakulam.osm.json.gz',
  gzipSync(source, { level: 9 }),
);
await writeFile(
  'data/source/manifest.json',
  JSON.stringify(
    {
      sourceUrl: url,
      sourceRequests,
      overpassQuery: query,
      importedAt,
      fetchedAt: sourceRequests
        .map((r) => r.fetchedAt)
        .sort()
        .at(-1),
      acquisition: directory
        ? 'Merged bounded OSM map API responses; duplicate elements use the highest version; raw responses outside Git'
        : path
          ? 'Imported bounded response'
          : 'Overpass POST',
      queryBounds,
      rawResponseSha256: sha256(Buffer.concat(responses.map((r) => r.bytes))),
      normalizedSourceSha256: sha256(source),
      normalization:
        'highway ways, their referenced nodes, explicit pedestrian restriction relations; all tags and element versions/timestamps; no editor identities',
      sourceElements: selected.length,
      sourceWays: ways.length,
      snapshotTimestamp: null,
      snapshotNote:
        'OSM map API does not supply a global snapshot timestamp. Element timestamps are retained; fetchedAt is not a database snapshot guarantee.',
      attribution: '© OpenStreetMap contributors',
      license: 'ODbL-1.0',
      licenseUrl: 'https://www.openstreetmap.org/copyright',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Frozen ${ways.length} road ways and ${nodeIds.size} referenced nodes; raw response remains outside Git.`,
);
