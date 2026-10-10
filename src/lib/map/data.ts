import type { AssetMessage } from './worker-messages';
import { createFloodEngine, createFloodEngineAsync } from '../simulation/flood';
import { validatePlacesAsync, type SearchPlace } from './places';
import type { GeoPoint, RoadGeoJSON, RoadGraph } from '../geo/types';
import { parseMapAssets } from './assets';
export { parseMapAssets } from './assets';
import { createRouter, createRouterAsync } from '../routing/shortest-path';

export interface Place {
  nodeId: string;
  label: string;
  coordinate: GeoPoint;
}
export interface MapData {
  graph: RoadGraph;
  roads: RoadGeoJSON;
  router: ReturnType<typeof createRouter>;
  engine: ReturnType<typeof createFloodEngine>;
  bounds: [number, number, number, number];
  places: Place[];
}

export function parseMapData(
  graphInput: unknown,
  roadsInput: unknown,
  fixtureInput: unknown,
): MapData {
  const assets = parseMapAssets(graphInput, roadsInput, fixtureInput);
  return {
    ...assets,
    router: createRouter(assets.graph),
    engine: createFloodEngine(assets.graph),
  };
}

// One validated router per browser session, including React Strict Mode remounts.
let pending: Promise<MapData> | undefined;
export function loadMapData(): Promise<MapData> {
  pending ??= new Promise<Omit<MapData, 'router' | 'engine'>>(
    (resolve, reject) => {
      const graph: RoadGraph = {
        version: '',
        nodes: {},
        edges: {},
        outgoing: {},
      };
      const roads: RoadGeoJSON = { type: 'FeatureCollection', features: [] };
      const worker = new Worker(new URL('./data.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<AssetMessage>) => {
        const message = event.data;
        if (message.type === 'nodes') {
          for (const node of message.nodes) {
            graph.nodes[node.id] = node;
            graph.outgoing[node.id] = [];
          }
        } else if (message.type === 'edges') {
          for (const edge of message.edges) {
            graph.edges[edge.id] = edge;
            graph.outgoing[edge.from].push(edge.id);
          }
        } else if (message.type === 'roads') {
          for (const properties of message.roads) {
            const edge = graph.edges[properties.edgeIds[0]];
            const coordinates = edge.id.endsWith(':forward')
              ? edge.geometry.coordinates
              : [...edge.geometry.coordinates].reverse();
            roads.features.push({
              type: 'Feature',
              id: properties.segmentId,
              properties,
              geometry: { type: 'LineString', coordinates },
            });
          }
        } else {
          worker.terminate();
          if (message.type === 'error') reject(new Error(message.error));
          else {
            graph.version = message.version;
            for (const ids of Object.values(graph.outgoing)) ids.sort();
            resolve({
              graph,
              roads,
              places: message.places,
              bounds: message.bounds,
            });
          }
        }
      };
      worker.onerror = () => {
        worker.terminate();
        reject(new Error('Dataset worker failed'));
      };
      worker.postMessage(null);
    },
  )
    .then(async (assets) => {
      const router = await createRouterAsync(assets.graph);
      const engine = await createFloodEngineAsync(assets.graph);
      return { ...assets, router, engine };
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

// Search can become ready independently; a failed index never blocks map routing.
let searchPending: Promise<SearchPlace[]> | undefined;
export function loadSearchPlaces(data: MapData): Promise<SearchPlace[]> {
  searchPending ??= fetch('/data/ernakulam/places.json')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Place index HTTP ${response.status}`);
      return validatePlacesAsync(await response.json(), data);
    })
    .catch((error) => {
      searchPending = undefined;
      throw error;
    });
  return searchPending;
}
