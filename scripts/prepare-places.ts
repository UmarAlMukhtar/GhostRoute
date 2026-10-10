import { writeFile, readFile } from 'node:fs/promises';
import type { RoadGraph, GeoPoint } from '../src/lib/geo/types.ts';
import { createRouter } from '../src/lib/routing/shortest-path.ts';
import { record } from '../src/lib/geo/validate.ts';

/** Derive names from frozen OSM data; only nearest nodes with two-way access to the anchor are indexed. */
export async function preparePlaces(source: unknown, graph: RoadGraph) {
  const router = createRouter(graph);
  const anchorNodeId = '271145615';
  const reverse = new Map(
    Object.keys(graph.nodes).map((id) => [id, [] as string[]]),
  );
  for (const edge of Object.values(graph.edges))
    reverse.get(edge.to)!.push(edge.from);
  function reachable(backward: boolean) {
    const seen = new Set([anchorNodeId]),
      queue = [anchorNodeId];
    for (let i = 0; i < queue.length; i++) {
      const neighbors = backward
        ? reverse.get(queue[i])!
        : graph.outgoing[queue[i]].map((id) => graph.edges[id].to);
      for (const id of neighbors)
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
    }
    return seen;
  }
  const forward = reachable(false),
    backward = reachable(true);
  const raw = record(source, 'Source');
  if (!Array.isArray(raw.elements)) throw new Error('Missing source elements');
  const elements = raw.elements.map((e) => record(e, 'Element'));
  const previous = record(
    JSON.parse(await readFile('data/places/ernakulam.json', 'utf8')),
    'Popular catalog',
  );
  if (!Array.isArray(previous.places))
    throw new Error('Missing popular places');
  const places: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  function add(value: Record<string, unknown>) {
    const coordinate = value.coordinate as GeoPoint;
    const snap = router.snap(coordinate, { maxDistanceMeters: 100 });
    if (
      snap.status !== 'snapped' ||
      !forward.has(snap.node.id) ||
      !backward.has(snap.node.id)
    )
      return;
    const key = `${String(value.category)}:${String(value.name).toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    places.push({
      ...value,
      nodeId: snap.node.id,
      snapMeters: snap.distanceMeters,
    });
  }
  for (const value of previous.places) {
    const place = record(value, 'Popular place');
    if (place.popular !== false) add({ ...place, popular: true });
  }
  for (const element of elements) {
    const tags = record(element.tags ?? {}, 'OSM tags');
    if (typeof tags.name !== 'string' || !tags.name.trim()) continue;
    let coordinate: GeoPoint | undefined,
      category = 'Landmark',
      sourceNodeId: string | undefined;
    if (element.type === 'node') {
      coordinate = [Number(element.lon), Number(element.lat)];
      sourceNodeId = String(element.id);
      if (tags.place) category = 'Locality';
      else if (tags.amenity === 'hospital' || tags.healthcare === 'hospital')
        category = 'Hospital';
      else if (tags.amenity === 'college' || tags.amenity === 'university')
        category = 'College';
      else if (tags.railway === 'station') category = 'Railway station';
    } else if (
      element.type === 'way' &&
      tags.highway &&
      Array.isArray(element.nodes)
    ) {
      const ids = element.nodes.map(String).filter((id) => graph.nodes[id]);
      if (ids.length) {
        sourceNodeId = ids[Math.floor(ids.length / 2)];
        coordinate = graph.nodes[sourceNodeId].coordinate;
        category = 'Road';
      }
    }
    if (
      !coordinate ||
      coordinate[0] < 76.22 ||
      coordinate[0] > 76.42 ||
      coordinate[1] < 9.89 ||
      coordinate[1] > 10.14
    )
      continue;
    add({
      id: `osm-${element.type}-${element.id}`,
      name: tags.name,
      category,
      locality:
        tags['addr:suburb'] ??
        tags['addr:city'] ??
        tags['addr:place'] ??
        'Kochi–Ernakulam',
      coordinate,
      aliases: Object.entries(tags)
        .filter(([key]) =>
          /^(alt_name|short_name|name:en|name:ml|official_name)$/.test(key),
        )
        .map(([, value]) => String(value)),
      popular: false,
      sourceNodeId,
      sourceWayId: element.type === 'way' ? String(element.id) : null,
    });
  }
  if (places.length < 100)
    throw new Error(
      'Expanded index has insufficient meaningful source coverage',
    );
  const catalog = {
    graphVersion: graph.version,
    anchorNodeId,
    sourceUrl: 'data/source/manifest.json',
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL-1.0',
    scope:
      'Named OSM road nodes and landmarks within 100 m of the nearest road node, with directed connectivity to central Kochi',
    places,
  };
  await writeFile(
    'data/places/ernakulam.json',
    JSON.stringify(catalog, null, 2) + '\n',
  );
  await writeFile(
    'public/data/ernakulam/places.json',
    JSON.stringify(catalog) + '\n',
  );
  console.log(
    `Indexed ${places.length} OSM-derived names (${places.filter((p) => p.popular).length} popular suggestions).`,
  );
}
