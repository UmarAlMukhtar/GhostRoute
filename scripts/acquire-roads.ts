import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { convertOsm } from '../src/lib/geo/convert.ts';
import { record } from '../src/lib/geo/validate.ts';

// Deliberately one bounded request, never an application or CI startup dependency.
const url =
  'https://api.openstreetmap.org/api/0.6/map.json?bbox=76.274,9.966,76.292,9.984';
const importedAt = new Date().toISOString();
const path = process.argv[2];
const response = path
  ? null
  : await fetch(url, {
      signal: AbortSignal.timeout(60000),
      headers: {
        'User-Agent':
          'GhostRoute-MAP-01 (https://github.com/UmarAlMukhtar/GhostRoute)',
      },
    });
if (response && !response.ok)
  throw new Error(
    `OSM HTTP ${response.status}; keep the existing frozen source`,
  );
const bytes = path
  ? await readFile(path)
  : Buffer.from(await response!.arrayBuffer());
if (bytes.length > 25_000_000)
  throw new Error('OSM response exceeds 25 MB acquisition budget');
const raw = record(JSON.parse(bytes.toString()), 'OSM response');
if (!Array.isArray(raw.elements))
  throw new Error('OSM response has no elements');
const bounds = record(raw.bounds, 'OSM response bounds');
if (
  bounds.minlon !== 76.274 ||
  bounds.minlat !== 9.966 ||
  bounds.maxlon !== 76.292 ||
  bounds.maxlat !== 9.984
)
  throw new Error('OSM response bounds differ from the reviewed request');
const elements = raw.elements.map((e) => record(e, 'OSM element'));
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
    (e.type === 'node' && nodeIds.has(e.id)) ||
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
const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
await writeFile(
  'data/source/ernakulam.osm.json.gz',
  gzipSync(source, { level: 9 }),
);
await writeFile(
  'data/source/manifest.json',
  JSON.stringify(
    {
      sourceUrl: url,
      importedAt,
      fetchedAt: path
        ? (await stat(path)).mtime.toISOString()
        : new Date().toISOString(),
      acquisition: path
        ? 'Local response; fetchedAt uses file modification time as download evidence'
        : 'Direct HTTP GET',
      ...(path
        ? { responseFileModifiedAt: (await stat(path)).mtime.toISOString() }
        : {}),
      queryBounds: [76.274, 9.966, 76.292, 9.984],
      rawResponseSha256: sha256(bytes),
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
