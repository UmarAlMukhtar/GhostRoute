import { fetchMapAssets } from './fetch-assets';
import type { AssetMessage } from './worker-messages';

const send = (message: AssetMessage) => self.postMessage(message);
self.onmessage = async () => {
  try {
    const assets = await fetchMapAssets();
    // Separate messages keep deserialization interruptible on the UI thread.
    const nodes = Object.values(assets.graph.nodes),
      edges = Object.values(assets.graph.edges);
    for (let i = 0; i < nodes.length; i += 512)
      send({ type: 'nodes', nodes: nodes.slice(i, i + 512) });
    for (let i = 0; i < edges.length; i += 512)
      send({ type: 'edges', edges: edges.slice(i, i + 512) });
    const roads = assets.roads.features.map((f) => f.properties);
    for (let i = 0; i < roads.length; i += 512)
      send({ type: 'roads', roads: roads.slice(i, i + 512) });
    send({
      type: 'ready',
      version: assets.graph.version,
      places: assets.places,
      bounds: assets.bounds,
    });
  } catch (error) {
    send({
      type: 'error',
      error: error instanceof Error ? error.message : 'Invalid dataset',
    });
  }
};
